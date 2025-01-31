import { Badge } from "@/components/ui/badge";
import { FileIcon, DownloadIcon } from "lucide-react";
import { AirtableAttachmentSchema } from "@/lib/types";
import type { z } from "zod";

type AirtableAttachment = z.infer<typeof AirtableAttachmentSchema>;

interface FileCardProps {
  file: AirtableAttachment;
  isMain?: boolean;
}

export function FileCard({ file, isMain }: FileCardProps) {
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-card hover:bg-muted/50 rounded-lg border border-border transition-colors group"
    >
      <div className="p-2 bg-muted rounded-md">
        <FileIcon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {file.filename}
          {isMain && (
            <Badge variant="secondary" className="ml-2">
              Main File
            </Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(file.size / 1024)}KB
        </p>
      </div>
      <DownloadIcon className="size-4 text-muted-foreground group-hover:text-primary transition-opacity" />
    </a>
  );
}
