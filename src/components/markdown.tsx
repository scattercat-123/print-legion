import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export default function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <ReactMarkdown
      className={cn(
        className,
        "prose prose-sm text-muted-foreground prose-zinc dark:prose-invert !max-w-full prose-h1:text-base prose-h1:font-bold prose-h2:text-base prose-h3:text-base prose-h4:text-sm prose-h5:text-sm prose-h6:text-sm prose-a:text-primary prose-a:transition-colors prose-a:underline prose-a:font-medium prose-headings:text-foreground/70 !space-y-1 prose-h1:mb-0"
      )}
      components={{
        img: () => null, // Disable image rendering
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
