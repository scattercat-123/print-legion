import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";

const noticeVariants = cva("flex justify-center flex-col", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      error: "text-red-400",
      warning: "text-yellow-400",
    },
  },
});

export const Notice = ({
  variant,
  title,
  children,
  icon: Icon,
}: VariantProps<typeof noticeVariants> & {
  title: string;
  children: React.ReactNode;
  icon: LucideIcon;
}) => {
  return (
    <div className={cn(noticeVariants({ variant }))}>
      <h3 className="text-lg font-semibold flex tracking-tight items-center gap-2">
        <Icon className="w-5 h-5" />
        {title}
      </h3>
      <span className="text-sm [&_a]:underline [&_a]:text-primary [&_a]:transition-colors">
        {children}
      </span>
    </div>
  );
};
