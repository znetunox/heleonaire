const JOB_ALIASES: Record<string, string> = {
  SUPERNOVICE: "SUPER_NOVICE",
};

export function normalizeJobName(name: string): string {
  const normalized = name.trim().toUpperCase();

  return JOB_ALIASES[normalized] ?? normalized;
}