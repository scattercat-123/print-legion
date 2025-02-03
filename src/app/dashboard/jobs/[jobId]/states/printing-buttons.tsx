"use client";

import { Button } from "@/components/ui/button";
import {
  Loader2Icon,
  CheckIcon,
  UploadIcon,
  FileIcon,
  TrashIcon,
} from "lucide-react";
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
import { useState } from "react";
import { toast } from "sonner";
import type { StateButtonProps } from "./types";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { updateJobStatus } from "@/lib/actions/jobs/job-status.action";

export function StartPrintingButton({
  jobId,
  onSuccess,
  onError,
}: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    try {
      setIsLoading(true);
      await updateJobStatus(jobId, {
        status: "printing_in_progress",
      });
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
            This will mark the job as &quot;In Progress&quot;. Make sure you
            have all the necessary materials ready.
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    const invalidFiles = files.filter(
      (file) =>
        ![".gcode", ".bgcode", ".gcode.gz", ".bgcode.gz"].some((ext) =>
          file.name.endsWith(ext)
        )
    );

    if (invalidFiles.length > 0) {
      toast.error("Invalid file type", {
        description:
          "Please select only gcode files.\nSupported file types: .gcode, .bgcode, .gcode.gz, .bgcode.gz",
      });
      return;
    }

    if (files.length > 10) {
      toast.error("Too many files", {
        description:
          "Please select up to 10 files. We only need the gcode files used for printing.",
      });
      files = files.slice(0, 10);
    }

    setSelectedFiles(files);
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Missing gcode files", {
        description: "Please upload at least one gcode file used for printing.",
      });
      return;
    }

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

      // Upload all gcode files
      for (const file of selectedFiles) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("fileType", "gcode_file");

        const response = await fetch(`/api/jobs/${jobId}/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload gcode file: ${file.name}`);
        }
      }

      await updateJobStatus(jobId, {
        status: "completed_printing",
        filament_used: grams,
        printing_notes: notes,
      });

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
              Please provide information about the completed print and upload
              the gcode file(s) used.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gcode">Gcode Files</Label>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="gcode"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "flex items-center cursor-pointer gap-2"
                    )}
                  >
                    <UploadIcon className="size-4" />
                    Upload gcode files
                  </label>
                  <Input
                    id="gcode"
                    name="gcode"
                    type="file"
                    accept=".gcode, .bgcode, .gcode.gz, .bgcode.gz"
                    onChange={handleFileChange}
                    required
                    multiple
                    className="hidden"
                  />
                </div>
                {selectedFiles.length > 0 && (
                  <div className="text-sm space-y-1">
                    <div className="font-medium">Selected files</div>
                    <div className="space-y-1">
                      {selectedFiles.map((file) => (
                        <div
                          key={file.name}
                          className="flex items-center gap-2 bg-card border border-border rounded-md px-2 py-0.5"
                        >
                          <FileIcon className="size-4 text-muted-foreground" />
                          <span className="flex-1 truncate w-full text-sm">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            className="p-1 rounded-full transition-colors text-red-400 hover:text-red-600"
                          >
                            <TrashIcon className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="grams">Filament Used (grams)</Label>
              <Input
                id="grams"
                name="grams"
                type="number"
                min="0"
                step="0.1"
                required
                className="text-sm"
                placeholder="Enter amount in grams"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes about the print"
                className="resize-none text-sm"
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
