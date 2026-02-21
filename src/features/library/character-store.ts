import { create } from 'zustand';
import { Skeleton } from './services/rigger';

export interface Character {
  id: string;
  name: string;
  svgContent: string;
  skeleton: Skeleton;
  stylePreset?: string;
}

interface CharacterLibraryState {
  characters: Character[];
  selectedCharacterId: string | null;
  addCharacter: (character: Character) => void;
  selectCharacter: (id: string) => void;
  updateCharacterStyle: (id: string, style: string) => void;
}

export const useCharacterLibraryStore = create<CharacterLibraryState>((set) => ({
  characters: [],
  selectedCharacterId: null,
  addCharacter: (character) => 
    set((state) => ({ characters: [...state.characters, character] })),
  selectCharacter: (id) => 
    set({ selectedCharacterId: id }),
  updateCharacterStyle: (id, style) =>
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, stylePreset: style } : c
      ),
    })),
}));
