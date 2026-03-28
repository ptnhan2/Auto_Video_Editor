import os
from PIL import Image
import sys

# Set encoding for Windows console if possible
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())

def slice_sprite_sheet(image_path, output_dir, grid_rows=None, grid_cols=None):
    """
    Slices a sprite sheet into individual images.
    """
    if not os.path.exists(image_path):
        print(f"File not found: {image_path}")
        return

    img = Image.open(image_path)
    width, height = img.size
    # Avoid printing non-ascii path directly
    print(f"Processing image of size: {width}x{height}")

    os.makedirs(output_dir, exist_ok=True)
    
    # Use a generic base name for output
    base_name = "expression"
    if "(1)" in image_path:
        base_name = "female_1"
    elif "(2)" in image_path:
        base_name = "female_2"

    img = img.convert("RGBA")
    
    # Default to 4x4 if not specified
    rows = grid_rows or 4
    cols = grid_cols or 4
    
    tile_w = width // cols
    tile_h = height // rows
    
    count = 0
    for r in range(rows):
        for c in range(cols):
            left = c * tile_w
            top = r * tile_h
            right = left + tile_w
            bottom = top + tile_h
            
            tile = img.crop((left, top, right, bottom))
            
            # Use getbbox to see if tile has any non-transparent pixels
            if tile.getbbox():
                # Crop again to the actual content within the tile for tight fitting
                tight_tile = tile.crop(tile.getbbox())
                tile_filename = f"{base_name}_part_{count}.png"
                tight_tile.save(os.path.join(output_dir, tile_filename))
                print(f"Saved: {tile_filename}")
                count += 1
                
    print(f"Finished slicing into {count} parts.")

if __name__ == "__main__":
    PROJECT_ROOT = "c:/DevWork/Auto_Video_Editor"
    
    # Process both sheets
    SHEET1 = os.path.join(PROJECT_ROOT, "public/assets/female_expression/parts/Biểu_cảm_nữ_(1).png")
    SHEET2 = os.path.join(PROJECT_ROOT, "public/assets/female_expression/parts/Biểu_cảm_nữ_(2).png")
    
    OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public/assets/female_expression/parts/individual")
    
    print("--- Slicing Sheet 1 ---")
    slice_sprite_sheet(SHEET1, OUTPUT_DIR, grid_rows=4, grid_cols=4)
    
    print("\n--- Slicing Sheet 2 ---")
    slice_sprite_sheet(SHEET2, OUTPUT_DIR, grid_rows=4, grid_cols=4)
