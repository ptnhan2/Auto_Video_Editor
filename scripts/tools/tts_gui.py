import tkinter as tk
from tkinter import ttk, messagebox
import os
import asyncio
import threading
import ctypes
import sys

# Thêm đường dẫn để import từ scripts/core/tts
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from scripts.core.tts.providers.edge import run_edge
from scripts.core.tts.providers.tiktok import run_tiktok
from scripts.core.tts.providers.elevenlabs import run_elevenlabs, fetch_voices, fetch_shared_voices

# --- Quản lý Thư mục ---
ASSET_DIR = os.path.join("public", "assets", "audio", "tts")
if not os.path.exists(ASSET_DIR):
    os.makedirs(ASSET_DIR)

# --- Quản lý API Key ElevenLabs ---
ELEVENLABS_KEYS = []
def load_keys():
    global ELEVENLABS_KEYS
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("ELEVENLABS_KEYS="):
                    keys_str = line.strip().split("=", 1)[1].strip('"').strip("'")
                    ELEVENLABS_KEYS = [k.strip() for k in keys_str.split(",") if k.strip()]

load_keys()

# Mapping dữ liệu
VOICE_MAPPING = {
    "Edge TTS (Azure)": {
        "Hoài My (Nữ - Miền Bắc)": "vi-VN-HoaiMyNeural",
        "Nam Minh (Nam - Miền Bắc)": "vi-VN-NamMinhNeural"
    },
    "TikTok/CapCut Bridge": {
        "Hoài Vy (BV074 - Chuẩn)": "BV074_streaming",
        "Nam Chuẩn (BV075)": "BV075_streaming",
        "Như Quỳnh (Viral)": "vi_female_nhu_quynh",
        "Maika (Trẻ trung)": "vi_female_maika",
        "Minh Quân (Trầm ấm)": "vi_male_minh_quan"
    },
    "ElevenLabs (Cao cấp)": {
        "Đang tải dữ liệu...": "loading"
    }
}

MODELS_LIST = ["eleven_v3", "eleven_flash_v2_5", "eleven_multilingual_v2"]

class TTSApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Video Editor TTS Tool")
        self.root.geometry("850x750")
        
        # --- Cài đặt Audio ---
        input_frame = ttk.LabelFrame(root, text="Cấu hình giọng nói", padding="10")
        input_frame.pack(fill="x", padx=10, pady=5)
        
        # Engine & Voice
        ttk.Label(input_frame, text="Nền tảng:").grid(row=0, column=0, sticky="w", pady=5)
        self.engine_var = tk.StringVar(value=list(VOICE_MAPPING.keys())[0])
        self.engine_combo = ttk.Combobox(input_frame, textvariable=self.engine_var, values=list(VOICE_MAPPING.keys()), state="readonly", width=25)
        self.engine_combo.grid(row=0, column=1, sticky="w", pady=5, padx=5)
        self.engine_combo.bind("<<ComboboxSelected>>", self.update_engine_view)
        
        ttk.Label(input_frame, text="Giọng đọc:").grid(row=0, column=2, sticky="w", pady=5, padx=10)
        self.voice_var = tk.StringVar()
        self.voice_combo = ttk.Combobox(input_frame, textvariable=self.voice_var, state="readonly", width=30)
        self.voice_combo.grid(row=0, column=3, sticky="w", pady=5)
        
        # ElevenLabs Params
        self.el_params_frame = ttk.Frame(input_frame)
        self.el_params_frame.grid(row=1, column=0, columnspan=4, sticky="ew", pady=10)
        
        ttk.Label(self.el_params_frame, text="Model:").grid(row=0, column=0, sticky="w")
        self.model_var = tk.StringVar(value=MODELS_LIST[0])
        self.model_combo = ttk.Combobox(self.el_params_frame, textvariable=self.model_var, values=MODELS_LIST, state="readonly", width=22)
        self.model_combo.grid(row=0, column=1, padx=5)

        ttk.Label(self.el_params_frame, text="Stability:").grid(row=1, column=0, sticky="w")
        self.stability_val = tk.StringVar(value="0.50")
        self.stability_scale = ttk.Scale(self.el_params_frame, from_=0, to=1, orient="horizontal",
                                        command=lambda v: self.stability_val.set(f"{float(v):.2f}"))
        self.stability_scale.set(0.5)
        self.stability_scale.grid(row=1, column=1, sticky="ew", padx=5)
        ttk.Label(self.el_params_frame, textvariable=self.stability_val, width=4).grid(row=1, column=2)

        ttk.Label(self.el_params_frame, text="Similarity:").grid(row=2, column=0, sticky="w")
        self.similarity_val = tk.StringVar(value="0.75")
        self.similarity_scale = ttk.Scale(self.el_params_frame, from_=0, to=1, orient="horizontal",
                                         command=lambda v: self.similarity_val.set(f"{float(v):.2f}"))
        self.similarity_scale.set(0.75)
        self.similarity_scale.grid(row=2, column=1, sticky="ew", padx=5)
        ttk.Label(self.el_params_frame, textvariable=self.similarity_val, width=4).grid(row=2, column=2)

        ttk.Label(self.el_params_frame, text="Style:").grid(row=3, column=0, sticky="w")
        self.style_val = tk.StringVar(value="0.00")
        self.style_scale = ttk.Scale(self.el_params_frame, from_=0, to=1, orient="horizontal",
                                    command=lambda v: self.style_val.set(f"{float(v):.2f}"))
        self.style_scale.set(0.0)
        self.style_scale.grid(row=3, column=1, sticky="ew", padx=5)
        ttk.Label(self.el_params_frame, textvariable=self.style_val, width=4).grid(row=3, column=2)

        self.boost_var = tk.BooleanVar(value=True)
        ttk.Checkbutton(self.el_params_frame, text="Speaker Boost", variable=self.boost_var).grid(row=4, column=0, columnspan=2, sticky="w")

        # TikTok Section
        self.tiktok_frame = ttk.Frame(input_frame)
        ttk.Label(self.tiktok_frame, text="Session ID:").pack(side="left")
        self.session_entry = ttk.Entry(self.tiktok_frame, width=40)
        self.session_entry.pack(side="left", padx=5)
        
        # Text input
        ttk.Label(input_frame, text="Nội dung:").grid(row=5, column=0, sticky="nw", pady=5)
        self.text_input = tk.Text(input_frame, height=6, width=70)
        self.text_input.grid(row=5, column=1, columnspan=3, pady=5, padx=5)
        self.text_input.insert("1.0", "Chào mừng bạn đến với hệ thống Video Editor TTS.")
        
        ttk.Label(input_frame, text="Tên file:").grid(row=6, column=0, sticky="w")
        self.filename_entry = ttk.Entry(input_frame, width=30)
        self.filename_entry.insert(0, "output_audio")
        self.filename_entry.grid(row=6, column=1, sticky="w", padx=5)

        ttk.Label(input_frame, text="Latency:").grid(row=6, column=2, sticky="w", padx=10)
        self.latency_var = tk.IntVar(value=0)
        self.latency_combo = ttk.Combobox(input_frame, textvariable=self.latency_var, values=[0, 1, 2, 3, 4], state="readonly", width=5)
        self.latency_combo.grid(row=6, column=3, sticky="w")

        # Buttons
        btn_container = ttk.Frame(input_frame)
        btn_container.grid(row=7, column=1, columnspan=3, sticky="w", pady=15)
        self.render_btn = ttk.Button(btn_container, text="🔥 RENDER", command=self.start_render)
        self.render_btn.pack(side="left", padx=5)
        self.refresh_voices_btn = ttk.Button(btn_container, text="🔄 Cập nhật ElevenLabs", command=self.refresh_elevenlabs_voices)
        self.refresh_voices_btn.pack(side="left", padx=5)
        
        self.status_var = tk.StringVar(value="Sẵn sàng")
        ttk.Label(input_frame, textvariable=self.status_var, foreground="#1da32b", font=("Arial", 10, "bold")).grid(row=7, column=3)
        
        # --- File Manager ---
        file_frame = ttk.LabelFrame(root, text="Thư viện âm thanh", padding="10")
        file_frame.pack(fill="both", expand=True, padx=10, pady=5)
        self.file_listbox = tk.Listbox(file_frame, height=8, font=("Consolas", 10))
        self.file_listbox.pack(fill="both", expand=True, side="left", padx=(0, 10))
        scrollbar = ttk.Scrollbar(file_frame, orient="vertical", command=self.file_listbox.yview)
        scrollbar.pack(side="left", fill="y")
        self.file_listbox.config(yscrollcommand=scrollbar.set)
        
        mgr_btns = ttk.Frame(file_frame)
        mgr_btns.pack(side="right", fill="y")
        ttk.Button(mgr_btns, text="▶ PHÁT", command=self.play_audio).pack(fill="x", pady=2)
        ttk.Button(mgr_btns, text="⏹ DỪNG", command=self.stop_audio).pack(fill="x", pady=2)
        ttk.Button(mgr_btns, text="Xoá", command=self.delete_file).pack(fill="x", pady=2)
        ttk.Button(mgr_btns, text="Mở Folder", command=lambda: os.startfile(os.path.abspath(ASSET_DIR))).pack(fill="x", pady=2)
        
        self.update_engine_view()
        self.refresh_files()
        self.refresh_elevenlabs_voices()

    def update_engine_view(self, event=None):
        engine = self.engine_var.get()
        if "ElevenLabs" in engine:
            self.el_params_frame.grid()
            self.tiktok_frame.grid_remove()
        elif "TikTok" in engine:
            self.el_params_frame.grid_remove()
            self.tiktok_frame.grid(row=1, column=0, columnspan=4, sticky="w", pady=10)
        else:
            self.el_params_frame.grid_remove()
            self.tiktok_frame.grid_remove()
            
        voices = list(VOICE_MAPPING.get(engine, {}).keys())
        self.voice_combo['values'] = voices
        if voices:
            self.voice_combo.current(0)

    def refresh_elevenlabs_voices(self):
        if not ELEVENLABS_KEYS:
            return
        threading.Thread(target=self._fetch_voices_task, daemon=True).start()

    def _fetch_voices_task(self):
        try:
            self.status_var.set("Đang tải giọng...")
            key = ELEVENLABS_KEYS[0]
            voices = fetch_voices(key)
            shared_voices = fetch_shared_voices(key)
            
            combined = {}
            for v in shared_voices:
                combined[f"🇻🇳 {v['name']} (Thư viện)"] = v["voice_id"]
            
            for v in voices:
                cat = v.get("category", "")
                if cat == "premade":
                    combined[f"🏠 {v['name']} (Mặc định)"] = v["voice_id"]
                else:
                    combined[f"👤 {v['name']} (Cá nhân)"] = v["voice_id"]
            
            if combined:
                VOICE_MAPPING["ElevenLabs (Cao cấp)"] = combined
                self.root.after(0, self.update_engine_view)
                self.status_var.set("Đã cập nhật giọng")
        except Exception as e:
            self.status_var.set(f"Lỗi tải giọng: {str(e)[:20]}")

    def start_render(self):
        text = self.text_input.get("1.0", tk.END).strip()
        engine = self.engine_var.get()
        voice_id = VOICE_MAPPING[engine].get(self.voice_var.get())
        filename = self.filename_entry.get().strip() or "output"
        if not filename.endswith(".mp3"):
            filename += ".mp3"
        filepath = os.path.join(ASSET_DIR, filename)
        
        self.render_btn.config(state="disabled")
        self.status_var.set("Đang render...")
        
        if "ElevenLabs" in engine:
            settings = {
                "stability": self.stability_scale.get(),
                "similarity_boost": self.similarity_scale.get(),
                "style": self.style_scale.get(),
                "use_speaker_boost": self.boost_var.get()
            }
            threading.Thread(target=self._render_el, args=(text, voice_id, self.model_var.get(), settings, self.latency_var.get(), filepath), daemon=True).start()
        elif "Edge" in engine:
            threading.Thread(target=self._render_edge, args=(text, voice_id, filepath), daemon=True).start()
        else:
            threading.Thread(target=self._render_tiktok, args=(text, voice_id, self.session_entry.get().strip(), filepath), daemon=True).start()

    def _render_el(self, text, voice_id, model, settings, latency, filepath):
        success, msg = run_elevenlabs(text, voice_id, model, settings, latency, filepath, ELEVENLABS_KEYS)
        self.root.after(0, lambda: self.done(msg))

    def _render_edge(self, text, voice, filepath):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        success, msg = loop.run_until_complete(run_edge(text, voice, filepath))
        self.root.after(0, lambda: self.done(msg))

    def _render_tiktok(self, text, voice, session, filepath):
        success, msg = run_tiktok(text, voice, session, filepath)
        self.root.after(0, lambda: self.done(msg))

    def done(self, msg):
        self.status_var.set(msg)
        self.render_btn.config(state="normal")
        self.refresh_files()
        if "Thành công" in msg:
            messagebox.showinfo("Kết quả", "Đã tạo xong file audio!")

    def refresh_files(self):
        self.file_listbox.delete(0, tk.END)
        if os.path.exists(ASSET_DIR):
            for f in os.listdir(ASSET_DIR):
                if f.endswith(".mp3"):
                    self.file_listbox.insert(tk.END, f)

    def play_audio(self):
        sel = self.file_listbox.curselection()
        if not sel:
            return
        self.stop_audio()
        path = os.path.abspath(os.path.join(ASSET_DIR, self.file_listbox.get(sel[0])))
        ctypes.windll.winmm.mciSendStringW(f'open "{path}" type mpegvideo alias MyAudio', None, 0, None)
        ctypes.windll.winmm.mciSendStringW("play MyAudio", None, 0, None)

    def stop_audio(self):
        ctypes.windll.winmm.mciSendStringW("stop MyAudio", None, 0, None)
        ctypes.windll.winmm.mciSendStringW("close MyAudio", None, 0, None)

    def delete_file(self):
        sel = self.file_listbox.curselection()
        if sel and messagebox.askyesno("Xóa", "Bạn có chắc chắn?"):
            os.remove(os.path.join(ASSET_DIR, self.file_listbox.get(sel[0])))
            self.refresh_files()

if __name__ == "__main__":
    root = tk.Tk()
    app = TTSApp(root)
    root.mainloop()
