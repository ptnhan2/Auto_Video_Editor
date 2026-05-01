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
  
  // Update functions
  updateScene: (sceneIndex: number, field: keyof SceneData, value: any) => void;
  updateShot: (sceneIndex: number, shotIndex: number, field: keyof ShotData, value: any) => void;
  updateActor: (sceneIndex: number, shotIndex: number, actorIndex: number, field: keyof ActorData, value: any) => void;
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
      const newData = { ...state.scriptData };
      // @ts-ignore
      newData.scenes[sceneIndex][field] = value;
      return { scriptData: newData };
    });
  },

  updateShot: (sceneIndex, shotIndex, field, value) => {
    set((state) => {
      if (!state.scriptData) return state;
      const newData = { ...state.scriptData };
      const scene = newData.scenes[sceneIndex];
      if (scene.shots && scene.shots[shotIndex]) {
        // @ts-ignore
        scene.shots[shotIndex][field] = value;
      }
      return { scriptData: newData };
    });
  },

  updateActor: (sceneIndex, shotIndex, actorIndex, field, value) => {
    set((state) => {
      if (!state.scriptData) return state;
      const newData = { ...state.scriptData };
      const scene = newData.scenes[sceneIndex];
      if (scene.shots && scene.shots[shotIndex]) {
        const actor = scene.shots[shotIndex].actors[actorIndex];
        if (actor) {
          // @ts-ignore
          actor[field] = value;
        }
      }
      return { scriptData: newData };
    });
  }
}));
