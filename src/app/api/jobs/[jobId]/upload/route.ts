import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getById } from "@/lib/airtable";

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

    // Get the file from the request
    const formData = await request.formData();
    console.log(formData.get("file"));
    const file = formData.get("file") as File;
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Convert file to buffer for Airtable upload
    const buffer = await file.arrayBuffer();

    // Upload to Airtable
    const response = await fetch(
      `https://content.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${job.id}/stls/uploadAttachment`,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error handling file upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
