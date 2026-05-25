import { create } from 'zustand';

interface DevState {
  devMode: boolean;
  toggleDevMode: () => void;
  setDevMode: (on: boolean) => void;
}

export const useDevStore = create<DevState>((set) => ({
  devMode: true,
  toggleDevMode: () => set((s) => ({ devMode: !s.devMode })),
  setDevMode: (on) => set({ devMode: on }),
}));

export function useShowDemo(): boolean {
  return useDevStore((s) => s.devMode);
}
