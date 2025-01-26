import { auth } from "@/lib/auth";
import { searchJobs } from "@/lib/airtable";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || (type !== "prints" && type !== "submissions")) {
    return new NextResponse("Invalid type parameter", { status: 400 });
  }

  try {
    // Create a filter query for Airtable
    const filterQuery =
      type === "prints"
        ? `{assigned_printer_id} = '${session.user.id}'`
        : `{slack_id} = '${session.user.id}'`;

    const jobs = await searchJobs({ query: filterQuery, mode: "formula" });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
