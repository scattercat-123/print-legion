"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { updateUser, updateUserSettings } from "@/app/actions";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingDialog({
  open,
  onOpenChange,
}: OnboardingDialogProps) {
  const [step, setStep] = useState(1);

  const stepContent = [
    {
      title: "Welcome to Hack Club Launchpad!",
      description:
        "This platform connects Hack Clubbers who need 3D printed parts with those who can print them.",
    },
    {
      title: "How would you like to participate?",
      description:
        "Are you looking to have parts printed, or would you like to help print parts for others?",
      action: "user_type",
    },
    {
      title: "You're all set!",
      description:
        "You can now start using Launchpad. Click 'Get Started' to begin your journey!",
    },
  ];

  const totalSteps = stepContent.length;

  const handleContinue = async (userType?: "printer" | "requestor") => {
    if (step === 2 && userType) {
      // Update user type in Airtable
      const formData = new FormData();
      formData.append("onboarded", "on");
      formData.append("has_printer", userType === "printer" ? "on" : "off");
      await updateUserSettings(formData);
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!rounded-3xl gap-0 p-1 m-2">
        <div className="space-y-6 px-6 pb-6 pt-6">
          <DialogHeader>
            <DialogTitle>{stepContent[step - 1].title}</DialogTitle>
            <DialogDescription>
              {stepContent[step - 1].description}
            </DialogDescription>
          </DialogHeader>

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleContinue("requestor")}
              >
                I need parts printed
                <ArrowRight size={16} />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => handleContinue("printer")}
              >
                I want to print parts for others
                <ArrowRight size={16} />
              </Button>
            </div>
          )}

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex justify-center space-x-1.5">
              {[...Array(totalSteps)].map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-primary",
                    index + 1 === step ? "bg-primary" : "opacity-20"
                  )}
                />
              ))}
            </div>

            {step !== 2 && (
              <DialogFooter>
                <Button onClick={() => handleContinue()}>
                  {step === totalSteps ? "Get Started" : "Continue"}
                </Button>
              </DialogFooter>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
