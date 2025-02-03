"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { CheckIcon, UploadIcon } from "lucide-react";
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
import { updateJobStatus } from "@/lib/actions/jobs/job-status.action";

export function MarkFulfilledButton({
  jobId,
  onSuccess,
  onError,
}: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && !file.type.startsWith("image/")) {
      toast.error("Invalid file type", {
        description: "Please select an image file.",
      });
      return;
    }
    setSelectedFile(file || null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Missing photo", {
        description: "Please upload a photo of the delivered print.",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    const description = formData.get("description")?.toString();

    try {
      setIsLoading(true);
      await updateJobStatus(jobId, {
        status: "fulfilled_awaiting_confirmation",
        fulfilment_notes: description,
      });

      const uploadFormData = new FormData();
      uploadFormData.append("file", selectedFile);
      uploadFormData.append("fileType", "fulfillment_photo");

      const response = await fetch(`/api/jobs/${jobId}/upload`, {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload fulfillment photo`);
      }

      toast.success("Job marked as fulfilled", {
        description: "Waiting for the submitter to confirm receipt.",
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to mark as fulfilled:", error);
      toast.error("Failed to mark as fulfilled", {
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
          Mark as Fulfilled
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Mark Job as Fulfilled</DialogTitle>
            <DialogDescription>
              Please upload a photo of the delivered print and add any relevant
              notes.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="photo">Fulfillment Photo</Label>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="photo"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "flex items-center cursor-pointer gap-2"
                    )}
                  >
                    <UploadIcon className="size-4" />
                    Upload Fulfillment Photo
                  </label>
                  <Input
                    id="photo"
                    name="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    className="hidden"
                  />
                </div>
                {selectedFile && (
                  <div className="relative aspect-video rounded-lg border border-border overflow-hidden bg-muted">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Notes (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Any additional notes about the delivery"
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
              Mark as Fulfilled
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmFulfillmentButton({
  jobId,
  onSuccess,
  onError,
}: StateButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await updateJobStatus(jobId, {
        status: "finished",
      });
      toast.success("Fulfillment confirmed", {
        description: "Thank you for confirming receipt of your print!",
      });
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to confirm fulfillment:", error);
      toast.error("Failed to confirm fulfillment", {
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
          Confirm Receipt
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Print Receipt</DialogTitle>
          <DialogDescription>
            Please confirm that you have received your print and are satisfied
            with it. This will mark the job as complete.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            Confirm Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
