import json
import os
import glob

ANIM_DIR = "public/animations"

def fix_animation(filepath):
    print(f"Fixing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    tracks = data.get("tracks", {})
    if "torso" not in tracks:
        print(f"  Skipping {filepath}: No torso track found.")
        return

    torso_keyframes = tracks["torso"].get("keyframes", [])
    
    # Rule 1: Head angle must match Torso angle
    # We'll create a new head track based on torso's frames and rotations
    new_head_keyframes = []
    for kf in torso_keyframes:
        new_head_keyframes.append({
            "frame": kf["frame"],
            "rotation": kf["rotation"],
            "rotationY": kf.get("rotationY", 0),
            "easing": kf.get("easing", "ease-in-out")
        })
    
    tracks["head"] = {"keyframes": new_head_keyframes}

    # Rule 2 & 3: Maintain Absolute Angle Integrity (Safety check)
    # Leg: calf <= thigh
    # Arm: lower_arm >= upper_arm
    
    def enforce_leg(side):
        thigh_name = f"{side}_thigh"
        calf_name = f"{side}_calf"
        if thigh_name in tracks and calf_name in tracks:
            thigh_kfs = tracks[thigh_name].get("keyframes", [])
            calf_kfs = tracks[calf_name].get("keyframes", [])
            # For simplicity in this script, we only fix exact frame matches. 
            # In a more complex rig, we'd interpolate, but usually keyframes are aligned.
            thigh_map = {kf["frame"]: kf["rotation"] for kf in thigh_kfs}
            for kf in calf_kfs:
                f = kf["frame"]
                if f in thigh_map:
                    # calf <= thigh
                    if kf["rotation"] > thigh_map[f]:
                        kf["rotation"] = thigh_map[f]

    def enforce_arm(side):
        upper_name = f"{side}_upper_arm"
        lower_name = f"{side}_lower_arm"
        if upper_name in tracks and lower_name in tracks:
            upper_kfs = tracks[upper_name].get("keyframes", [])
            lower_kfs = tracks[lower_name].get("keyframes", [])
            upper_map = {kf["frame"]: kf["rotation"] for kf in upper_kfs}
            for kf in lower_kfs:
                f = kf["frame"]
                if f in upper_map:
                    # lower_arm >= upper_arm
                    if kf["rotation"] < upper_map[f]:
                        kf["rotation"] = upper_map[f]

    enforce_leg("left")
    enforce_leg("right")
    enforce_arm("left")
    enforce_arm("right")

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def main():
    files = glob.glob(os.path.join(ANIM_DIR, "*.json"))
    for f in files:
        fix_animation(f)
    print("All animations fixed.")

if __name__ == "__main__":
    main()
