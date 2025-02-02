"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useYSWSSelector,
  YSWS_SelectorProvider,
} from "@/hooks/use-ysws-search";
import YSWS_Selector from "@/hooks/use-ysws-search";
import { toast } from "sonner";
import {
  ImageIcon,
  FileIcon,
  StarIcon,
  TrashIcon,
  FileBoxIcon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  HomeIcon,
  CheckIcon,
} from "lucide-react";
import { createJob } from "@/app/actions";
import { cn } from "@/lib/utils";
import Link from "next/link";
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

export default function CreateJobPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);
  return (
    <YSWS_SelectorProvider
      getInitialValue={() => {
        if (isMounted && localStorage.getItem("createJob_ysws")) {
          return JSON.parse(localStorage.getItem("createJob_ysws") || "[]");
        }
        return [];
      }}
      onChangeExtra={(selected) => {
        localStorage.setItem("createJob_ysws", JSON.stringify(selected));
      }}
    >
      <PureCreateJobPage />
    </YSWS_SelectorProvider>
  );
}

function PureCreateJobPage() {
  const [files, setFiles] = useState<{
    images: File[];
    stls: File[];
  }>({ images: [], stls: [] });
  const [mainFiles, setMainFiles] = useState<{
    images: number;
    stls: number;
  }>({ images: -1, stls: -1 });
  const finalJobId = useRef<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logs, setLogs] = useState<
    Array<{
      id: string;
      message: string;
      status: "loading" | "success" | "error";
    }>
  >([]);

  const { ref: yswsSelectorRef } = useYSWSSelector();
  const addLog = (
    message: string,
    status: "loading" | "success" | "error" = "loading",
    id?: string
  ) => {
    const resolvedId =
      id ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    setLogs((prev) => [
      ...prev,
      {
        id: resolvedId,
        message,
        status,
      },
    ]);
    return { id: resolvedId };
  };

  const updateLog = (status: "success" | "error", id?: string) => {
    setLogs((prev) => {
      const newLogs = [...prev];
      if (id && id !== "last") {
        const log = newLogs.find((log) => log.id === id);
        if (log) {
          log.status = status;
        }
      } else if (newLogs.length > 0) {
        newLogs[newLogs.length - 1].status = status;
      }
      return newLogs;
    });
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const images = newFiles.filter((file) => file.type.startsWith("image/"));
      const stls = newFiles.filter((file) =>
        file.name.toLowerCase().endsWith(".stl")
      );

      // Apply limits and show warnings if needed
      if (images.length > 5) {
        toast.warning("Maximum 5 images allowed", {
          description: "Only the first 5 images will be uploaded.",
        });
      }
      if (stls.length > 10) {
        toast.warning("Maximum 10 STL files allowed", {
          description: "Only the first 10 STL files will be uploaded.",
        });
      }

      setFiles((prev) => ({
        images: [...prev.images, ...images.slice(0, 5 - prev.images.length)],
        stls: [...prev.stls, ...stls.slice(0, 10 - prev.stls.length)],
      }));

      // if the length is 1, set the main file to the first one
      if (images.length === 1) {
        setMainFiles((prev) => ({ ...prev, images: 0 }));
      }
      if (stls.length === 1) {
        setMainFiles((prev) => ({ ...prev, stls: 0 }));
      }
    }
  };

  const toggleMainFile = (type: "images" | "stls", index: number) => {
    setMainFiles((prev) => ({
      ...prev,
      [type]: prev[type] === index ? -1 : index,
    }));
  };

  const deleteFile = (type: "images" | "stls", index: number) => {
    setFiles((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const clearForm = (moveBack = true) => {
    // clear local storage
    localStorage.removeItem("createJobState");
    for (const key of [
      "item_name",
      "item_description",
      "pr_url",
      "part_count",
      "ysws",
    ]) {
      localStorage.removeItem(`createJob_${key}`);
    }

    setFiles({ images: [], stls: [] });
    setMainFiles({ images: -1, stls: -1 });

    yswsSelectorRef.current?.reset();
    document.querySelector("form")?.reset();
    if (moveBack) {
      setLogs([]);
      setIsSubmitting(false);
    }
  };

  const validateForm = (formData: FormData): boolean => {
    if (files.images.length === 0) {
      toast.error("Missing files", {
        description: "At least one image is required",
      });
      return false;
    }
    if (files.stls.length === 0) {
      toast.error("Missing files", {
        description: "At least one STL file is required",
      });
      return false;
    }
    if (mainFiles.images === -1) {
      toast.error("Main file required", {
        description: "Please select a main image",
      });
      return false;
    }
    if (mainFiles.stls === -1) {
      toast.error("Main file required", {
        description: "Please select a main STL file",
      });
      return false;
    }

    const selectedOptions = yswsSelectorRef.current?.selectedValue ?? [];
    if (selectedOptions.length === 0) {
      toast.error("YSWS required", {
        description: "Please select a YSWS",
      });
      return false;
    }

    const itemName = formData.get("item_name")?.toString();
    const itemDescription = formData.get("item_description")?.toString();
    const partCount = Number.parseInt(
      formData.get("part_count")?.toString() || "0",
      10
    );

    if (!itemName?.trim()) {
      toast.error("Item name required", {
        description: "Please enter a name for your item",
      });
      return false;
    }

    if (!itemDescription?.trim() || itemDescription.split(/\s+/).length < 50) {
      toast.error("Description too short", {
        description: "Please provide a description with at least 50 words",
      });
      return false;
    }

    if (partCount <= 0) {
      toast.error("Invalid part count", {
        description: "Number of parts must be greater than 0",
      });
      return false;
    }

    const prUrl = formData.get("pr_url")?.toString();
    if (prUrl && !prUrl.startsWith("https://")) {
      toast.error("Invalid PR URL", {
        description: "PR URL must start with https://",
      });
      return false;
    }

    return true;
  };

  // Modify the back button click handler
  const handleBackClick = () => {
    setIsSubmitting(false);
    // Clear file state when going back
    setFiles({ images: [], stls: [] });
    setMainFiles({ images: -1, stls: -1 });
  };

  // Remove file state from localStorage persistence
  useEffect(() => {
    if (!isSubmitting) {
      localStorage.setItem(
        "createJobState",
        JSON.stringify({
          mainFiles: { images: -1, stls: -1 }, // Reset file selections
        })
      );
    }
  }, [files, mainFiles, isSubmitting]);

  // Remove file restoration from the mount effect
  useEffect(() => {
    const savedState = localStorage.getItem("createJobState");
    if (savedState) {
      try {
        // Only restore if we're not in submitting state
        if (!isSubmitting) {
          // Restore text input values
          const form = document.querySelector("form");
          if (form) {
            ["item_name", "item_description", "pr_url", "part_count"].forEach(
              (fieldName) => {
                const input = form.querySelector(`[name="${fieldName}"]`) as
                  | HTMLInputElement
                  | HTMLTextAreaElement;
                if (input) {
                  const savedValue = localStorage.getItem(
                    `createJob_${fieldName}`
                  );
                  if (savedValue) {
                    input.value = savedValue;
                  }
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Failed to restore form state:", error);
        localStorage.removeItem("createJobState");
      }
    }
  }, [isSubmitting]);

  // Save text input values on change
  useEffect(() => {
    const form = document.querySelector("form");
    if (form) {
      const handleChange = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLTextAreaElement;
        if (
          target.name &&
          ["item_name", "item_description", "pr_url", "part_count"].includes(
            target.name
          )
        ) {
          localStorage.setItem(`createJob_${target.name}`, target.value);
        }
      };

      form.addEventListener("input", handleChange);
      return () => form.removeEventListener("input", handleChange);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Client-side validation
    if (!validateForm(formData)) {
      return;
    }

    setIsSubmitting(true);
    setLogs([]);

    try {
      // Add YSWS data to form
      const selectedOptions = yswsSelectorRef.current?.selectedValue ?? [];
      formData.set(
        "ysws",
        JSON.stringify(selectedOptions.map((opt) => opt.value))
      );

      // Create job record
      addLog("Creating job record...", "loading", "createJobRecord");
      const result = await createJob(formData);
      updateLog("success", "createJobRecord");

      // Upload STL files
      for (const [index, file] of files.stls.entries()) {
        const logId = addLog(
          `Uploading ${file.name.slice(0, 35)}${
            file.name.length > 35 ? "..." : ""
          }`
        ).id;
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("isMain", (index === mainFiles.stls).toString());
        uploadFormData.append("fileType", "stl");

        const response = await fetch(`/api/jobs/${result.jobId}/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        updateLog("success", logId);
      }

      // Upload images
      for (const [index, file] of files.images.entries()) {
        const logId = addLog(
          `Uploading image ${file.name.slice(0, 35)}${
            file.name.length > 35 ? "..." : ""
          }`
        ).id;
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append(
          "isMain",
          (index === mainFiles.images).toString()
        );
        uploadFormData.append("fileType", "image");

        const response = await fetch(`/api/jobs/${result.jobId}/upload`, {
          method: "POST",
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        updateLog("success", logId);
      }

      addLog("Job created successfully!", "success", "finalizeJob");

      clearForm(false);
      finalJobId.current = result.jobId;
    } catch (error) {
      updateLog("error", "createJobRecord");
      console.error("Failed to create job:", error);
      addLog(
        `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
        "error"
      );
      toast.error("Failed to create job", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const FileList = ({
    type,
    files,
    mainFileIndex,
    onToggleMain,
    onDelete,
  }: {
    type: "image" | "stl";
    files: File[];
    mainFileIndex: number;
    onToggleMain: (index: number) => void;
    onDelete: (index: number) => void;
  }) => (
    <div className="space-y-2">
      <div className="flex flex-col">
        <div className="text-sm font-medium">
          {type === "image" ? "Images" : "STL Files"}
        </div>
        {files.length > 0 && (
          <span className="text-xs text-muted-foreground mt-0.5">
            Click the star to set the main{" "}
            {type === "image" ? "image" : "3D model"}.{" "}
            {type === "image"
              ? "The main image will be shown when searching for your item, to help people see what you&apos;re printing. The rest will be shown when people view the details of your job."
              : "All models will be printed, but the main one may be used to generate 3D preview images in the future."}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div
            key={file.name}
            className="flex items-center gap-2 p-2 rounded-md border border-input bg-card"
          >
            {type === "image" ? (
              <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="flex-1 truncate text-sm">{file.name}</span>
            <div className="flex">
              <button
                type="button"
                onClick={() => onDelete(index)}
                className={`p-1 rounded-full transition-colors text-red-400 hover:text-red-600`}
                title={`Delete ${file.name}`}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onToggleMain(index)}
                className={`p-1 rounded-full transition-colors ${
                  mainFileIndex === index
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={
                  mainFileIndex === index
                    ? `Main ${type}`
                    : `Set as main ${type}`
                }
              >
                <StarIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Submit Job</h1>
      {!isSubmitting && (
        <div className="mt-1.5 text-sm border-border/50 border px-3 py-1.5 text-muted-foreground rounded-md">
          <b>How does this work?</b>
          <ul className="space-y-1 list-decimal list-inside text-xs">
            <li>
              Fill out the form below with the details of the thing you want
              printed.
            </li>
            <li>Upload the STL files, images, etc. Submit!</li>
            <li>
              Somebody in your area may claim the job and print it - you can
              monitor your print&apos;s progress in the dashboard.
            </li>
            <li>
              You&apos;ll communicate with the person who prints your job via
              Slack to arrange pickup. to arrange pickup.
            </li>
          </ul>
        </div>
      )}

      {!isSubmitting ? (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="item_name"
                className="block text-sm font-medium mb-2"
              >
                Item Name
              </label>
              <Input
                id="item_name"
                name="item_name"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="item_description"
                className="flex flex-col text-sm font-medium mb-2"
              >
                Item Description
                <span className="text-xs text-muted-foreground">
                  We support markdown formatting!
                </span>
              </label>
              <Textarea
                id="item_description"
                name="item_description"
                placeholder="Describe your item in detail (minimum 50 words)"
                required
                className="min-h-[100px] max-h-[300px]"
                minLength={50}
              />
            </div>

            <div>
              <label htmlFor="ysws" className="block text-sm font-medium mb-2">
                YSWS Selection
              </label>
              <YSWS_Selector maxSelected={1} />
            </div>

            <div>
              <label
                htmlFor="pr_url"
                className="block text-sm font-medium mb-2"
              >
                PR URL
              </label>
              <Input
                id="pr_url"
                name="pr_url"
                type="url"
                pattern="https://.*"
                placeholder="Enter PR URL (must be a valid URL)"
              />
            </div>

            <div>
              <label
                htmlFor="part_count"
                className="block text-sm font-medium mb-2"
              >
                Number of Parts
              </label>
              <Input
                id="part_count"
                name="part_count"
                type="number"
                min="1"
                placeholder="Enter number of parts"
                required
              />
            </div>

            <div>
              <label
                htmlFor="files"
                className="flex flex-col text-sm font-medium mb-2"
              >
                Upload Files
                <span className="text-xs text-muted-foreground">
                  You must have at least one square image of your item and one
                  STL file (3D model, to be printed)
                </span>
              </label>

              <div className="relative group">
                <div className="min-h-[120px] rounded-md border border-dashed border-input bg-card hover:border-primary/40 transition-colors">
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="size-7 shrink-0 text-muted-foreground" />
                      <FileBoxIcon className="size-7 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm text-muted-foreground">
                        Drop your files here or click to browse
                      </span>
                    </div>
                  </div>
                  <Input
                    id="files"
                    name="files"
                    type="file"
                    accept="image/*,.stl"
                    multiple
                    required
                    onChange={handleFilesChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full"
                  />
                </div>
              </div>

              {(files.images.length > 0 || files.stls.length > 0) && (
                <div className="mt-4 space-y-6">
                  {files.images.length > 0 && (
                    <FileList
                      type="image"
                      files={files.images}
                      mainFileIndex={mainFiles.images}
                      onToggleMain={(index) => toggleMainFile("images", index)}
                      onDelete={(index) => deleteFile("images", index)}
                    />
                  )}
                  {files.stls.length > 0 && (
                    <FileList
                      type="stl"
                      files={files.stls}
                      mainFileIndex={mainFiles.stls}
                      onToggleMain={(index) => toggleMainFile("stls", index)}
                      onDelete={(index) => deleteFile("stls", index)}
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-1.5">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2Icon className="size-4 mr-2 animate-spin" />
              ) : (
                <CheckIcon className="size-4 mr-2" />
              )}
              Create Job
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive-outline"
                  className="flex items-center"
                >
                  <TrashIcon className="size-4 mr-2" />
                  Clear Form
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    everything you&apos;ve entered, and you&apos;ll have to
                    start over.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive-outline"
                    onClick={() => clearForm(true)}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="border rounded-lg bg-card">
            <div className="px-4 py-2 border-b bg-muted/40 text-center relative">
              {/* macos like terminal */}
              <div className="flex items-center justify-center absolute top-[50%] -translate-y-1/2 left-3 gap-1">
                <div className="size-3 rounded-full bg-green-500"></div>
                <div className="size-3 rounded-full bg-yellow-500"></div>
                <div className="size-3 rounded-full bg-red-500"></div>
              </div>
              <h2 className="font-medium text-sm">~$ ./create_job.sh</h2>
            </div>
            <div className="p-4 font-mono text-sm space-y-2">
              {logs.map(({ id, message, status }) => (
                <div key={id} className="flex items-center gap-2">
                  {status === "loading" && (
                    <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  )}
                  {status === "success" && (
                    <CheckCircleIcon className="size-4 shrink-0 text-green-500" />
                  )}
                  {status === "error" && (
                    <XCircleIcon className="size-4 shrink-0 text-red-500" />
                  )}
                  <span className="flex-1">{message}</span>
                </div>
              ))}
            </div>
          </div>

          {logs.some((log) => log.status === "error") && (
            <div className="flex flex-col space-y-2">
              <span className="text-xs text-muted-foreground mt-1 space-y-0.5 flex flex-col">
                <span className="font-medium">
                  We tried to create your job, but something went wrong.
                </span>
                <span>
                  Your form entry was saved locally, so you can try again.
                </span>
                <span>
                  If the issue keeps happening, please contact us in
                  #print-legion on slack!
                </span>
              </span>

              <Button
                type="button"
                variant="outline"
                onClick={handleBackClick}
                className="w-min"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                Go Back
              </Button>
            </div>
          )}

          {logs.some((log) => log.id === "finalizeJob") && (
            <div className="flex max-sm:flex-col max-sm:space-y-2 sm:space-x-2">
              <Link
                href="/dashboard"
                className={cn(buttonVariants({ variant: "outline" }), "w-full")}
              >
                <HomeIcon className="h-4 w-4 mr-1.5 shrink-0" />
                Go to Dashboard
              </Link>
              <Link
                href={`/dashboard/jobs/${finalJobId.current}`}
                className={cn(buttonVariants({ variant: "default" }), "w-full")}
              >
                Open Job Details Page
                <ArrowUpRightIcon className="h-4 w-4 ml-1.5 shrink-0" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
