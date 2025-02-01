import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth";
import { FaSlack } from "react-icons/fa";
import Image from "next/image";
import cherryMX from "@media/switch.png";
import { Input } from "@/components/ui/input";
import { ArrowRightIcon, UserCheck2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ImpersonateBtn } from "./impersonate-btn";

export default async function LoginPage() {
  return (
    <div className="min-h-screen flex relative overflow-hidden bg-background">
      {/* Left Section */}
      <div className="w-full lg:w-1/2 flex max-lg:top-[16%] max-lg:absolute lg:items-center lg:justify-center p-8 text-foreground">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter">
              <span className="text-foreground">&gt; </span>
              ./print_legion
            </h1>
            <p className="text-muted-foreground">
              <span className="text-foreground">$</span> Please authenticate to
              continue...
            </p>
          </div>

          <div className="pt-8 flex flex-col gap-2">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-border hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={async () => {
                "use server";
                await signIn("slack");
              }}
            >
              <FaSlack className="mr-2 h-5 w-5" />
              Sign in with Slack
            </Button>

            {process.env.NODE_ENV === "meow" && <ImpersonateBtn />}
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="text-foreground">system:</span> Waiting for
            authentication...
          </div>
        </div>
      </div>

      {/* Right Section - Image placeholder */}
      <div className="max-lg:absolute overflow-hidden lg:w-1/2 -bottom-20 -right-16">
        {/* Image will be added here later */}
        <div className="h-full w-fit max-w-sm md:max-w-md lg:max-w-2xl flex items-center justify-center text-muted-foreground">
          <Image
            src={cherryMX}
            alt="Switch"
            placeholder="blur"
            className="pl-3 pr-8 z-0 select-none pointer-events-none"
          />
        </div>
      </div>
    </div>
  );
}
