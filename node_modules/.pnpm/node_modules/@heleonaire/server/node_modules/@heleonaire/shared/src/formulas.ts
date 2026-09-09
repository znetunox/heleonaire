/**
 * formulas.ts
 * Combat formulas ported from rAthena Renewal (RE) mechanics.
 * Pure functions — no side effects, testable in isolation.
 */

import type { HeleCharStats, RathenaMob } from './rathenaTypes';

// ─── Base HP/SP ──────────────────────────────────────────────────────────────

/** Calculates max HP based on level and VIT (rAthena RE linear formula) */
export function calcMaxHp(level: number, vit: number, classBaseHp: number): number {
  return Math.floor(classBaseHp + level * (vit + (level * 0.5)));
}

/** Calculates max MP based on level and INT (rAthena RE linear formula) */
export function calcMaxMp(level: number, int_: number, classBaseSp: number): number {
  return Math.floor(classBaseSp + level * (int_ / 6) + level * 0.5);
}

// ─── ATK / MATK ──────────────────────────────────────────────────────────────

/** Physical ATK based on STR and weapon ATK (rAthena RE formula) */
export function calcAtk(str: number, weaponAtk: number): number {
  const strBonus = Math.floor(str / 10) * Math.floor(str / 10);
  return weaponAtk + str + strBonus;
}

/** Magic ATK range [min, max] based on INT (rAthena RE formula) */
export function calcMatk(int_: number, staffMatk: number): [number, number] {
  const intBonus = Math.floor(int_ / 7) * Math.floor(int_ / 7);
  const base = staffMatk + int_ + intBonus;
  const min_ = base - Math.floor(int_ / 5);
  const max_ = base + Math.floor(int_ / 5);
  return [Math.max(min_, 0), Math.max(max_, 0)];
}

// ─── DEF / MDEF ──────────────────────────────────────────────────────────────

/** Physical DEF with VIT reduction (rAthena RE soft-DEF formula) */
export function calcDef(vit: number, armorDef: number): number {
  const softDef = Math.floor(vit / 2);
  return armorDef + softDef;
}

/** Magic DEF with INT reduction (rAthena RE soft-MDEF formula) */
export function calcMdef(int_: number, armorMdef: number): number {
  const softMdef = Math.floor(int_ / 4);
  return armorMdef + softMdef;
}

// ─── HIT / FLEE ──────────────────────────────────────────────────────────────

/** HIT rate (accuracy) — rAthena formula: 175 + level + DEX */
export function calcHit(level: number, dex: number, luk: number): number {
  return 175 + level + dex + Math.floor(luk / 3);
}

/** FLEE rate (evasion) — rAthena formula: 100 + level + AGI */
export function calcFlee(level: number, agi: number, luk: number): number {
  return 100 + level + agi + Math.floor(luk / 5);
}

// ─── CRIT ─────────────────────────────────────────────────────────────────────

/** Critical rate (out of 100) — rAthena formula */
export function calcCritRate(luk: number): number {
  return Math.min(Math.floor(luk / 3) + 1, 100);
}

// ─── ASPD ─────────────────────────────────────────────────────────────────────

/** ASPD (Attack Speed in ms between hits) — lower is faster, min 100ms */
export function calcAspd(baseAspd: number, agi: number, dex: number): number {
  const reduction = Math.floor(agi * 0.25 + dex * 0.1);
  return Math.max(100, baseAspd - reduction);
}

// ─── Cast Time ───────────────────────────────────────────────────────────────

/**
 * Cast time reduction — rAthena RE formula.
 * 50% fixed cast + 50% variable cast (reduced by DEX and INT).
 * Returns remaining cast time in ms.
 */
export function calcCastTime(baseCastMs: number, dex: number, int_: number): number {
  const variablePart = baseCastMs * 0.5;
  const fixedPart = baseCastMs * 0.5;
  const varReduction = Math.min(1, (dex * 2 + int_) / 530); // cap at 100%
  const effectiveVar = variablePart * (1 - varReduction);
  return Math.floor(fixedPart + effectiveVar);
}

// ─── Damage ─────────────────────────────────────────────────────────────────

/** Physical damage final calculation */
export function calcPhysicalDamage(
  atkTotal: number,
  targetDef: number,
  critRoll: boolean,
  critMultiplier: number = 1.4
): number {
  const baseDmg = Math.max(1, atkTotal - targetDef);
  const critted = critRoll ? Math.floor(baseDmg * critMultiplier) : baseDmg;
  return critted;
}

/** Magic damage final calculation */
export function calcMagicalDamage(
  matkMin: number,
  matkMax: number,
  targetMdef: number
): number {
  const matk = matkMin + Math.floor(Math.random() * (matkMax - matkMin + 1));
  const reduced = Math.max(1, matk - targetMdef);
  return reduced;
}

// ─── XP ─────────────────────────────────────────────────────────────────────

/**
 * XP penalty by level difference (rAthena level_penalty).
 * Returns a multiplier [0.1 - 1.0].
 */
export function calcExpPenalty(playerLevel: number, mobLevel: number): number {
  const diff = Math.abs(playerLevel - mobLevel);
  if (diff === 0) return 1.0;
  if (diff <= 3) return 0.9;
  if (diff <= 6) return 0.75;
  if (diff <= 9) return 0.5;
  if (diff <= 12) return 0.25;
  return 0.1;
}

// ─── Drop Chance ─────────────────────────────────────────────────────────────

/**
 * Evaluates whether an item drops given its rate (rAthena 10000-base).
 * Rate 100 = 1%, 5000 = 50%, 10000 = 100%.
 */
export function rollDrop(rate: number, luk: number = 0): boolean {
  const lukBonus = Math.floor(luk / 3); // slight lucky buff
  const adjustedRate = Math.min(10000, rate + lukBonus);
  return Math.floor(Math.random() * 10000) < adjustedRate;
}

// ─── Stat Cap ────────────────────────────────────────────────────────────────

/** Stat hard cap (rAthena RE: 130 for most) */
export const STAT_CAP = 130;

export function capStat(value: number): number {
  return Math.min(STAT_CAP, Math.max(1, value));
}
