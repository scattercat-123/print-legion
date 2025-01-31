"use client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRef } from "react";

export function ImpersonateBtn() {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col mt-3">
      <span className="text-xs text-muted-foreground mb-1">
        <Badge variant="destructive" className="text-xs">
          ⚠️ devmode
        </Badge>{" "}
        Impersonate a user
      </span>
      <div className="flex gap-0.5">
        <Input placeholder="Slack ID" id="impersonate-id" ref={inputRef} />
        <Button
          variant="outline"
          size="icon"
          className="w-10 shrink-0 items-center justify-center flex"
          onClick={async () => {
            const id = inputRef.current?.value?.trim();
            if (!id) return toast.error("Please enter a Slack ID");
            await signIn("credentials", {
              impersonateId: id,
            });
          }}
        >
          <ArrowRightIcon className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </div>
  );
}
