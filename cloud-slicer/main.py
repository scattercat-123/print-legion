import os
import subprocess
from pathlib import Path
import requests
from modal import Image, Mount, App, web_endpoint

# Create a Modal app
app = App("orca-slicer")


# Define the base image with necessary dependencies
def download_orcaslicer():
    # Download OrcaSlicer AppImage
    url = "https://github.com/SoftFever/OrcaSlicer/releases/download/v2.2.0/OrcaSlicer_Linux_V2.2.0.AppImage"
    response = requests.get(url)
    with open("/usr/local/bin/orcaslicer", "wb") as f:
        f.write(response.content)
    # Make it executable
    os.chmod("/usr/local/bin/orcaslicer", 0o755)


image = (
    Image.debian_slim()
    .pip_install("requests", "fastapi[standard]")
    .apt_install(
        "fuse",  # Required for AppImage
        "libfuse2",  # Required for AppImage
        "wget",
        "xvfb",  # Virtual framebuffer for GUI apps
        "libgtk-3-0",  # Common GUI dependency
        "libdbus-1-3",  # Often required for GUI apps,
        "libgstreamer1.0-0",
        "libgstreamer-plugins-base1.0-0",
        "libegl1-mesa",
        "libegl1",
        "libwebkit2gtk-4.0-37",
    )
    .run_commands(["apt-get remove --auto-remove -y fuse", "apt-get install -y fuse"])
    .run_function(download_orcaslicer)
)


@app.function(image=image)
def slice_stl(raw_data: bytes):
    try:
        # Save the uploaded STL file
        input_path = "/tmp/input.stl"
        output_path = "/tmp/output.gcode"

        with open(input_path, "wb") as f:
            f.write(raw_data)

        # Run OrcaSlicer with xvfb-run for headless operation
        cmd = [
            "xvfb-run",
            "-a",
            "/usr/local/bin/orcaslicer",
            "--export-gcode",
            "--input",
            input_path,
            "--output",
            output_path,
        ]

        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            return {
                "error": f"Failed to slice STL: {result.stderr}",
                "stdout": result.stdout,
                "stderr": result.stderr,
            }

        # Read and return the G-code
        if os.path.exists(output_path):
            with open(output_path, "r") as f:
                gcode = f.read()
            return {"gcode": gcode}
        else:
            return {"error": "G-code file was not generated"}

    except Exception as e:
        return {"error": str(e)}


@app.function(image=image)
@web_endpoint(method="POST")
async def slice_stl_endpoint(raw_data: bytes):
    # Call the actual slicing function
    result = await slice_stl.remote(raw_data)
    return result


@app.local_entrypoint()
def main():
    local_file = Path("cloud-slicer/example_3d_case.stl")
    with open(local_file, "rb") as f:
        stl_data = f.read()
    result = slice_stl.remote(stl_data)
    print("Slicing result:", result)
