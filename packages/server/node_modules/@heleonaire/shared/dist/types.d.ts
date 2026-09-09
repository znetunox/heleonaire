export interface Position {
    x: number;
    y: number;
    z?: number;
}
export interface PlayerState {
    id: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    position: Position;
    targetId?: string;
    class: 'knight' | 'assassin' | 'archer' | 'mage' | 'cleric';
    faction: 'heleonaire' | 'darkpact';
}
export interface GameState {
    players: Record<string, PlayerState>;
}
