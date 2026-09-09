/**
 * formulas.ts
 * Combat formulas ported from rAthena Renewal (RE) mechanics.
 * Pure functions — no side effects, testable in isolation.
 */
/** Calculates max HP based on level and VIT (rAthena RE linear formula) */
export declare function calcMaxHp(level: number, vit: number, classBaseHp: number): number;
/** Calculates max MP based on level and INT (rAthena RE linear formula) */
export declare function calcMaxMp(level: number, int_: number, classBaseSp: number): number;
/** Physical ATK based on STR and weapon ATK (rAthena RE formula) */
export declare function calcAtk(str: number, weaponAtk: number): number;
/** Magic ATK range [min, max] based on INT (rAthena RE formula) */
export declare function calcMatk(int_: number, staffMatk: number): [number, number];
/** Physical DEF with VIT reduction (rAthena RE soft-DEF formula) */
export declare function calcDef(vit: number, armorDef: number): number;
/** Magic DEF with INT reduction (rAthena RE soft-MDEF formula) */
export declare function calcMdef(int_: number, armorMdef: number): number;
/** HIT rate (accuracy) — rAthena formula: 175 + level + DEX */
export declare function calcHit(level: number, dex: number, luk: number): number;
/** FLEE rate (evasion) — rAthena formula: 100 + level + AGI */
export declare function calcFlee(level: number, agi: number, luk: number): number;
/** Critical rate (out of 100) — rAthena formula */
export declare function calcCritRate(luk: number): number;
/** ASPD (Attack Speed in ms between hits) — lower is faster, min 100ms */
export declare function calcAspd(baseAspd: number, agi: number, dex: number): number;
/**
 * Cast time reduction — rAthena RE formula.
 * 50% fixed cast + 50% variable cast (reduced by DEX and INT).
 * Returns remaining cast time in ms.
 */
export declare function calcCastTime(baseCastMs: number, dex: number, int_: number): number;
/** Physical damage final calculation */
export declare function calcPhysicalDamage(atkTotal: number, targetDef: number, critRoll: boolean, critMultiplier?: number): number;
/** Magic damage final calculation */
export declare function calcMagicalDamage(matkMin: number, matkMax: number, targetMdef: number): number;
/**
 * XP penalty by level difference (rAthena level_penalty).
 * Returns a multiplier [0.1 - 1.0].
 */
export declare function calcExpPenalty(playerLevel: number, mobLevel: number): number;
/**
 * Evaluates whether an item drops given its rate (rAthena 10000-base).
 * Rate 100 = 1%, 5000 = 50%, 10000 = 100%.
 */
export declare function rollDrop(rate: number, luk?: number): boolean;
/** Stat hard cap (rAthena RE: 130 for most) */
export declare const STAT_CAP = 130;
export declare function capStat(value: number): number;
