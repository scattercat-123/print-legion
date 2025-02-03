"use client";

import { useState } from "react";
import { OnboardingDialog } from "@/components/onboarding-dialog";
import { User } from "@/lib/types";

export function OnboardingProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const [showOnboarding, setShowOnboarding] = useState(!user?.onboarded);

  if (user?.onboarded) {
    return <>{children}</>;
  }

  return (
    <>
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
      {children}
    </>
  );
}
