import { create } from 'zustand';
import { VideoScriptData, ShotData, SceneData, ActorData } from '@/shared/types/ai-schemas';

interface JsonStore {
  scriptFiles: { name: string; id: string }[];
  selectedFile: string | null;
  scriptData: VideoScriptData | null;
  isLoading: boolean;
  isSaving: boolean;
  
  fetchFiles: () => Promise<void>;
  loadScript: (filename: string) => Promise<void>;
  saveScript: () => Promise<void>;
  
  // Update functions using Generics for Type Safety
  updateScene: <K extends keyof SceneData>(sceneIndex: number, field: K, value: SceneData[K]) => void;
  updateShot: <K extends keyof ShotData>(sceneIndex: number, shotIndex: number, field: K, value: ShotData[K]) => void;
  updateActor: <K extends keyof ActorData>(sceneIndex: number, shotIndex: number, actorIndex: number, field: K, value: ActorData[K]) => void;
}

export const useJsonStore = create<JsonStore>((set, get) => ({
  scriptFiles: [],
  selectedFile: null,
  scriptData: null,
  isLoading: false,
  isSaving: false,

  fetchFiles: async () => {
    try {
      const res = await fetch('/api/script');
      const data = await res.json();
      if (data.files) {
        set({ scriptFiles: data.files });
      }
    } catch (e) {
      console.error(e);
    }
  },

  loadScript: async (filename: string) => {
    set({ isLoading: true, selectedFile: filename });
    try {
      const res = await fetch(`/scripts/${filename}`);
      const data = await res.json();
      set({ scriptData: data, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false, scriptData: null });
    }
  },

  saveScript: async () => {
    const { selectedFile, scriptData } = get();
    if (!selectedFile || !scriptData) return;

    set({ isSaving: true });
    try {
      const res = await fetch('/api/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile, data: scriptData })
      });
      if (!res.ok) throw new Error('Save failed');
      alert('Đã lưu thành công đè lên file gốc!');
    } catch (e) {
      console.error(e);
      alert('Lỗi khi lưu file');
    } finally {
      set({ isSaving: false });
    }
  },

  updateScene: (sceneIndex, field, value) => {
    set((state) => {
      if (!state.scriptData) return state;
      const newScenes = [...state.scriptData.scenes];
      newScenes[sceneIndex] = { ...newScenes[sceneIndex], [field]: value };
      
      return { 
        scriptData: { ...state.scriptData, scenes: newScenes } 
      };
    });
  },

  updateShot: (sceneIndex, shotIndex, field, value) => {
    set((state) => {
      if (!state.scriptData) return state;
      const newScenes = [...state.scriptData.scenes];
      const newShots = [...(newScenes[sceneIndex].shots || [])];
      
      newShots[shotIndex] = { ...newShots[shotIndex], [field]: value };
      newScenes[sceneIndex] = { ...newScenes[sceneIndex], shots: newShots };

      return { 
        scriptData: { ...state.scriptData, scenes: newScenes } 
      };
    });
  },

  updateActor: (sceneIndex, shotIndex, actorIndex, field, value) => {
    set((state) => {
      if (!state.scriptData) return state;
      const newScenes = [...state.scriptData.scenes];
      const newShots = [...(newScenes[sceneIndex].shots || [])];
      const newActors = [...(newShots[shotIndex].actors || [])];

      newActors[actorIndex] = { ...newActors[actorIndex], [field]: value };
      newShots[shotIndex] = { ...newShots[shotIndex], actors: newActors };
      newScenes[sceneIndex] = { ...newScenes[sceneIndex], shots: newShots };

      return { 
        scriptData: { ...state.scriptData, scenes: newScenes } 
      };
    });
  }
}));