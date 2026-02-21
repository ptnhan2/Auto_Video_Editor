import modal
import io
from PIL import Image
import numpy as np
import os

# IMAGE DEFINITION: OpenCV + SAM
image = (
    modal.Image.debian_slim()
    .apt_install("wget", "libgl1-mesa-glx", "libglib2.0-0", "git")
    .pip_install(
        "segment-anything",
        "torch",
        "torchvision",
        "opencv-python",
        "numpy",
        "pillow",
        "fastapi[standard]",
        "transformers", 
        "setuptools"
    )
    .run_commands(
        "wget https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth -O /root/sam_vit_b_01ec64.pth"
    )
)

app = modal.App("auto-rigging-smart-pipeline")

@app.cls(gpu="T4", image=image)
class SAMService:
    @modal.enter()
    def setup(self):
        import torch
        from segment_anything import sam_model_registry, SamPredictor
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        # 1. Load SAM
        print("--- Loading SAM (vit_b) ---")
        sam = sam_model_registry["vit_b"](checkpoint="/root/sam_vit_b_01ec64.pth")
        sam.to(device=self.device)
        self.sam_predictor = SamPredictor(sam)
        
        print("--- Point-Prompt Pipeline Ready ---")

    @modal.method()
    def remove_background_with_points(self, image_bytes: bytes, points: list):
        """
        Use explicit positive point prompts (at center of crop) to force SAM 
        to select the character part, not the background.
        """
        import torch
        
        # Load image
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_np = np.array(pil_img)
        h, w, _ = img_np.shape
        
        self.sam_predictor.set_image(img_np)
        
        # Convert points to numpy
        input_points = np.array(points)
        input_labels = np.ones(len(points)) # 1 = foreground
        
        # Predict with points
        masks, scores, logits = self.sam_predictor.predict(
            point_coords=input_points,
            point_labels=input_labels,
            multimask_output=True # Get 3 scales
        )
        
        # Pick the best mask based on score
        best_idx = np.argmax(scores)
        mask = masks[best_idx]

        # Create RGBA image
        rgba_np = np.zeros((h, w, 4), dtype=np.uint8)
        rgba_np[:, :, :3] = img_np
        rgba_np[:, :, 3] = mask.astype(np.uint8) * 255
        
        # Final safety: Force remove white pixels
        white_threshold = 248
        white_pixels = (img_np[:, :, 0] >= white_threshold) & \
                       (img_np[:, :, 1] >= white_threshold) & \
                       (img_np[:, :, 2] >= white_threshold)
        rgba_np[white_pixels, 3] = 0 

        # Crop to content
        y_coords, x_coords = np.where(rgba_np[:, :, 3] > 0)
        if len(x_coords) > 0:
            tight_np = rgba_np[y_coords.min():y_coords.max()+1, x_coords.min():x_coords.max()+1]
        else:
            tight_np = rgba_np

        tight_pil = Image.fromarray(tight_np)
        buf = io.BytesIO()
        tight_pil.save(buf, format="PNG")
        return buf.getvalue()

@app.function(image=image, timeout=600)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI, Request
    import base64
    import json
    
    web_app = FastAPI()

    @web_app.post("/")
    async def segment(request: Request):
        content_type = request.headers.get("Content-Type", "")
        service = SAMService()
        
        if "application/json" in content_type:
            data = await request.json()
            # New protocol: Expects { "image": "base64", "points": [[x,y]] }
            image_bytes = base64.b64decode(data["image"])
            points = data.get("points", [])
            
            transparent_data = service.remove_background_with_points.remote(image_bytes, points)
            return {"part": base64.b64encode(transparent_data).decode('utf-8')}
            
        return {"error": "Only JSON protocol supported for point-prompted SAM"}

    return web_app
