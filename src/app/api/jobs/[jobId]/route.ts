import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBySlackId } from "@/lib/airtable";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const job = await getBySlackId("job", params.jobId);
    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
