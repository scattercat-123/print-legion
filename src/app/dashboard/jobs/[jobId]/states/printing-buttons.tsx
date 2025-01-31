"use client";

import { Button } from "@/components/ui/button";
import { Loader2Icon, CheckIcon } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startPrinting, completePrinting } from "./actions";
import { useState } from "react";
import { toast } from "sonner";
import type { StateButtonProps } from "./types";

export function StartPrintingButton({
  jobId,
  onSuccess,
  onError,
}: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await startPrinting(jobId);
      toast.success("Print started", {
        description: "Good luck with the print!",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to start printing:", error);
      toast.error("Failed to start printing", {
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
          <Loader2Icon className="size-4" />
          Start Printing
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start printing this job?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark the job as "In Progress". Make sure you have all the
            necessary materials ready.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleStart} disabled={isLoading}>
            Start Printing
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CompletePrintingButton({
  jobId,
  onSuccess,
  onError,
}: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const grams = Number(formData.get("grams"));
    const notes = formData.get("notes")?.toString();

    if (Number.isNaN(grams) || grams < 0) {
      toast.error("Invalid input", {
        description: "Please enter a valid amount of filament used in grams.",
      });
      return;
    }

    try {
      setIsLoading(true);
      await completePrinting(jobId, { grams, notes });
      toast.success("Print completed", {
        description: "Great job! You can now proceed with fulfillment.",
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to complete printing:", error);
      toast.error("Failed to complete printing", {
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <CheckIcon className="size-4" />
          Finish Printing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleComplete}>
          <DialogHeader>
            <DialogTitle>Complete Print Job</DialogTitle>
            <DialogDescription>
              Please provide information about the completed print.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="grams">Filament Used (grams)</Label>
              <Input
                id="grams"
                name="grams"
                type="number"
                min="0"
                step="0.1"
                required
                placeholder="Enter amount in grams"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes about the print"
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Complete Print
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
