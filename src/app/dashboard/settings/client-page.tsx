"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUserSettings } from "@/app/actions";
import { Checkbox } from "@/components/ui/checkbox";
import type { User } from "@/lib/types";

export default function SettingsPage({ settingsData }: { settingsData: User }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      await updateUserSettings(formData);
      router.refresh();
    } catch (error) {
      console.error("Failed to update settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-semibold">Printer Settings</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="available_ysws"
              className="block text-sm font-medium mb-2"
            >
              Available YSWS
            </label>
            <Input
              id="available_ysws"
              name="available_ysws"
              placeholder="Enter available YSWS"
              required
              defaultValue={settingsData.available_ysws}
            />
            <p className="mt-1 text-sm text-zinc-400">
              List the YSWS you are available to print
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_printer"
              name="has_printer"
              defaultChecked={settingsData.printer_has}
            />
            <label htmlFor="has_printer" className="block text-sm font-medium">
              I have a printer!
            </label>
          </div>

          <div>
            <label
              htmlFor="what_type"
              className="block text-sm font-medium mb-2"
            >
              Printer Type
            </label>
            <Input
              id="what_type"
              name="what_type"
              placeholder="Enter printer type"
              required
              defaultValue={settingsData["What Type?"]}
            />
            <p className="mt-1 text-sm text-zinc-400">
              Describe your printer setup
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
