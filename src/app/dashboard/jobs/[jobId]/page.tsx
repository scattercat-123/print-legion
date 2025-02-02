import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import type { User } from "@/lib/types";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  DownloadIcon,
  FileIcon,
  GithubIcon,
  MapPin,
  PencilIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageCarousel, SlackCard } from "./client-components";
import { JobStateButtons } from "./states/job-state-buttons";
import { STATUS_AESTHETIC } from "@/lib/consts";
import { cached_getById } from "../../layout";
import { getSlackUserInfo, SlackUserInfo } from "@/lib/slack";
import { lazy } from "react";

const Markdown = lazy(() => import("@/components/markdown"));

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const jobId = (await params).jobId;
  const user = await cached_getById("user", session.user.id);
  const job = await cached_getById("job", jobId, {
    coordinatesForDistance: user?.region_coordinates,
  });

  if (!user || !job) {
    notFound();
  }

  const assignedPrinterId = job["(auto)(assigned_printer)slack_id"]?.[0];
  const creatorSlackId = job["(auto)(creator)slack_id"]?.[0];

  const creatorSlackInfoPromise = creatorSlackId
    ? getSlackUserInfo(creatorSlackId)
    : new Promise((r) => r(null));

  const printerSlackInfoPromise = assignedPrinterId
    ? getSlackUserInfo(assignedPrinterId)
    : new Promise((r) => r(null));
  const printerUserPromise = assignedPrinterId
    ? cached_getById("user", assignedPrinterId)
    : new Promise((r) => r(null));

  const printerDataPromise = Promise.all([
    printerSlackInfoPromise,
    printerUserPromise,
  ]) as Promise<[SlackUserInfo | null, User | null]>;

  const creatorDataPromise = Promise.all([
    creatorSlackInfoPromise,
    new Promise((r) => r(user)),
  ]) as Promise<[SlackUserInfo | null, User | null]>;

  const isMyJob = creatorSlackId === session.user.id;
  const isPrinting = assignedPrinterId === session.user.id;
  const hasPrinter = user.printer_has ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {job.item_name || "Untitled Job"}
          </h1>
          <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Badge variant="secondary-static" className="text-xs">
              {job.part_count || 0} part{job.part_count !== 1 ? "s" : ""}
            </Badge>
            {job.status && (
              <Badge
                variant="external-color"
                className={cn("text-xs", STATUS_AESTHETIC[job.status].color)}
              >
                {STATUS_AESTHETIC[job.status].text}
              </Badge>
            )}

            {job.distance !== undefined && job.distance > 0.0 && (
              <Badge variant="secondary-static" className="text-xs pl-1.5">
                <MapPin className="size-[0.875rem] shrink-0 mr-0.5" />~
                {job.distance.toFixed(1)} km
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {job.ysws_pr_url && (
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link
                href={job.ysws_pr_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubIcon className="size-4" />
                View PR
                <ArrowUpRightIcon className="size-3" />
              </Link>
            </Button>
          )}
          {isMyJob &&
            job.status !== "fulfilled_awaiting_confirmation" &&
            job.status !== "finished" && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <Link href={`/dashboard/jobs/edit/${jobId}`}>
                  <PencilIcon className="size-4" />
                  Edit Details
                </Link>
              </Button>
            )}
        </div>
      </div>

      {/* Description */}
      {job.item_description && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium tracking-tight">Description</h2>
          <Markdown>{job.item_description}</Markdown>
        </div>
      )}

      <ImageCarousel
        user_images={job.user_images}
        main_image_id={job.main_image_id}
      />

      {/* STL Files */}
      {job.stls && job.stls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium tracking-tight">STL Files</h2>
          <div className="grid gap-2">
            {job.stls.map((stl) => (
              <a
                key={stl.id}
                href={stl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-card hover:bg-muted/50 rounded-lg border border-border transition-colors group"
              >
                <div className="p-2 bg-muted rounded-md">
                  <FileIcon className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {stl.filename}
                    {stl.id === job.main_stl_id && (
                      <Badge variant="secondary" className="ml-2">
                        Main File
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(stl.size / 1024)}KB
                  </p>
                </div>
                <DownloadIcon className="size-4 text-muted-foreground group-hover:text-primary transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {creatorSlackId && creatorSlackId !== session.user.id && (
        <SlackCard
          title="Submitter"
          promise={creatorDataPromise}
          showPrinter={false}
        />
      )}

      {assignedPrinterId && assignedPrinterId !== session.user.id && (
        <SlackCard title="Assigned printer" promise={printerDataPromise} />
      )}

      <div className="flex flex-wrap gap-2 pt-4">
        <JobStateButtons
          jobId={jobId}
          status={job.status || "needs_printer"}
          isMyJob={isMyJob}
          isPrinting={isPrinting}
          hasPrinter={hasPrinter}
        />
      </div>
    </div>
  );
}
