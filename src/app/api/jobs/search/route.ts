import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getById, searchJobs } from "@/lib/airtable";
import { COORDINATES_REGEX } from "@/lib/geo";
import dedent from "ts-dedent";
import { getDistance } from "@/lib/distance";
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await getById("user", session.user.id);
    if (!user) {
      return NextResponse.json(
        { code: 401, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const coordinates = searchParams.get("coordinates");

    const page = Number.parseInt(searchParams.get("page") || "0", 10);

    const q = query.toLowerCase().trim();

    if (!coordinates || !coordinates.match(COORDINATES_REGEX)) {
      return NextResponse.json(
        { code: 701, message: "Missing coordinates" },
        { status: 400 }
      );
    }

    const base_formula = dedent`
      AND(
        OR(
          SEARCH("${q}", LOWER({item_name})),
          SEARCH("${q}", LOWER({item_description})),
          SEARCH("${q}", LOWER({ysws_pr_url})),
          SEARCH("${q}", LOWER(ARRAYJOIN({(auto)(ysws)name}))),
          SEARCH("${q}", LOWER(ARRAYJOIN({(auto)(creator)slack_id})))
        ),
        {(auto)(assigned_printer)slack_id}=''
      )`.trim();

    let with_location_formula = base_formula;
    if (user.region_coordinates?.match(COORDINATES_REGEX)) {
      const [lat, lon] = user.region_coordinates.split(",").map(Number);
      const latf = `VALUE(REGEX_EXTRACT(ARRAYJOIN({(auto)(creator)region_coordinates}),"(.*),"))`;
      const lonf = `VALUE(REGEX_EXTRACT(ARRAYJOIN({(auto)(creator)region_coordinates}),",(.*)"))`;
      with_location_formula = dedent`
      AND(${base_formula},
        SQRT(POWER(${latf} - ${lat}, 2) + POWER(${lonf} - ${lon}, 2)) <= 0.06
      )`.trim();
    }

    let jobs = await searchJobs({
      formula: with_location_formula,
      offset: page,
      maxRecords: 10,
    });

    if (user.preferred_ysws?.length) {
      jobs = jobs.sort((a, b) => {
        const a_ysws = a.ysws?.[0];
        const b_ysws = b.ysws?.[0];
        if (!a_ysws || !b_ysws) return 0;
        return user.preferred_ysws!.includes(a_ysws)
          ? -1
          : user.preferred_ysws!.includes(b_ysws)
          ? 1
          : 0;
      });
    }

    jobs = jobs.map((job) => {
      const job_coords = job["(auto)(creator)region_coordinates"];
      if (coordinates && job_coords && job_coords.length >= 1) {
        Object.assign(job, {
          distance: getDistance(coordinates, job_coords[0]),
        });
      }

      job["(auto)(creator)region_coordinates"] = undefined;

      return job;
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error searching jobs:", error);
    return NextResponse.json(
      { code: 500, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
