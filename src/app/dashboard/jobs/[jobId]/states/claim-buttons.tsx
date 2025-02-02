"use client";

import { Button } from "@/components/ui/button";
import { PrinterIcon, XIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { claimJob, unclaimJob } from "./actions";
import { useState } from "react";
import { toast } from "sonner";
import type { StateButtonProps } from "./types";

export function ClaimButton({ jobId, onSuccess, onError }: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClaim = async () => {
    try {
      setIsLoading(true);
      await claimJob(jobId);
      toast.success("Job claimed", {
        description: "You can now start printing this job.",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to claim job:", error);
      toast.error("Failed to claim job", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      onError?.(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <PrinterIcon className="size-4" />
          Claim Job
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Claim this print job?</AlertDialogTitle>
          <AlertDialogDescription>
            By claiming this job, you&apos;re committing to print these parts.
            Make sure you have the right materials and time available.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClaim} disabled={isLoading}>
            Claim Job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UnclaimButton({ jobId, onSuccess, onError }: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnclaim = async () => {
    try {
      setIsLoading(true);
      await unclaimJob(jobId);
      toast.success("Job unclaimed", {
        description: "The job is now available for other printers.",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to unclaim job:", error);
      toast.error("Failed to unclaim job", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      onError?.(
        error instanceof Error ? error : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <XIcon className="size-4" />
          Unclaim Job
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unclaim this job?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove you as the printer for this job. Another printer
            will be able to claim it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUnclaim}
            disabled={isLoading}
            variant="destructive-outline"
          >
            Unclaim Job
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
