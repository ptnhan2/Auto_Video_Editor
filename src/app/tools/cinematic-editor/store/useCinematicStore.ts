import { create } from 'zustand';

interface CinematicStore {
  backgroundId: string;
  layoutStyle: string;
  visualMetaphor: string;
  transitionIn: string;
  atmosphereFx: string;
  assetDynamics: string;
  setBackground: (id: string) => void;
  setLayoutStyle: (v: string) => void;
  setVisualMetaphor: (v: string) => void;
  setTransitionIn: (v: string) => void;
  setAtmosphereFx: (v: string) => void;
  setAssetDynamics: (v: string) => void;
  resetEffects: () => void;
}

export const useCinematicStore = create<CinematicStore>((set) => ({
  backgroundId: 'bg_transparent',
  layoutStyle: 'none',
  visualMetaphor: 'none',
  transitionIn: 'none',
  atmosphereFx: 'none',
  assetDynamics: 'none',
  setBackground: (id) => set({ backgroundId: id }),
  setLayoutStyle: (v) => set({ layoutStyle: v }),
  setVisualMetaphor: (v) => set({ visualMetaphor: v }),
  setTransitionIn: (v) => set({ transitionIn: v }),
  setAtmosphereFx: (v) => set({ atmosphereFx: v }),
  setAssetDynamics: (v) => set({ assetDynamics: v }),
  resetEffects: () => set({ 
    layoutStyle: 'none', 
    visualMetaphor: 'none', 
    transitionIn: 'none', 
    atmosphereFx: 'none', 
    assetDynamics: 'none' 
  }),
}));
