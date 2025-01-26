import { NextResponse } from "next/server";
import { getAll_YSWS } from "@/lib/airtable/ysws_index";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() || "";

  try {
    const allYSWS = await getAll_YSWS();
    const filtered = allYSWS.filter((ysws) =>
      ysws.name?.toLowerCase().includes(query)
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error searching YSWS:", error);
    return NextResponse.json(
      { error: "Failed to search YSWS" },
      { status: 500 }
    );
  }
}
