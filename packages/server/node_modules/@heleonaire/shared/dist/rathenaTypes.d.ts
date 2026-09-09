export interface RathenaMob {
    id: number;
    aegisName: string;
    name: string;
    level: number;
    hp: number;
    sp: number;
    baseExp: number;
    jobExp: number;
    attack: number;
    attack2: number;
    defense: number;
    magicDefense: number;
    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;
    attackRange: number;
    skillRange: number;
    chaseRange: number;
    size: 'Small' | 'Medium' | 'Large';
    race: string;
    element: string;
    elementLevel: number;
    walkSpeed: number;
    attackDelay: number;
    attackMotion: number;
    damageMotion: number;
    ai: string;
    drops: RathenaDropEntry[];
}
export interface RathenaDropEntry {
    item: string;
    rate: number;
    stealProtected?: boolean;
}
export interface RathenaItem {
    id: number;
    aegisName: string;
    name: string;
    type: string;
    subType?: string;
    buy: number;
    sell: number;
    weight: number;
    attack?: number;
    magicAttack?: number;
    defense?: number;
    range?: number;
    slots?: number;
    weaponLevel?: number;
    armorLevel?: number;
    equipLevelMin?: number;
    refineable?: boolean;
}
export type HeleClass = 'knight' | 'assassin' | 'archer' | 'mage' | 'cleric';
export type HeleFaction = 'heleonaire' | 'darkpact';
export type HeleElement = 'neutral' | 'fire' | 'water' | 'wind' | 'earth' | 'holy' | 'shadow' | 'ghost' | 'undead';
export type MobRace = 'formless' | 'undead' | 'brute' | 'plant' | 'insect' | 'fish' | 'demon' | 'demi-human' | 'angel' | 'dragon';
export interface HeleCharStats {
    str: number;
    agi: number;
    vit: number;
    int: number;
    dex: number;
    luk: number;
}
export interface HeleCharFullState {
    id: string;
    name: string;
    class: HeleClass;
    faction: HeleFaction;
    level: number;
    baseExp: number;
    jobExp: number;
    stats: HeleCharStats;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    x: number;
    y: number;
    targetId?: string;
}
