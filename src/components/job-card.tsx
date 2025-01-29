"use client";
import { memo } from "react";
import type { Job } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { ArrowUpRightIcon, Github } from "lucide-react";

interface JobCardProps {
  job: Job & { id: string };
  isAssigned?: boolean;
  className?: string;
}

function JobCardComponent({
  job,
  isAssigned = false,
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

  return (
    <div
      className={cn(
        "p-4 bg-card border border-border hover:border-zinc-700 transition-all flex gap-2 rounded-xl",
        className
      )}
    >
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{job.item_name || "Untitled Job"}</h3>
            {job.item_description && (
              <p className="text-sm text-zinc-500">
                {job.item_description.slice(0, 100).trim()}
                {job.item_description.length > 100 && "..."}
              </p>
            )}
            <div className="flex flex-row gap-1 mt-1">
              {job.part_count && (
                <Badge variant="secondary-static" className="text-xs">
                  {job.part_count} part{job.part_count > 1 ? "s" : ""}
                </Badge>
              )}

              {job.status && (
                <Badge
                  variant="external-color"
                  className={cn("text-xs", getStatusColor(job.status))}
                >
                  {job.status
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-x-2 flex flex-row">
          <Button
            onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
            variant="default"
            size="sm"
            className="pr-1.5"
          >
            View Details/Actions <ArrowUpRightIcon className="w-4 h-4 ml-1" />
          </Button>
          {job.ysws_pr_url && (
            <Button
              onClick={() => window.open(job.ysws_pr_url, "_blank")}
              variant="secondary"
              size="sm"
            >
              <Github className="w-4 h-4 mr-1.5" />
              View PR
            </Button>
          )}
        </div>
      </div>
      <div className="w-full max-w-[7.375rem] hidden md:flex">
        <img
          src={`https://picsum.photos/400/400?random=${job.id}`}
          alt="Job"
          className="size-[7.375rem] object-contain shrink rounded-md"
        />
      </div>
    </div>
  );
}

export const JobCard = memo(JobCardComponent);
