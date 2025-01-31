"use client";

import { useMemo } from "react";
import { ClaimButton, UnclaimButton } from "./claim-buttons";
import {
  StartPrintingButton,
  CompletePrintingButton,
} from "./printing-buttons";
import {
  MarkFulfilledButton,
  ConfirmFulfillmentButton,
} from "./fulfillment-buttons";
import type { JobStatusType } from "@/lib/types";

interface JobStateButtonsProps {
  jobId: string;
  status: JobStatusType;
  isMyJob: boolean;
  isPrinting: boolean;
  hasPrinter: boolean;
  onStateChange?: () => void;
  onError?: (error: Error) => void;
}

export function JobStateButtons({
  jobId,
  status,
  isMyJob,
  isPrinting,
  hasPrinter,
  onStateChange,
  onError,
}: JobStateButtonsProps) {
  const buttons = useMemo(() => {
    // If I'm the submitter
    if (isMyJob) {
      if (status === "fulfilled_awaiting_confirmation") {
        return (
          <ConfirmFulfillmentButton
            jobId={jobId}
            onSuccess={onStateChange}
            onError={onError}
          />
        );
      }
      // No other actions available for submitter
      return null;
    }

    // If I'm a printer
    if (hasPrinter) {
      // Initial state - can claim if not claimed
      if (status === "needs_printer") {
        return (
          <ClaimButton
            jobId={jobId}
            onSuccess={onStateChange}
            onError={onError}
          />
        );
      }

      // If I'm the assigned printer
      if (isPrinting) {
        switch (status) {
          case "claimed":
            return (
              <div className="flex flex-wrap gap-2">
                <StartPrintingButton
                  jobId={jobId}
                  onSuccess={onStateChange}
                  onError={onError}
                />
                <UnclaimButton
                  jobId={jobId}
                  onSuccess={onStateChange}
                  onError={onError}
                />
              </div>
            );
          case "printing_in_progress":
            return (
              <CompletePrintingButton
                jobId={jobId}
                onSuccess={onStateChange}
                onError={onError}
              />
            );
          case "completed_printing":
            return (
              <MarkFulfilledButton
                jobId={jobId}
                onSuccess={onStateChange}
                onError={onError}
              />
            );
          default:
            return null;
        }
      }
    }

    return null;
  }, [jobId, status, isMyJob, isPrinting, hasPrinter, onStateChange, onError]);

  return buttons;
}
