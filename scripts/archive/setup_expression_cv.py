import cv2
import numpy as np
import json
import os

img_path = 'public/assets/humanoid/char_001/parts/head.png'
print(f"Loading {img_path}...")
if not os.path.exists(img_path):
    print("File not found!")
    exit(1)

img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
if img is None:
    print("Could not read image!")
    exit(1)

alpha = img[:,:,3]
h, w = img.shape[:2]
face_y_start = int(h * 0.4)
face_y_end = int(h * 0.9)
face_x_start = int(w * 0.25)
face_x_end = int(w * 0.75)

face_region = img[face_y_start:face_y_end, face_x_start:face_x_end]
face_region_rgb = face_region[:,:,:3]
face_region_alpha = face_region[:,:,3]
pixels = face_region_rgb[face_region_alpha > 0]

if len(pixels) == 0:
    print("No pixels found in face region!")
    exit(1)

skin_color = np.median(pixels, axis=0).astype(np.uint8)
print(f"Skin color: {skin_color}")

diff = np.linalg.norm(img[:,:,:3].astype(np.float32) - skin_color.astype(np.float32), axis=2)
feature_mask = (diff > 30) & (alpha > 0)
feature_mask[:int(h*0.35), :] = False
feature_mask[int(h*0.85):, :] = False

y_indices, x_indices = np.where(feature_mask)
if len(x_indices) > 0:
    min_x, max_x = np.min(x_indices), np.max(x_indices)
    min_y, max_y = np.min(y_indices), np.max(y_indices)
else:
    min_x, max_x, min_y, max_y = int(w*0.3), int(w*0.7), int(h*0.4), int(h*0.7)

print(f'Feature Box: x={min_x}, y={min_y}, w={max_x-min_x}, h={max_y-min_y}')

center_x = int((min_x + max_x) / 2)
center_y = int((min_y + max_y) / 2)
axes_x = int((max_x - min_x) / 2 * 1.3)
axes_y = int((max_y - min_y) / 2 * 1.3)

skin_color_bgra = np.append(skin_color, 255)
cv2.ellipse(img, (center_x, center_y), (axes_x, axes_y), 0, 0, 360, skin_color_bgra.tolist(), -1)

cv2.imwrite('public/assets/humanoid/char_001/parts/head.png', img)
print("Saved head.png")

with open('public/assets/humanoid/char_001/parts/pivots.json', 'r') as f:
    pivots = json.load(f)

pivots['head']['expressionAnchor'] = {
    'x': int(min_x),
    'y': int(min_y),
    'width': int(max_x - min_x),
    'height': int(max_y - min_y)
}

with open('public/assets/humanoid/char_001/parts/pivots.json', 'w') as f:
    json.dump(pivots, f, indent=2)

print('Saved expressionAnchor to pivots.json')
