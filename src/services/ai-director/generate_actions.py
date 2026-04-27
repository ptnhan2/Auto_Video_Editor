import json
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUT_DIR = os.path.join(PROJECT_ROOT, "public/animations/")
os.makedirs(OUT_DIR, exist_ok=True)

def ease(): return "ease-in-out"

def make_action(id, name, duration, tracks):
    return {
        "id": id,
        "name": name,
        "durationFrames": duration,
        "fps": 30,
        "loop": True,
        "tracks": tracks
    }

def track(frames):
    # Dùng cho single body waddle (x: rotate, y: translateY bounce)
    return {
        "keyframes": [
            {"frame": f[0], "rotation": f[1], "rotationY": f[2] if len(f)>2 else 0, "x": f[3] if len(f)>3 else 0, "y": f[4] if len(f)>4 else 0, "easing": ease()}
            for f in frames
        ]
    }

actions = {}

# 1. RUN CYCLE (Waddle mạnh, nhịp nảy nhanh và sâu)
actions["run"] = make_action("run_cycle", "Run Cycle", 20, {
    "body": track([
        (0, -15, 0, 0, 0),       # Chân chạm đất, nghiêng trái
        (5, 0, 0, 0, -50),       # Nảy lên không trung ở giữa
        (10, 15, 0, 0, 0),       # Chân chạm đất, nghiêng phải
        (15, 0, 0, 0, -50),      # Nảy lên không trung ở giữa
        (20, -15, 0, 0, 0)       # Về vị trí ban đầu
    ]),
})

# 2. SNEAK CYCLE (Lắc chậm, nảy rất ít)
actions["sneak"] = make_action("sneak_cycle", "Sneak Cycle", 60, {
    "body": track([
        (0, -5, 0, 0, 0),
        (15, 0, 0, 0, -10),
        (30, 5, 0, 0, 0),
        (45, 0, 0, 0, -10),
        (60, -5, 0, 0, 0)
    ]),
})

# 3. TALK ANGRY (Rung bần bật)
actions["talk_angry"] = make_action("talk_angry", "Talk Angry", 10, {
    "body": track([
        (0, -2, 0, 0, 0),
        (2, 3, 0, 0, -5),
        (5, -4, 0, 0, 0),
        (7, 2, 0, 0, -5),
        (10, -2, 0, 0, 0)
    ]),
})

# 4. TALK SAD (Cúi gập người/Scale Y giả lập)
actions["talk_sad"] = make_action("talk_sad", "Talk Sad", 60, {
    "body": track([
        (0, 0, 0, 0, 0),
        (30, 5, 0, 0, 20),      # Oằn người xuống
        (60, 0, 0, 0, 0)
    ]),
})

# 5. SURPRISE FEAR (Nảy bắn lên rồi rung lắc)
actions["surprise_fear"] = make_action("surprise_fear", "Surprise Fear", 30, {
    "body": track([
        (0, 0, 0, 0, 0),
        (5, 0, 0, 0, -100),     # Giật nảy mình bắn lên cao
        (10, -10, 0, 0, 0),     # Rơi xuống mất thăng bằng
        (20, 10, 0, 0, 0),
        (30, 0, 0, 0, 0)
    ]),
})
actions["surprise_fear"]["loop"] = False

# 6. REACH OUT (Chồm tới trước)
actions["reach_out"] = make_action("reach_out", "Reach Out", 40, {
    "body": track([
        (0, 0, 0, 0, 0),
        (20, 15, 0, 20, 0),     # Chồm tới (rotate và tịnh tiến trục X nếu cần)
        (40, 0, 0, 0, 0)
    ]),
})

# 7. LOOK AROUND (Đảo qua lại)
actions["look_around"] = make_action("look_around", "Look Around", 60, {
    "body": track([
        (0, 0, 0, 0, 0),
        (15, -10, 0, 0, 0),
        (30, 0, 0, 0, 0),
        (45, 10, 0, 0, 0),
        (60, 0, 0, 0, 0)
    ]),
})

# 8. COMBAT STANCE (Thủ thế nhún nhảy)
actions["combat_stance"] = make_action("combat_stance", "Combat Stance", 40, {
    "body": track([
        (0, 5, 0, 0, 0),
        (10, 5, 0, 0, -15),     # Nhún nảy nhẹ
        (20, 8, 0, 0, 0),
        (30, 8, 0, 0, -15),
        (40, 5, 0, 0, 0)
    ]),
})

# 9. STRIKE (Lao vào húc)
actions["strike"] = make_action("strike", "Strike", 30, {
    "body": track([
        (0, 0, 0, 0, 0),
        (10, -20, 0, -50, 0),   # Lấy đà lùi lại
        (15, 30, 0, 150, -20),  # Húc mạnh tới trước
        (30, 0, 0, 0, 0)        # Quay về
    ]),
})
actions["strike"]["loop"] = False

# 10. WALK CYCLE (Waddle cơ bản)
actions["walk"] = make_action("walk_cycle", "Walk Cycle", 40, {
    "body": track([
        (0, -10, 0, 0, 0),       # Chân trái (nghiêng trái)
        (10, 0, 0, 0, -20),      # Nảy lên lúc đổi chân
        (20, 10, 0, 0, 0),       # Chân phải (nghiêng phải)
        (30, 0, 0, 0, -20),      # Nảy lên
        (40, -10, 0, 0, 0)
    ]),
})

for key, val in actions.items():
    with open(os.path.join(OUT_DIR, f"{key}.json"), "w", encoding='utf-8') as f:
        json.dump(val, f, indent=2)

print("Generated all Waddle action JSON files.")
