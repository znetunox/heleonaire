const JOB_ALIASES = {
    SUPERNOVICE: "SUPER_NOVICE",
};
export function normalizeJobName(name) {
    const normalized = name.trim().toUpperCase();
    return JOB_ALIASES[normalized] ?? normalized;
}
