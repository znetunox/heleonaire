export type StatusId = string;

export interface StatusSource {
    type: "ITEM" | "SKILL" | "MOB" | "SYSTEM";
    id?: string | number;
}

export interface StatusInstance {
    statusId: StatusId;

    value: number;
    value2: number;
    value3: number;
    value4: number;

    startedAt: number;
    expiresAt: number;

    source?: StatusSource;
}