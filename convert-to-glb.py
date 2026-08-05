import bpy
import os
import sys

# Get project root from command line argument
if len(sys.argv) > sys.argv.index('--') + 1:
    project_root = sys.argv[sys.argv.index('--') + 1]
else:
    project_root = os.getcwd()

# Assets is at ROOT, not under app/
assets_dir = os.path.join(project_root, "assets", "models")

if not os.path.exists(assets_dir):
    print(f"ERROR: Assets directory not found: {assets_dir}")
    sys.exit(1)

blend_files = []
for root, dirs, files in os.walk(assets_dir):
    for f in files:
        if f.endswith('.blend'):
            blend_files.append(os.path.join(root, f))

print(f"Found {len(blend_files)} .blend files to convert")

for blend_path in blend_files:
    glb_path = blend_path.replace('.blend', '.glb')

    if os.path.exists(glb_path):
        print(f"Skipping (already exists): {os.path.basename(glb_path)}")
        continue

    print(f"Converting: {os.path.basename(blend_path)} -> {os.path.basename(glb_path)}")

    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)

    bpy.ops.wm.open_mainfile(filepath=blend_path)

    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format='GLB',
        export_materials='EXPORT',
        export_image_format='AUTO',
        export_yup=True,
        export_apply=True,
    )

    print(f"  Saved: {glb_path}")

print("\nConversion complete!")