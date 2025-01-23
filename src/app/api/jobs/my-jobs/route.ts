import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBySlackId, searchJobs } from "@/lib/airtable";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await getBySlackId("user", session.user.id);
    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // If the user is a printer, return their assigned job
    const all_jobs = await searchJobs();
    const jobs = all_jobs.filter(
      (job) => job.assigned_printer_id === user.slack_id
    );
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
