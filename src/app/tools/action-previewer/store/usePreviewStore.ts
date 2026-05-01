import { create } from 'zustand';

interface PreviewStore {
  characterId: string;
  actionId: string;
  expressionId: string;
  facing: 'left' | 'right';
  isSpeaking: boolean;
  setCharacter: (id: string) => void;
  setAction: (id: string) => void;
  setExpression: (id: string) => void;
  setFacing: (facing: 'left' | 'right') => void;
  setIsSpeaking: (speaking: boolean) => void;
}

export const usePreviewStore = create<PreviewStore>((set) => ({
  characterId: 'char_001',
  actionId: 'walk_cycle',
  expressionId: 'neutral',
  facing: 'left',
  isSpeaking: false,
  setCharacter: (id) => set({ characterId: id }),
  setAction: (id) => set({ actionId: id }),
  setExpression: (id) => set({ expressionId: id }),
  setFacing: (facing) => set({ facing }),
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
}));
