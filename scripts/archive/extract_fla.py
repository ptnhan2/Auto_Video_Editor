import os
import zipfile
import shutil
import sys

# 🔒 FROZEN BLOCK: ASSET EXTRACTION LOGIC
def extract_fla_assets(fla_path, output_dir):
    """
    Extract PNG assets from a .fla file (modern format is a ZIP).
    """
    if not os.path.exists(fla_path):
        print(f"File not found: {fla_path}")
        return

    # Temporary extraction directory
    temp_extract = os.path.join(output_dir, "temp_fla")
    if os.path.exists(temp_extract):
        shutil.rmtree(temp_extract)
    
    os.makedirs(temp_extract, exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    try:
        with zipfile.ZipFile(fla_path, 'r') as zip_ref:
            # List all files in zip - avoid printing non-ascii to console
            print("Listing files in archive (first 10):")
            for name in zip_ref.namelist()[:10]:
                try:
                    # Print only ASCII safe names or placeholder
                    name.encode('ascii')
                    print(f"  - {name}")
                except UnicodeEncodeError:
                    print(f"  - [Non-ASCII filename]")
            
            zip_ref.extractall(temp_extract)
            print(f"Extracted archive to {temp_extract}")

        # Search for images AND XML anywhere in the extracted files
        count = 0
        xml_count = 0
        all_files_count = 0
        for root, dirs, files in os.walk(temp_extract):
            for file in files:
                all_files_count += 1
                src_path = os.path.join(root, file)
                rel_path = os.path.relpath(src_path, temp_extract)
                flat_name = rel_path.replace(os.sep, "_").replace(" ", "_")
                
                if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                    dest_path = os.path.join(output_dir, flat_name)
                    shutil.copy2(src_path, dest_path)
                    count += 1
                elif file.lower().endswith(('.xml', '.xfl')):
                    # Save XML to a dedicated folder for analysis
                    xml_dir = os.path.join(output_dir, "metadata")
                    os.makedirs(xml_dir, exist_ok=True)
                    dest_path = os.path.join(xml_dir, flat_name)
                    shutil.copy2(src_path, dest_path)
                    xml_count += 1
        
        print(f"Total files in archive: {all_files_count}")
        if count > 0 or xml_count > 0:
            print(f"Successfully extracted {count} images and {xml_count} metadata files.")
        else:
            print("No images found. Listing top-level structure of extracted files:")
            for item in os.listdir(temp_extract):
                try:
                    print(f"  - {item}")
                except UnicodeEncodeError:
                    print(f"  - [Non-ASCII Item]")

    except zipfile.BadZipFile:
        print("Error: The file is not a valid ZIP archive. It might be an older binary .fla format.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Cleanup temp directory
        if os.path.exists(temp_extract):
            shutil.rmtree(temp_extract)

if __name__ == "__main__":
    # Path configuration
    PROJECT_ROOT = "c:/DevWork/Auto_Video_Editor"
    FLA_FILE = os.path.join(PROJECT_ROOT, "public/assets/female_expression/Biểu cảm nữ.fla")
    OUTPUT_FOLDER = os.path.join(PROJECT_ROOT, "public/assets/female_expression/parts")

    extract_fla_assets(FLA_FILE, OUTPUT_FOLDER)
