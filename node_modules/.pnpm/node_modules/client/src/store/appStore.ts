import { create } from 'zustand';

export type AppScreen = 'login' | 'register' | 'char_select' | 'char_create' | 'loading' | 'game';

export interface CharacterInfo {
  id: string;
  name: string;
  class: string;
  faction: string;
  level: number;
  mapId: string;
}

interface AppState {
  screen: AppScreen;
  token: string | null;
  username: string | null;
  accountId: string | null;
  characters: CharacterInfo[];
  activeCharacter: CharacterInfo | null;
  setScreen: (screen: AppScreen) => void;
  setAuth: (token: string, accountId: string, username: string) => void;
  setCharacters: (chars: CharacterInfo[]) => void;
  setActiveCharacter: (char: CharacterInfo) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  screen: 'login',
  token: localStorage.getItem('hel_token'),
  username: localStorage.getItem('hel_username'),
  accountId: localStorage.getItem('hel_accountId'),
  characters: [],
  activeCharacter: null,

  setScreen: (screen) => set({ screen }),

  setAuth: (token, accountId, username) => {
    localStorage.setItem('hel_token', token);
    localStorage.setItem('hel_accountId', accountId);
    localStorage.setItem('hel_username', username);
    set({ token, accountId, username });
  },

  setCharacters: (chars) => set({ characters: chars }),

  setActiveCharacter: (char) => set({ activeCharacter: char }),

  logout: () => {
    localStorage.removeItem('hel_token');
    localStorage.removeItem('hel_accountId');
    localStorage.removeItem('hel_username');
    set({ token: null, accountId: null, username: null, screen: 'login', activeCharacter: null, characters: [] });
  },
}));
