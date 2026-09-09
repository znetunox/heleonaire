import { create } from 'zustand';

export interface CombatLogMessage {
  id: string;
  text: string;
  color?: string;
  timestamp: string;
}

export interface PlayerHUDInfo {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    baseExp: number;
    maxBaseExp: number;
    class: string;

    str?: number;
    agi?: number;
    vit?: number;
    int?: number;
    dex?: number;
    luk?: number;

    statPoints?: number;
    gold?: number;

    atk?: number;
    matk?: number;
    def?: number;
    magicDefense?: number;
    hit?: number;
    flee?: number;
    crit?: number;
    aspd?: number;
}

export interface TargetHUDInfo {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
}

export interface ItemSlotInfo {
    id: string;
    itemId: number;
    itemName: string;
    quantity: number;
    slot: number;
    instanceId: string | null;
    refineLevel: number;
}

interface HUDState {
    playerInfo: PlayerHUDInfo | null;
    targetInfo: TargetHUDInfo | null;
    logs: CombatLogMessage[];
    inventoryItems: ItemSlotInfo[];
    showInventory: boolean;
    showStatus: boolean;
    showSkills: boolean;

    room?: any;

    setRoom: (room: any) => void;
    setPlayerInfo: (info: Partial<PlayerHUDInfo>) => void;
    setTargetInfo: (info: TargetHUDInfo | null) => void;
    setInventoryItems: (items: ItemSlotInfo[]) => void
    addLog: (text: string, color?: string) => void;
    toggleInventory: () => void;
    toggleStatus: () => void;
    toggleSkills: () => void;
}

export const useHUDStore = create<HUDState>((set) => ({
  playerInfo: null,
  targetInfo: null,
  logs: [],
  inventoryItems: [],
  showInventory: false,
  showStatus: false,
  showSkills: false,

  room: undefined,

  setRoom: (room) => set({ room }),
  setInventoryItems: (items) => set({ inventoryItems: items }),
  setPlayerInfo: (info) =>
    set((state) => ({
      playerInfo: state.playerInfo ? { ...state.playerInfo, ...info } : (info as PlayerHUDInfo),
    })),

  setTargetInfo: (info) => set({ targetInfo: info }),

  addLog: (text, color = '#ffffff') =>
    set((state) => ({
      logs: [
        ...state.logs.slice(-49),
        {
          id: Math.random().toString(36).slice(2),
          text,
          color,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ],
    })),

  toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
  toggleStatus: () => set((state) => ({ showStatus: !state.showStatus })),
  toggleSkills: () => set((state) => ({ showSkills: !state.showSkills })),
}));
