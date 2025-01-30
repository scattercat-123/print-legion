import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getById } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import type { User } from "@/lib/types";
import Link from "next/link";
import {
  ArrowUpRightIcon,
  CheckIcon,
  FileIcon,
  GithubIcon,
  ImageIcon,
  Loader2Icon,
  PencilIcon,
  PrinterIcon,
  XIcon,
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

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
  const [user, job] = await Promise.all([
    getById("user", session.user.id) as Promise<User>,
    getById("job", jobId),
  ]);

  if (!user || !job) {
    notFound();
  }

  const isMyJob = job.slack_id === session.user.id;
  const isPrinting = job.assigned_printer_id === session.user.id;
  const hasPrinter = user.printer_has ?? false;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {job.item_name || "Untitled Job"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary-static" className="text-xs">
              {job.part_count || 0} part{job.part_count !== 1 ? "s" : ""}
            </Badge>
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
          {isMyJob && (
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
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {job.item_description}
          </p>
        </div>
      )}

      {/* Images Carousel */}
      {job.user_images && job.user_images.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium tracking-tight">Images</h2>
          <div className="relative">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {job.user_images.map((image: any) => (
                  <CarouselItem
                    key={image.id}
                    className="basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <div className="relative aspect-square">
                      <img
                        src={image.url}
                        alt={image.filename}
                        className="absolute inset-0 object-cover w-full h-full rounded-lg border border-border"
                      />
                      {image.id === job.main_image_id && (
                        <Badge
                          variant="secondary"
                          className="absolute top-2 right-2"
                        >
                          Main Image
                        </Badge>
                      )}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex">
                <CarouselPrevious className="hidden md:flex" />
                <CarouselNext className="hidden md:flex" />
              </div>
            </Carousel>
          </div>
        </div>
      )}

      {/* STL Files */}
      {job.stls && job.stls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium tracking-tight">STL Files</h2>
          <div className="grid gap-2">
            {job.stls.map((stl: any) => (
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
                <ArrowUpRightIcon className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 pt-4">
        {hasPrinter && !isPrinting && !job.assigned_printer_id && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PrinterIcon className="size-4" />
                Claim Job
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Claim this print job?</AlertDialogTitle>
                <AlertDialogDescription>
                  By claiming this job, you're committing to print these parts.
                  Make sure you have the right materials and time available.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction formAction={`/api/jobs/${jobId}/claim`}>
                  Claim Job
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isPrinting && (
          <>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Loader2Icon className="size-4" />
                  Start Printing
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start printing this job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the job as "In Progress". Make sure you have
                    all the necessary materials ready.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    formAction={`/api/jobs/${jobId}/status/in_progress`}
                  >
                    Start Printing
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CheckIcon className="size-4" />
                  Mark Complete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark job as complete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the job as "Done". Make sure all parts have
                    been printed successfully.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    formAction={`/api/jobs/${jobId}/status/done`}
                  >
                    Mark Complete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <XIcon className="size-4" />
                  Unclaim Job
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unclaim this job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove you as the printer for this job. Another
                    printer will be able to claim it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    formAction={`/api/jobs/${jobId}/unclaim`}
                    variant="destructive-outline"
                  >
                    Unclaim Job
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
