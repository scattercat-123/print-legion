import os
import subprocess
from pathlib import Path
import requests
from modal import Image, Mount, App, web_endpoint
import base64
from typing import Tuple

# Create a Modal app
app = App("slicer")


# Define the base image with necessary dependencies
def download_prusa():
    # Download OrcaSlicer AppImage
    url = "https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.8.1/PrusaSlicer-2.8.1+linux-x64-newer-distros-GTK3-202409181416.AppImage"
    response = requests.get(url)
    with open("/root/PrusaSlicer.AppImage", "wb") as f:
        f.write(response.content)
    # Make it executable
    os.chmod("/root/PrusaSlicer.AppImage", 0o755)


image = (
    Image.debian_slim(python_version="3.11")
    .pip_install("requests", "fastapi[standard]")
    .run_function(download_prusa)
    .apt_install(
        "wget",
        "libgtk-3-0",  # Common GUI dependency
        "libdbus-1-3",  # Often required for GUI apps,
        "libgstreamer1.0-0",
        "libgstreamer-plugins-base1.0-0",
        "libegl1-mesa",
        "libegl1",
        "libwebkit2gtk-4.1-0",
    )
    .add_local_dir(
        "/Users/vrishank/Development/Projects/launchpad/cloud-slicer/prusa",
        remote_path="/root/prusa",
    )
)

rendering_image = (
    Image.debian_slim(python_version="3.11")
    .apt_install("xorg", "libxkbcommon0")  # X11 (Unix GUI) dependencies
    .pip_install("bpy==4.3.0")  # Blender as a Python package
)

WITH_GPU = True


@app.function(gpu="T4" if WITH_GPU else None, image=rendering_image)
def render_model(stl_file: bytes) -> Tuple[bytes, bytes]:
    import bpy
    import mathutils
    import math
    import os

    def setup_scene(stl_filepath):
        # Import the STL mesh
        bpy.ops.wm.stl_import(filepath=stl_filepath)
        # Assume the imported object is active
        obj = bpy.context.active_object

        if obj is None:
            print("No object was imported.")
            return

        # Create a red material if not exists and assign it
        mat_name = "RedMaterial"
        if mat_name in bpy.data.materials:
            red_mat = bpy.data.materials[mat_name]
        else:
            red_mat = bpy.data.materials.new(name=mat_name)
            # Using Principled BSDF: set base color to red (RGBA)
            red_mat.use_nodes = True
            bsdf = red_mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (1.0, 0.0, 0.0, 1.0)
            else:
                # Fallback for older setups, just setting diffuse_color
                red_mat.diffuse_color = (1.0, 0.0, 0.0, 1.0)
        # Assign the material to the object
        if obj.data.materials:
            obj.data.materials[0] = red_mat
        else:
            obj.data.materials.append(red_mat)

        # Deselect all objects
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.shade_flat()

        # Compute the bounding box center and size in world coordinates
        bbox_corners = [
            obj.matrix_world @ mathutils.Vector(corner) for corner in obj.bound_box
        ]
        min_corner = mathutils.Vector(
            (
                min(v.x for v in bbox_corners),
                min(v.y for v in bbox_corners),
                min(v.z for v in bbox_corners),
            )
        )
        max_corner = mathutils.Vector(
            (
                max(v.x for v in bbox_corners),
                max(v.y for v in bbox_corners),
                max(v.z for v in bbox_corners),
            )
        )
        center = (min_corner + max_corner) / 2.0
        size = max_corner - min_corner
        diag = size.length

        # Get or create a camera
        cam_obj = bpy.data.objects.get("Camera")
        if cam_obj is None or cam_obj.type != "CAMERA":
            # create a new camera if it doesn't exist
            cam_data = bpy.data.cameras.new("Camera")
            cam_obj = bpy.data.objects.new("Camera", cam_data)
            bpy.context.collection.objects.link(cam_obj)

        # Set this camera as the scene camera
        bpy.context.scene.camera = cam_obj
        cam_obj.data.clip_end = 1000000

        # Set the camera to orthographic for an isometric view
        cam_data = cam_obj.data
        cam_data.type = "ORTHO"
        # Add padding: slightly zoom out by increasing ortho scale
        cam_data.ortho_scale = diag * 1.1

        # Calculate isometric view direction angles
        # Isometric view is typically rotated 45° around Z and ~60° down from horizontal.
        angle_z = math.radians(45)
        angle_x = math.radians(60)
        # Direction vector in world coordinates
        direction = mathutils.Vector(
            (
                math.cos(angle_z) * math.cos(angle_x),
                math.sin(angle_z) * math.cos(angle_x),
                math.sin(angle_x),
            )
        )

        # Set the camera location: move back from center along the view direction.
        # The factor (e.g., 2.8) is chosen for a good padding; adjust as needed.
        distance = diag * 2.8
        cam_obj.location = center + direction * distance

        # Ensure the camera is pointing towards the center of the object.
        # Compute the rotation so that -Z (camera local view direction) points to (center - cam location)
        direction_to_center = (center - cam_obj.location).normalized()
        # Create rotation quaternion to align -Z with that vector, with Y as up
        cam_obj.rotation_euler = direction_to_center.to_track_quat("-Z", "Y").to_euler()

        # Adjust the scene render resolution to be square.
        scene = bpy.context.scene
        scene.render.resolution_x = 1024
        scene.render.resolution_y = 1024
        scene.render.pixel_aspect_x = 1
        scene.render.pixel_aspect_y = 1

        # Add a sun light pointing downward if it doesn't already exist
        if "Sun" not in bpy.data.objects:
            light_data = bpy.data.lights.new(name="Sun", type="SUN")
            light_obj = bpy.data.objects.new(name="Sun", object_data=light_data)
            bpy.context.collection.objects.link(light_obj)
            # Place the light above the object
            light_obj.location = center + mathutils.Vector((0, 0, diag))
            # Initially set its rotation; it will be reoriented below to point at the object
            light_obj.rotation_euler = (math.radians(90), 0, 0)
        else:
            light_obj = bpy.data.objects["Sun"]

        # Adjust the sun light's rotation to point directly at the object center.
        direction_to_center_light = (center - light_obj.location).normalized()
        light_obj.rotation_euler = direction_to_center_light.to_track_quat(
            "-Z", "Y"
        ).to_euler()

        # Set the sun light's energy and angle for better illumination
        light_obj.data.energy = 12
        light_obj.data.angle = math.radians(3.14)

        # Set render engine to BLENDER_EEVEE_NEXT and configure EEVEE samples for quality
        scene.render.engine = "BLENDER_EEVEE_NEXT"
        scene.eevee.taa_samples = 128
        scene.eevee.taa_render_samples = 128
        scene.eevee.use_shadows = True

        # Set render film transparency for a transparent background
        scene.render.film_transparent = True

        print(
            "Scene set up complete with object imported, red material applied, isometric square camera view, and transparent background."
        )

        return obj, cam_obj

    def configure_rendering(ctx, with_gpu: bool):
        # configure the rendering process
        ctx.scene.render.engine = "CYCLES"
        ctx.scene.render.resolution_x = 768
        ctx.scene.render.resolution_y = 768
        ctx.scene.render.resolution_percentage = 50
        ctx.scene.cycles.samples = 128
        ctx.scene.render.film_transparent = True

        cycles = ctx.preferences.addons["cycles"]
        # cycles.use_denoising = True
        # Use GPU acceleration if available.
        if with_gpu:
            cycles.preferences.compute_device_type = "CUDA"
            ctx.scene.cycles.device = "GPU"

            # reload the devices to update the configuration
            cycles.preferences.get_devices()
            for device in cycles.preferences.devices:
                device.use = True

        else:
            ctx.scene.cycles.device = "CPU"

        # report rendering devices -- a nice snippet for debugging and ensuring the accelerators are being used
        for dev in cycles.preferences.devices:
            print(
                f"ID:{dev['id']} Name:{dev['name']} Type:{dev['type']} Use:{dev['use']}"
            )

    with open("/tmp/input.stl", "wb") as f:
        f.write(stl_file)
    # Setup
    model, camera = setup_scene("/tmp/input.stl")

    # delete any Blender Cubes
    # deselect all objects
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.name == "Cube" or obj.name == "Light":
            obj.select_set(True)
            bpy.ops.object.delete()

    # Create output directory
    os.makedirs("/root/renders", exist_ok=True)

    configure_rendering(bpy.context, with_gpu=WITH_GPU)

    # Render settings
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024

    # Just render one view
    output_path = os.path.join("/root/renders", "test_render.png")
    bpy.context.scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)

    # Instead, set the object's origin to its geometry center and rotate it 180° along Y axis
    bpy.context.view_layer.objects.active = model
    model.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    model.rotation_euler[1] += math.radians(180)

    # Render the second view (with the rotated model)
    output_path = os.path.join("/root/renders", "test_render_side.png")
    bpy.context.scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)

    return [
        open("/root/renders/test_render.png", "rb").read(),
        open("/root/renders/test_render_side.png", "rb").read(),
    ]


@app.function(image=image)
async def slice_stl(raw_data: bytes):
    try:
        # Save the uploaded STL file
        input_path = "/tmp/input.stl"
        output_path = "/tmp/output.bgcode"

        with open(input_path, "wb") as f:
            f.write(raw_data)

        # Run OrcaSlicer with xvfb-run for headless operation
        cmd = [
            "/root/PrusaSlicer.AppImage",
            "--appimage-extract-and-run",
            "--datadir",
            "/root/prusa",
            "--print-profile",
            "0.20mm SPEED @COREONE HF0.4",
            "--printer-profile",
            "Prusa CORE One HF0.4 nozzle",
            "--material-profile",
            "Generic PETG @COREONE HF0.4",
            "--output",
            output_path,
            "-s",
            input_path,
        ]

        # return {"example": "example.from_function()"}

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return {
                "error": f"Failed to slice STL: {result.stderr}",
                "stdout": result.stdout,
                "stderr": result.stderr,
            }

        # Read and return the G-code
        if os.path.exists(output_path):
            with open(output_path, "r", errors="ignore") as f:
                gcode = f.read()

            # Parse metadata from gcode
            metadata = {}
            for line in gcode.split("\n"):
                if line.startswith("filament used [g]="):
                    metadata["filament_used_g"] = float(line.split("=")[1])
                elif line.startswith("filament cost="):
                    metadata["filament_cost"] = float(line.split("=")[1])
                elif line.startswith("filament used [cm3]="):
                    metadata["filament_used_cm3"] = float(line.split("=")[1])
                elif line.startswith("total filament used for wipe tower [g]="):
                    metadata["wipe_tower_filament_g"] = float(line.split("=")[1])
                elif line.startswith("estimated printing time (normal mode)="):
                    metadata["print_time_normal"] = line.split("=")[1].strip()
                elif line.startswith("estimated printing time (silent mode)="):
                    metadata["print_time_silent"] = line.split("=")[1].strip()

            with open(output_path, "rb") as f:
                raw_gcode = f.read()

            return {"slice_metadata": metadata}
        else:
            return {"error": "G-code file was not generated"}

    except Exception as e:
        print(e)
        return {"error": str(e)}


@app.function(image=image, cpu=1)
@web_endpoint(method="POST")
async def endpoint(stl_url: str, output: str = "json"):
    from fastapi.responses import HTMLResponse

    try:
        print(f"[slicer] downloading stl from {stl_url}")
        response = requests.get(stl_url, allow_redirects=True, timeout=10, verify=False)
        response.raise_for_status()
        stl_data = response.content
        print("[slicer] slicing stl")
        # Call the actual slicing function
        # Run slice and render in parallel
        slice_future = slice_stl.local(stl_data)
        render_future = render_model.remote.aio(stl_data)

        print("[slicer] waiting for slice and render to complete")
        result = await slice_future
        side1, side2 = await render_future
        print("[slicer] slice and render complete")

        side1 = base64.b64encode(side1).decode("utf-8")
        side2 = base64.b64encode(side2).decode("utf-8")
        # Create HTML with embedded images and metadata

        style = """<style>
                body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                img { max-width: 400px; height: auto; }
                .images { display: flex; gap: 20px; margin: 20px 0; }
                .metadata { background: #f5f5f5; padding: 20px; border-radius: 8px; }
            </style>"""
        html = """
        <html>
        <head>
            {}
        </head>
        <body>
            <h2>Model Preview</h2>
            <div class="images">
                <img src="data:image/png;base64,{}" alt="Front view">
                <img src="data:image/png;base64,{}" alt="Side view">
            </div>
            <div class="metadata">
                <h3>Print Metadata</h3>
                <ul>
                    <li>Filament Used: {:.2f}g ({:.2f}cm³)</li>
                    <li>Filament Cost: {:.2f}</li>
                    <li>Print Time (Normal): {}</li>
                    <li>Print Time (Silent): {}</li>
                    <li>Wipe Tower Filament: {:.2f}g</li>
                </ul>
            </div>
        </body>
        </html>
        """.format(
            style,
            side1,
            side2,
            result["slice_metadata"]["filament_used_g"],
            result["slice_metadata"]["filament_used_cm3"],
            result["slice_metadata"]["filament_cost"],
            result["slice_metadata"]["print_time_normal"],
            result["slice_metadata"]["print_time_silent"],
            result["slice_metadata"]["wipe_tower_filament_g"],
        )

        return HTMLResponse(html)

    except Exception as e:
        print(f"[slicer] error: {e}")
        return {"error": str(e)}


@app.local_entrypoint()
def main(path: str):
    local_file = Path(path)
    with open(local_file, "rb") as f:
        stl_data = f.read()
    result = slice_stl.remote(stl_data)
    with open("output.bgcode", "wb") as f:
        f.write(result["gcode"])
    print(result["metadata"])
