import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getById, updateBySlackId } from "@/lib/airtable";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get the job and verify ownership
    const job = await getById("job", (await params).jobId);
    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }
    if (job.slack_id !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // Get the file and metadata from the request
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const isMain = formData.get("isMain") === "true";
    const fileType = formData.get("fileType") as "stl" | "image";

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }
    if (!fileType || !["stl", "image"].includes(fileType)) {
      return new NextResponse("Invalid file type", { status: 400 });
    }

    // Convert file to buffer for Airtable upload
    const buffer = await file.arrayBuffer();

    // Upload to Airtable
    const uploadEndpoint = fileType === "stl" ? "stls" : "user_images";
    const response = await fetch(
      `https://content.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${job.id}/${uploadEndpoint}/uploadAttachment`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contentType: file.type,
          file: Buffer.from(buffer).toString("base64"),
          filename: file.name,
        }),
      }
    );

    if (!response.ok) {
      console.error("Airtable upload failed:", await response.text());
      return new NextResponse("Failed to upload file", { status: 500 });
    }

    const uploadResult = await response.json();
    const attachmentId = uploadResult.id;

    // If this is the main file, update the job record
    if (isMain) {
      const updateField = fileType === "stl" ? "main_stl_id" : "main_image_id";
      await updateBySlackId("job", job.id, {
        [updateField]: attachmentId,
      });
    }

    return NextResponse.json({ success: true, attachmentId });
  } catch (error) {
    console.error("Error handling file upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
