import React, { memo } from "react";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { claimJob, unclaimJob, updateJobStatus } from "@/app/actions";
import { useRouter } from "next/navigation";
import { FileBox } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { STLViewerWrapper } from "./stl-viewer";

interface JobCardProps {
  job: Job;
  isAssigned?: boolean;
  showActions?: boolean;
  className?: string;
}

function JobCardComponent({
  job,
  isAssigned = false,
  showActions = true,
  className,
}: JobCardProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-500";
      case "claimed":
        return "bg-blue-500/20 text-blue-500";
      case "in_progress":
        return "bg-purple-500/20 text-purple-500";
      case "completed":
        return "bg-green-500/20 text-green-500";
      case "cancelled":
        return "bg-red-500/20 text-red-500";
      default:
        return "bg-zinc-500/20 text-zinc-500";
    }
  };

  const handleClaim = async () => {
    try {
      await claimJob(job.slack_id);
      router.refresh();
    } catch (error) {
      console.error("Failed to claim job:", error);
    }
  };

  const handleUnclaim = async () => {
    try {
      await unclaimJob(job.slack_id);
      router.refresh();
    } catch (error) {
      console.error("Failed to unclaim job:", error);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateJobStatus(job.slack_id, status);
      router.refresh();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  return (
    <div
      className={cn(
        "p-4 bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg">{job.ysws || "Untitled Job"}</h3>
          <p className="text-zinc-400">Parts: {job.part_count || 0}</p>
        </div>
        {job.status && (
          <span
            className={cn(
              "px-3 py-1 rounded-lg text-sm",
              getStatusColor(job.status)
            )}
          >
            {job.status}
          </span>
        )}
      </div>

      <div className="mt-2 space-x-2">
        {job.ysws_pr_url && (
          <a
            href={job.ysws_pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 inline-block"
          >
            View PR →
          </a>
        )}
        {job.stls && job.stls.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FileBox className="w-4 h-4 mr-2" />
                View STL
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>{job.ysws || "Job"} - STL Preview</DialogTitle>
              </DialogHeader>
              <STLViewerWrapper url={job.stls[0].url} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {showActions && (
        <div className="mt-4 space-x-2">
          {!isAssigned ? (
            <Button onClick={handleClaim} variant="outline" size="sm">
              Claim Job
            </Button>
          ) : (
            <>
              <Button
                onClick={() => handleStatusUpdate("in_progress")}
                variant="outline"
                size="sm"
              >
                Start Printing
              </Button>
              <Button
                onClick={() => handleStatusUpdate("completed")}
                variant="outline"
                size="sm"
              >
                Mark Complete
              </Button>
              <Button onClick={handleUnclaim} variant="outline" size="sm">
                Unclaim
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export const JobCard = memo(JobCardComponent);
