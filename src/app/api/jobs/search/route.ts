import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchJobs } from "@/lib/airtable";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = Number.parseInt(searchParams.get("page") || "0", 10);

    const jobs = await searchJobs({
      query,
      mode: "search",
      offset: page,
      maxRecords: 10,
    });

    // Filter to only show jobs that need printing
    const availableJobs = jobs.filter(
      (job) => !job.assigned_printer_id && job.need_printed_parts
    );

    return NextResponse.json(availableJobs);
  } catch (error) {
    console.error("Error searching jobs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
