import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { RATHENA_SRC_COMMON } from "../paths";

export interface ParsedJob {
  id: number;
  aegisName: string;
}

interface RawEnumEntry {
  name: string;
  expression?: string;
}

function removeComments(line: string): string {
  return line
    .replace(/\/\*.*?\*\//g, "")
    .replace(/\/\/.*$/g, "");
}

function normalizeJobName(
  enumName: string
): string {
  return enumName.replace(/^JOB_/, "");
}

function parseEnumEntry(
  line: string
): RawEnumEntry | undefined {
  const clean = removeComments(line)
    .trim()
    .replace(/,$/, "")
    .trim();

  if (!clean) {
    return undefined;
  }

  /*
   * Aceita:
   *
   * JOB_NOVICE
   * JOB_NOVICE = 0
   * JOB_RUNE_KNIGHT = 4054
   * JOB_SWORDMAN_HIGH
   * JOB_SOMETHING = JOB_OTHER + 1
   */

  const match = clean.match(
    /^(JOB_[A-Za-z0-9_]+)(?:\s*=\s*(.+))?$/
  );

  if (!match) {
    return undefined;
  }

  return {
    name: match[1],
    expression: match[2]?.trim(),
  };
}

function tokenizeExpression(
  expression: string
): string[] | undefined {
  const tokens =
    expression.match(
      /0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?|[()+\-*/%]|\bJOB_[A-Za-z0-9_]+\b/g
    );

  if (!tokens) {
    return undefined;
  }

  /*
   * Garante que não exista texto desconhecido
   * na expressão.
   */
  const normalized = tokens.join("");

  const original = expression.replace(
    /\s+/g,
    ""
  );

  if (normalized !== original) {
    return undefined;
  }

  return tokens;
}

function evaluateExpression(
    expression: string,
    knownValues: Map<string, number>
): number | undefined {
    const tokens =
        tokenizeExpression(expression);

    if (!tokens || tokens.length === 0) {
        return undefined;
    }

    const tokenList = tokens;

    let position = 0;

  function parseExpression():
    number | undefined {
    let value = parseTerm();

    if (value === undefined) {
      return undefined;
    }

      while (
          position < tokenList.length &&
          (tokenList[position] === "+" ||
              tokenList[position] === "-")
      ) {
          const operator = tokenList[position++];

          const right = parseTerm();

      if (right === undefined) {
        return undefined;
      }

      if (operator === "+") {
        value += right;
      } else {
        value -= right;
      }
    }

    return value;
  }

  function parseTerm():
    number | undefined {
    let value = parseFactor();

    if (value === undefined) {
      return undefined;
    }

      while (
          position < tokenList.length &&
          (tokenList[position] === "*" ||
              tokenList[position] === "/" ||
              tokenList[position] === "%")
      ) {
          const operator = tokenList[position++];

      const right = parseFactor();

      if (right === undefined) {
        return undefined;
      }

      if (operator === "*") {
        value *= right;
      } else if (operator === "/") {
        if (right === 0) {
          return undefined;
        }

        value /= right;
      } else {
        if (right === 0) {
          return undefined;
        }

        value %= right;
      }
    }

    return value;
  }

  function parseFactor():
    number | undefined {
      if (position >= tokenList.length) {
          return undefined;
      }

      const token = tokenList[position];

    if (token === "+") {
      position++;

      return parseFactor();
    }

    if (token === "-") {
      position++;

      const value = parseFactor();

      if (value === undefined) {
        return undefined;
      }

      return -value;
    }

    if (token === "(") {
      position++;

      const value =
        parseExpression();

        if (
            position >= tokenList.length ||
            tokenList[position] !== ")"
        ) {
            return undefined;
        }

      position++;

      return value;
    }

    /*
     * JOB_* reference.
     */
    if (token.startsWith("JOB_")) {
      const value =
        knownValues.get(token);

      if (value === undefined) {
        return undefined;
      }

      position++;

      return value;
    }

    /*
     * Hexadecimal.
     */
    if (/^0[xX][0-9a-fA-F]+$/.test(token)) {
      position++;

      return Number.parseInt(
        token,
        16
      );
    }

    /*
     * Decimal.
     */
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      position++;

      return Number(token);
    }

    return undefined;
  }

  const result =
    parseExpression();

  if (result === undefined) {
    return undefined;
  }

  if (position !== tokens.length) {
    return undefined;
  }

  return result;
}

function parseJobEnum(
  content: string
): ParsedJob[] {
  const lines =
    content.split(/\r?\n/);

  const jobs: ParsedJob[] = [];

  const knownValues =
    new Map<string, number>();

  let insideJobEnum = false;

  /*
   * C++ enum começa implicitamente em 0
   * quando o primeiro membro não possui "=".
   */
  let currentValue = -1;

  for (const originalLine of lines) {
    const clean =
      removeComments(originalLine)
        .trim();

    if (!insideJobEnum) {
      if (
        /\benum\s+e_job\b/.test(clean)
      ) {
        insideJobEnum = true;
      }

      continue;
    }

    /*
     * Terminou o enum.
     */
    if (
      clean === "};" ||
      clean.startsWith("};")
    ) {
      break;
    }

    if (!clean) {
      continue;
    }

    const entry =
      parseEnumEntry(clean);

    if (!entry) {
      continue;
    }

    let value: number | undefined;

    /*
     * Valor explícito.
     */
    if (entry.expression !== undefined) {
      value =
        evaluateExpression(
          entry.expression,
          knownValues
        );

      if (value === undefined) {
        console.warn(
          `[rAthena] Unable to resolve job ID: ${entry.name} = ${entry.expression}`
        );

        continue;
      }
    } else {
      /*
       * Valor implícito:
       *
       * primeiro membro = 0
       * próximo = anterior + 1
       */
      value = currentValue + 1;
    }

    currentValue = value;

    knownValues.set(
      entry.name,
      value
    );

    jobs.push({
      id: value,
      aegisName:
        normalizeJobName(entry.name),
    });
  }

  return jobs;
}

export function parseJobDefinitions():
  ParsedJob[] {
  const filePath =
    join(
      RATHENA_SRC_COMMON,
      "mmo.hpp"
    );

  if (!existsSync(filePath)) {
    throw new Error(
      `rAthena mmo.hpp not found: ${filePath}`
    );
  }

  const content =
    readFileSync(
      filePath,
      "utf-8"
    );

  return parseJobEnum(content);
}

export interface JobParseResult {
  jobs: ParsedJob[];
  duplicates: number;
}

export function parseJobs():
  JobParseResult {
  console.log(
    "[rAthena] Reading src/common/mmo.hpp..."
  );

  const parsed =
    parseJobDefinitions();

  const uniqueJobs =
    new Map<number, ParsedJob>();

  let duplicates = 0;

  for (const job of parsed) {
    if (
      uniqueJobs.has(job.id)
    ) {
      duplicates++;

      const existing =
        uniqueJobs.get(job.id);

      console.warn(
        `[rAthena] Duplicate Job ID ${job.id}: ` +
        `${existing?.aegisName} / ${job.aegisName}`
      );

      continue;
    }

    uniqueJobs.set(
      job.id,
      job
    );
  }

  const jobs =
    Array.from(
      uniqueJobs.values()
    );

  console.log(
    `[rAthena] mmo.hpp jobs parsed: ${jobs.length}`
  );

  console.log(
    `[rAthena] mmo.hpp duplicates: ${duplicates}`
  );

  return {
    jobs,
    duplicates,
  };
}