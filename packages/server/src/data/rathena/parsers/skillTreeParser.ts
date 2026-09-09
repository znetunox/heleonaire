import { resolveYaml } from "../importResolver";
import { normalizeJobName } from "../jobName";

/**
 * ============================================================
 * RAW TYPES
 * ============================================================
 */

interface RawSkillTreeEntry {
    Job?: unknown;
    Inherit?: unknown;
    Tree?: unknown;
}

interface RawSkillTreeFile {
    Body?: unknown;
}

interface RawSkillTreeSkill {
    Name?: unknown;
    MaxLevel?: unknown;
    BaseLevel?: unknown;
    JobLevel?: unknown;
    Exclude?: unknown;
    Requires?: unknown;
}

interface RawSkillRequirement {
    Name?: unknown;
    Level?: unknown;
}

/**
 * ============================================================
 * PARSED TYPES
 * ============================================================
 */

/**
 * Skill prerequisite defined inside skill_tree.yml.
 *
 * Example:
 *
 * Requires:
 *   - Name: KN_PIERCE
 *     Level: 5
 */
export interface ParsedSkillTreeRequirement {
    name: string;
    level: number;
}

/**
 * A skill explicitly defined inside a job's Tree.
 */
export interface ParsedSkillTreeSkill {
    /**
     * rAthena skill name / AegisName.
     *
     * Example:
     * SM_BASH
     */
    name: string;

    /**
     * Maximum level available for this job.
     *
     * MaxLevel: 0 means the skill is removed.
     */
    maxLevel: number;

    /**
     * Minimum BaseLevel required.
     */
    baseLevel?: number;

    /**
     * Minimum JobLevel required.
     */
    jobLevel?: number;

    /**
     * If true, this skill is not inherited by descendants.
     */
    exclude: boolean;

    /**
     * Skill prerequisites.
     */
    requires: ParsedSkillTreeRequirement[];
}

/**
 * Parsed skill tree for one job.
 */
export interface ParsedSkillTreeJob {
    /**
     * Normalized rAthena job name.
     */
    job: string;

    /**
     * Skill trees inherited by this job.
     *
     * IMPORTANT:
     * This is rAthena skill-tree inheritance.
     * It is NOT the Heleonaire class hierarchy.
     */
    inherits: string[];

    /**
     * Skills explicitly defined by this job.
     */
    skills: ParsedSkillTreeSkill[];
}

/**
 * Result of parsing skill_tree.yml.
 */
export interface SkillTreeParseResult {
    jobs: ParsedSkillTreeJob[];
    duplicates: number;
}

/**
 * A skill after resolving the complete inheritance tree.
 */
export interface EffectiveSkillTreeSkill
    extends ParsedSkillTreeSkill {
    /**
     * Job whose Tree supplied the final definition.
     */
    sourceJob: string;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

/**
 * Normalize a skill name.
 *
 * rAthena uses AegisName-style identifiers.
 *
 * Example:
 *
 * "sm_bash" -> "SM_BASH"
 */
function normalizeSkillName(
    name: string,
): string {
    return name.trim().toUpperCase();
}

/**
 * Parse numeric YAML values safely.
 */
function parseNumber(
    value: unknown,
): number | undefined {
    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return Math.trunc(value);
    }

    if (typeof value === "string") {
        const parsed = Number(value);

        if (Number.isFinite(parsed)) {
            return Math.trunc(parsed);
        }
    }

    return undefined;
}

/**
 * Parse YAML boolean values.
 */
function parseBoolean(
    value: unknown,
): boolean {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        return (
            value.trim().toLowerCase() ===
            "true"
        );
    }

    return false;
}

/**
 * ============================================================
 * INHERITANCE
 * ============================================================
 */

/**
 * Parse:
 *
 * Inherit:
 *   NOVICE: true
 *   SWORDMAN: true
 */
function parseInheritance(
    value: unknown,
): string[] {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return [];
    }

    const inherit =
        value as Record<string, unknown>;

    const result: string[] = [];

    for (
        const [jobName, enabled]
        of Object.entries(inherit)
    ) {
        if (!enabled) {
            continue;
        }

        result.push(
            normalizeJobName(jobName),
        );
    }

    return result;
}

/**
 * ============================================================
 * REQUIREMENTS
 * ============================================================
 */

/**
 * Parse skill prerequisites.
 *
 * Example:
 *
 * Requires:
 *   - Name: KN_PIERCE
 *     Level: 5
 *   - Name: KN_SPEARMASTERY
 *     Level: 10
 */
function parseRequirements(
    value: unknown,
): ParsedSkillTreeRequirement[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const result: ParsedSkillTreeRequirement[] = [];

    for (const raw of value) {
        if (
            !raw ||
            typeof raw !== "object"
        ) {
            continue;
        }

        const requirement =
            raw as RawSkillRequirement;

        if (
            typeof requirement.Name !==
            "string" ||
            requirement.Name.trim().length === 0
        ) {
            continue;
        }

        const level =
            parseNumber(
                requirement.Level,
            );

        if (level === undefined) {
            console.warn(
                `[rAthena] Skill requirement without level: ${requirement.Name}`,
            );

            continue;
        }

        result.push({
            name: normalizeSkillName(
                requirement.Name,
            ),
            level,
        });
    }

    return result;
}

/**
 * ============================================================
 * TREE SKILLS
 * ============================================================
 */

/**
 * Parse one Tree skill.
 */
function parseTreeSkill(
    value: unknown,
): ParsedSkillTreeSkill | undefined {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return undefined;
    }

    const raw =
        value as RawSkillTreeSkill;

    if (
        typeof raw.Name !== "string" ||
        raw.Name.trim().length === 0
    ) {
        return undefined;
    }

    const maxLevel =
        parseNumber(
            raw.MaxLevel,
        ) ?? 1;

    const baseLevel =
        parseNumber(
            raw.BaseLevel,
        );

    const jobLevel =
        parseNumber(
            raw.JobLevel,
        );

    return {
        name: normalizeSkillName(
            raw.Name,
        ),

        maxLevel,

        ...(baseLevel !== undefined
            ? { baseLevel }
            : {}),

        ...(jobLevel !== undefined
            ? { jobLevel }
            : {}),

        exclude:
            parseBoolean(
                raw.Exclude,
            ),

        requires:
            parseRequirements(
                raw.Requires,
            ),
    };
}

/**
 * Parse the Tree array of a job.
 */
function parseTree(
    value: unknown,
): ParsedSkillTreeSkill[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const result: ParsedSkillTreeSkill[] = [];

    for (const rawSkill of value) {
        const skill =
            parseTreeSkill(rawSkill);

        if (!skill) {
            console.warn(
                "[rAthena] Invalid skill tree entry.",
            );

            continue;
        }

        result.push(skill);
    }

    return result;
}

/**
 * ============================================================
 * PARSER
 * ============================================================
 */

/**
 * Parse all skill tree definitions from rAthena.
 *
 * This reads:
 *
 * Job
 * Inherit
 * Tree
 */
export function parseSkillTreeDefinitions():
    ParsedSkillTreeJob[] {
    console.log(
        "[rAthena] Reading skill_tree.yml...",
    );

    const resolved =
        resolveYaml<RawSkillTreeFile>(
            "skill_tree.yml",
        );

    console.log(
        `[rAthena] skill_tree.yml source: ${resolved.source}`,
    );

    const body =
        Array.isArray(
            resolved.data?.Body,
        )
            ? resolved.data.Body
            : [];

    console.log(
        `[rAthena] skill_tree.yml entries: ${body.length}`,
    );

    const jobs: ParsedSkillTreeJob[] = [];

    for (const rawEntry of body) {
        if (
            !rawEntry ||
            typeof rawEntry !== "object"
        ) {
            continue;
        }

        const entry =
            rawEntry as RawSkillTreeEntry;

        if (
            typeof entry.Job !== "string" ||
            entry.Job.trim().length === 0
        ) {
            console.warn(
                "[rAthena] skill_tree entry without Job",
            );

            continue;
        }

        const job =
            normalizeJobName(
                entry.Job,
            );

        const inherits =
            parseInheritance(
                entry.Inherit,
            );

        const skills =
            parseTree(
                entry.Tree,
            );

        jobs.push({
            job,
            inherits,
            skills,
        });
    }

    return jobs;
}

/**
 * Parse and deduplicate skill tree jobs.
 */
export function parseSkillTree():
    SkillTreeParseResult {
    const parsed =
        parseSkillTreeDefinitions();

    const uniqueJobs =
        new Map<
            string,
            ParsedSkillTreeJob
        >();

    let duplicates = 0;

    for (const job of parsed) {
        if (
            uniqueJobs.has(job.job)
        ) {
            duplicates++;

            console.warn(
                `[rAthena] Duplicate skill tree job: ${job.job}`,
            );

            continue;
        }

        uniqueJobs.set(
            job.job,
            job,
        );
    }

    const jobs =
        Array.from(
            uniqueJobs.values(),
        );

    console.log(
        `[rAthena] skill_tree jobs parsed: ${jobs.length}`,
    );

    console.log(
        `[rAthena] skill_tree duplicates: ${duplicates}`,
    );

    const totalSkills =
        jobs.reduce(
            (total, job) =>
                total + job.skills.length,
            0,
        );

    console.log(
        `[rAthena] explicit skill tree entries: ${totalSkills}`,
    );

    return {
        jobs,
        duplicates,
    };
}

/**
 * ============================================================
 * EFFECTIVE SKILL TREE
 * ============================================================
 */

/**
 * Resolve the final/effective skill tree for one job.
 *
 * Example:
 *
 * resolveEffectiveSkillTree(
 *   "KNIGHT",
 *   jobs,
 * )
 *
 * produces the effective combination of:
 *
 * NOVICE
 * SWORDMAN
 * KNIGHT
 *
 * respecting rAthena's:
 *
 * - Inherit
 * - Exclude
 * - MaxLevel: 0
 * - skill overrides
 *
 * IMPORTANT:
 *
 * Inherit describes skill inheritance.
 * It is not the same thing as the custom
 * Heleonaire GameClass.parentId hierarchy.
 */
export function resolveEffectiveSkillTree(
    jobName: string,
    jobs: ParsedSkillTreeJob[],
): EffectiveSkillTreeSkill[] {
    const normalizedJob =
        normalizeJobName(
            jobName,
        );

    const jobMap =
        new Map<
            string,
            ParsedSkillTreeJob
        >();

    for (const job of jobs) {
        jobMap.set(
            job.job,
            job,
        );
    }

    const job =
        jobMap.get(
            normalizedJob,
        );

    if (!job) {
        throw new Error(
            `Skill tree job not found: ${normalizedJob}`,
        );
    }

    /**
     * Final effective skills.
     *
     * Key:
     *   skill AegisName
     */
    const effective =
        new Map<
            string,
            EffectiveSkillTreeSkill
        >();

    /**
     * Apply the Tree belonging to an inherited job.
     */
    const applyInheritedTree = (
        sourceJob: ParsedSkillTreeJob,
    ): void => {
        for (const skill of sourceJob.skills) {
            /**
             * rAthena:
             *
             * Exclude means this skill exists in the
             * source job but must not be inherited.
             */
            if (skill.exclude) {
                continue;
            }

            /**
             * MaxLevel 0 removes the skill.
             */
            if (skill.maxLevel <= 0) {
                effective.delete(
                    skill.name,
                );

                continue;
            }

            effective.set(
                skill.name,
                {
                    ...skill,
                    sourceJob:
                        sourceJob.job,
                },
            );
        }
    };

    /**
     * rAthena's Inherit list is already an
     * explicit inheritance chain.
     *
     * Example:
     *
     * DRAGON_KNIGHT:
     *
     * NOVICE
     * SWORDMAN
     * KNIGHT
     * LORD_KNIGHT
     * RUNE_KNIGHT
     * RUNE_KNIGHT_T
     */
    for (
        const inheritedJobName
        of job.inherits
    ) {
        const inheritedJob =
            jobMap.get(
                inheritedJobName,
            );

        if (!inheritedJob) {
            throw new Error(
                `Skill tree inheritance target not found: ${inheritedJobName} -> ${normalizedJob}`,
            );
        }

        applyInheritedTree(
            inheritedJob,
        );
    }

    /**
     * Finally apply the current job's own Tree.
     *
     * IMPORTANT:
     *
     * Exclude on the current job does NOT remove
     * the skill from the current job.
     *
     * It only matters when descendants inherit
     * this job's Tree.
     */
    for (const skill of job.skills) {
        /**
         * MaxLevel 0 explicitly removes
         * a previously inherited skill.
         */
        if (skill.maxLevel <= 0) {
            effective.delete(
                skill.name,
            );

            continue;
        }

        effective.set(
            skill.name,
            {
                ...skill,
                sourceJob:
                    job.job,
            },
        );
    }

    return Array.from(
        effective.values(),
    );
}