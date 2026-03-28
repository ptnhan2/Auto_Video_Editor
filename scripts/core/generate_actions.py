import json
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUT_DIR = os.path.join(PROJECT_ROOT, "public/animations/")
os.makedirs(OUT_DIR, exist_ok=True)

def ease(): return "ease-in-out"

def make_action(id, name, duration, tracks):
    # Rule: head rotation matches torso rotation
    if "torso" in tracks and "head" in tracks:
        torso_kfs = tracks["torso"]["keyframes"]
        head_kfs = tracks["head"]["keyframes"]
        # Match head rotation to torso rotation at each frame
        # For simplicity, if we are generating them, we can just sync the tracks
        # But here we'll just ensure the logic remains consistent
        pass

    return {
        "id": id,
        "name": name,
        "durationFrames": duration,
        "fps": 30,
        "loop": True,
        "tracks": tracks
    }

def track(frames):
    return {
        "keyframes": [
            {"frame": f[0], "rotation": f[1], "rotationY": f[2] if len(f)>2 else 0, "x": f[3] if len(f)>3 else 0, "y": f[4] if len(f)>4 else 0, "easing": ease()}
            for f in frames
        ]
    }

actions = {}

# Helper to sync head to torso in actions dictionary
def sync_head(action_data):
    torso_kfs = action_data["tracks"]["torso"]["keyframes"]
    head_track = {"keyframes": []}
    for kf in torso_kfs:
        head_track["keyframes"].append({
            "frame": kf["frame"],
            "rotation": kf["rotation"],
            "rotationY": kf.get("rotationY", 0),
            "easing": kf.get("easing", "ease-in-out")
        })
    action_data["tracks"]["head"] = head_track

# 1. RUN CYCLE
actions["run"] = make_action("run_cycle", "Run Cycle", 30, {
    "torso": track([(0, -20, 0, 0, 0), (15, -22, 0, 0, -8), (30, -20, 0, 0, 0)]),
    "head": track([(0, 0)]), # Placeholder, will be synced
    "left_thigh": track([(0, 45), (15, -45), (30, 45)]),
    "left_calf": track([(0, 35), (7, -10), (15, -55), (22, -80), (30, 35)]),
    "right_thigh": track([(0, -45), (15, 45), (30, -45)]),
    "right_calf": track([(0, -55), (7, -80), (15, 35), (22, -10), (30, -55)]),
    "left_upper_arm": track([(0, -40), (15, 40), (30, -40)]),
    "left_lower_arm": track([(0, -25), (7, 10), (15, 80), (22, 10), (30, -25)]),
    "right_upper_arm": track([(0, 40), (15, -40), (30, 40)]),
    "right_lower_arm": track([(0, 80), (7, 10), (15, -25), (22, 10), (30, 80)]),
})
sync_head(actions["run"])

# 2. SNEAK CYCLE
actions["sneak"] = make_action("sneak_cycle", "Sneak Cycle", 60, {
    "torso": track([(0, 10, 0, 0, 10), (30, 10, 0, 0, 5), (60, 10, 0, 0, 10)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 20), (30, -20), (60, 20)]),
    "left_calf": track([(0, -10), (30, -50), (60, -10)]),
    "right_thigh": track([(0, -20), (30, 20), (60, -20)]),
    "right_calf": track([(0, -50), (30, -10), (60, -50)]),
    "left_upper_arm": track([(0, -10), (30, 10), (60, -10)]),
    "left_lower_arm": track([(0, 40), (30, 60), (60, 40)]),
    "right_upper_arm": track([(0, 10), (30, -10), (60, 10)]),
    "right_lower_arm": track([(0, 60), (30, 40), (60, 60)]),
})
sync_head(actions["sneak"])

# 3. TALK ANGRY
actions["talk_angry"] = make_action("talk_angry", "Talk Angry", 40, {
    "torso": track([(0, 8, 0, 0, 0), (20, 12, 0, 0, 2), (40, 8, 0, 0, 0)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 0), (40, 0)]),
    "left_calf": track([(0, 0), (40, 0)]),
    "right_thigh": track([(0, 0), (40, 0)]),
    "right_calf": track([(0, 0), (40, 0)]),
    "left_upper_arm": track([(0, 0), (40, 0)]),
    "left_lower_arm": track([(0, 15), (40, 15)]),
    "right_upper_arm": track([(0, 70), (20, 90), (40, 70)]),
    "right_lower_arm": track([(0, 70), (20, 90), (40, 70)]),
})
sync_head(actions["talk_angry"])

# 4. TALK SAD
actions["talk_sad"] = make_action("talk_sad", "Talk Sad", 60, {
    "torso": track([(0, 10, 0, 0, 5), (30, 15, 0, 0, 8), (60, 10, 0, 0, 5)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 0), (60, 0)]),
    "left_calf": track([(0, 0), (60, 0)]),
    "right_thigh": track([(0, 0), (60, 0)]),
    "right_calf": track([(0, 0), (60, 0)]),
    "left_upper_arm": track([(0, 10), (30, 15), (60, 10)]),
    "left_lower_arm": track([(0, 10), (30, 15), (60, 10)]),
    "right_upper_arm": track([(0, 10), (30, 15), (60, 10)]),
    "right_lower_arm": track([(0, 10), (30, 15), (60, 10)]),
})
sync_head(actions["talk_sad"])

# 5. SURPRISE FEAR
actions["surprise_fear"] = make_action("surprise_fear", "Surprise Fear", 30, {
    "torso": track([(0, 0, 0, 0, 0), (10, -15, 0, 30, -10), (30, -10, 0, 30, 0)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 0), (10, -20), (30, 0)]),
    "left_calf": track([(0, 0), (10, -20), (30, 0)]),
    "right_thigh": track([(0, 0), (10, 20), (30, 0)]),
    "right_calf": track([(0, 0), (10, -10), (30, 0)]),
    "left_upper_arm": track([(0, 0), (10, -60), (30, -50)]),
    "left_lower_arm": track([(0, 15), (10, 30), (30, 30)]),
    "right_upper_arm": track([(0, 0), (10, -70), (30, -60)]),
    "right_lower_arm": track([(0, 15), (10, 20), (30, 20)]),
})
sync_head(actions["surprise_fear"])
actions["surprise_fear"]["loop"] = False

# 6. REACH OUT
actions["reach_out"] = make_action("reach_out", "Reach Out", 40, {
    "torso": track([(0, 0, 0, 0, 0), (20, 5, 0, 0, 0), (40, 0, 0, 0, 0)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 0), (40, 0)]),
    "left_calf": track([(0, 0), (40, 0)]),
    "right_thigh": track([(0, 0), (40, 0)]),
    "right_calf": track([(0, 0), (40, 0)]),
    "left_upper_arm": track([(0, 0), (40, 0)]),
    "left_lower_arm": track([(0, 15), (40, 15)]),
    "right_upper_arm": track([(0, 0), (20, 80), (40, 0)]),
    "right_lower_arm": track([(0, 15), (20, 80), (40, 15)]),
})
sync_head(actions["reach_out"])

# 7. LOOK AROUND
actions["look_around"] = make_action("look_around", "Look Around", 60, {
    "torso": track([(0, 0, 0, 0, 0), (60, 0, 0, 0, 0)]),
    "head": track([(0, 0, -45), (30, 0, 45), (60, 0, -45)]), # Note: rotationY is -45, 45, -45
    "left_thigh": track([(0, 0), (60, 0)]),
    "left_calf": track([(0, 0), (60, 0)]),
    "right_thigh": track([(0, 0), (60, 0)]),
    "right_calf": track([(0, 0), (60, 0)]),
    "left_upper_arm": track([(0, 20), (60, 20)]),
    "left_lower_arm": track([(0, 80), (60, 80)]),
    "right_upper_arm": track([(0, 0), (60, 0)]),
    "right_lower_arm": track([(0, 15), (60, 15)]),
})
# For look around, we match rotation (pitch/lean) but head keeps its own rotationY (pan)
torso_kfs = actions["look_around"]["tracks"]["torso"]["keyframes"]
head_kfs = actions["look_around"]["tracks"]["head"]["keyframes"]
for i, kf in enumerate(head_kfs):
    if i < len(torso_kfs):
        kf["rotation"] = torso_kfs[i]["rotation"]

# 8. COMBAT STANCE
actions["combat_stance"] = make_action("combat_stance", "Combat Stance", 40, {
    "torso": track([(0, 5, 0, 0, 15), (20, 8, 0, 0, 18), (40, 5, 0, 0, 15)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 30), (20, 32), (40, 30)]),
    "left_calf": track([(0, -10), (20, -8), (40, -10)]),
    "right_thigh": track([(0, -30), (20, -32), (40, -30)]),
    "right_calf": track([(0, -40), (20, -42), (40, -40)]),
    "left_upper_arm": track([(0, 20), (20, 25), (40, 20)]),
    "left_lower_arm": track([(0, 90), (20, 95), (40, 90)]),
    "right_upper_arm": track([(0, 10), (20, 15), (40, 10)]),
    "right_lower_arm": track([(0, 80), (20, 85), (40, 80)]),
})
sync_head(actions["combat_stance"])

# 9. STRIKE
actions["strike"] = make_action("strike", "Strike", 30, {
    "torso": track([(0, 5, 0, 0, 15), (10, -5, 0, -10, 10), (20, 15, 0, 20, 20), (30, 5, 0, 0, 15)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 30), (10, 15), (20, 45), (30, 30)]),
    "left_calf": track([(0, -10), (10, -10), (20, -10), (30, -10)]),
    "right_thigh": track([(0, -30), (10, -15), (20, -45), (30, -30)]),
    "right_calf": track([(0, -40), (10, -40), (20, -55), (30, -40)]),
    "left_upper_arm": track([(0, 20), (10, 10), (20, 30), (30, 20)]),
    "left_lower_arm": track([(0, 90), (10, 80), (20, 100), (30, 90)]),
    "right_upper_arm": track([(0, 10), (10, -60), (20, 120), (30, 10)]),
    "right_lower_arm": track([(0, 80), (10, 20), (20, 120), (30, 80)]),
})
sync_head(actions["strike"])
actions["strike"]["loop"] = False

# 10. WALK CYCLE
actions["walk"] = make_action("walk_cycle", "Walk Cycle", 40, {
    "torso": track([(0, 5, 0, 0, 0), (10, 5, 0, 0, -5), (20, 5, 0, 0, 0), (30, 5, 0, 0, -5), (40, 5, 0, 0, 0)]),
    "head": track([(0, 0)]),
    "left_thigh": track([(0, 30), (20, -30), (40, 30)]),
    "left_calf": track([(0, 20), (10, -10), (20, -40), (30, -60), (40, 20)]),
    "right_thigh": track([(0, -30), (20, 30), (40, -30)]),
    "right_calf": track([(0, -40), (10, -60), (20, 20), (30, -10), (40, -40)]),
    "left_upper_arm": track([(0, -20), (20, 20), (40, -20)]),
    "left_lower_arm": track([(0, -10), (10, 10), (20, 40), (30, 10), (40, -10)]),
    "right_upper_arm": track([(0, 20), (20, -20), (40, 20)]),
    "right_lower_arm": track([(0, 40), (10, 10), (20, -10), (30, 10), (40, 40)]),
})
sync_head(actions["walk"])

for key, val in actions.items():
    with open(os.path.join(OUT_DIR, f"{key}.json"), "w", encoding='utf-8') as f:
        json.dump(val, f, indent=2)

print("Generated all action JSON files.")
