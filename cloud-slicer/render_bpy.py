def render_model(stl_path: str, output_dir="renders"):
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
        scene.render.engine = "BLENDER_EEVEE"
        scene.eevee.taa_samples = 128
        scene.eevee.taa_render_samples = 128
        scene.eevee.use_shadows = True

        # Set render film transparency for a transparent background
        scene.render.film_transparent = True

        print(
            "Scene set up complete with object imported, red material applied, isometric square camera view, and transparent background."
        )

        return obj, cam_obj

    # Setup
    model, camera = setup_scene(stl_path)

    # delete any Blender Cubes
    # deselect all objects
    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.name == "Cube" or obj.name == "Light":
            obj.select_set(True)
            bpy.ops.object.delete()

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Render settings
    bpy.context.scene.render.image_settings.file_format = "PNG"
    bpy.context.scene.render.resolution_x = 1024
    bpy.context.scene.render.resolution_y = 1024

    # Just render one view
    output_path = os.path.join(output_dir, "test_render.png")
    bpy.context.scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)

    # Instead, set the object's origin to its geometry center and rotate it 180° along Y axis
    bpy.context.view_layer.objects.active = model
    model.select_set(True)
    bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
    model.rotation_euler[1] += math.radians(180)

    # Render the second view (with the rotated model)
    output_path = os.path.join(output_dir, "test_render_side.png")
    bpy.context.scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    import argparse

    def main():
        parser = argparse.ArgumentParser(
            description="Render a 3D model from an STL file."
        )
        parser.add_argument(
            "stl_path", type=str, help="Path to the STL file to render."
        )
        parser.add_argument(
            "--output_dir",
            type=str,
            default="renders",
            help="Directory to save rendered images.",
        )

        args = parser.parse_args()
        render_model(args.stl_path, args.output_dir)

    if __name__ == "__main__":
        render_model(
            "/Users/vrishank/Downloads/piece.stl",
            "/Users/vrishank/Development/Projects/launchpad/cloud-slicer/renders",
        )

# # Example usage:
# if __name__ == "__main__":
#     stl_path = "/Users/vrishank/Downloads/piece.stl"
#     render_model(stl_path)
