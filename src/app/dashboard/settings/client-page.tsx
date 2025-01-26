"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateUserSettings } from "@/app/actions";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MultipleSelector,
  type MultipleSelectorRef,
  type Option,
} from "@/components/ui/multiple-selector";
import type { User, YSWSIndex } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import useSWRImmutable from "swr/immutable";
import { getAll_YSWS } from "@/lib/airtable/ysws_index";
import createFuzzySearch from "@nozbe/microfuzz";
import { toast } from "sonner";
export default function SettingsPage({ settingsData }: { settingsData: User }) {
  const {
    data: yswsData,
    error,
    isLoading,
  } = useSWRImmutable("/api/ysws/all", async () => (await getAll_YSWS()) ?? []);

  const filteredYSWS = useMemo(() => {
    const data = (yswsData?.map((ysws) => ({
      ...ysws,
      value: ysws.id,
      label: ysws.name ?? "",
      img_url: ysws.logo?.[0]?.url ?? "",
    })) ?? []) as unknown as Option[];
    return data;
  }, [yswsData]);

  const fuzzySearch = useCallback(
    (query: string) => {
      const fuzzySearch = createFuzzySearch(filteredYSWS, {
        getText: (item: YSWSIndex) =>
          [item.name, item.description, item.homepage_url].filter(
            Boolean
          ) as string[],
      });

      return fuzzySearch(query).map((result) => result.item);
    },
    [filteredYSWS]
  );

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrinter, setHasPrinter] = useState(
    settingsData.printer_has ?? false
  );
  const yswsSelectorRef = useRef<MultipleSelectorRef>(null);

  // Convert preferred_ysws array to MultipleSelector options format
  const selectedYSWS = useMemo(() => {
    return (
      (settingsData.preferred_ysws ?? [])
        .map((ysws_id) => yswsData?.find((ysws) => ysws.id === ysws_id))
        .filter(Boolean) as (YSWSIndex & { id: string })[]
    ).map((ysws) => ({
      value: ysws.id,
      label: ysws.name ?? "",
      img_url: ysws.logo?.[0]?.url ?? "",
    }));
  }, [settingsData.preferred_ysws, yswsData]);

  const [selectedLength, setSelectedLength] = useState(-1);
  useEffect(() => {
    if (!isLoading) {
      setSelectedLength(selectedYSWS.length);
    }
  }, [selectedYSWS, isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      // Get selected YSWS from the ref
      const selectedOptions = yswsSelectorRef.current?.selectedValue ?? [];
      formData.set(
        "preferred_ysws",
        JSON.stringify(selectedOptions.map((opt) => opt.value))
      );
      await updateUserSettings(formData);
      toast.success("Settings saved", {
        description: "Your printer settings have been updated successfully.",
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Error", {
        description: "Failed to save settings. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">User Settings</h1>
      <p className="text-sm text-zinc-400 mt-1.5">
        Edit your settings for print legion here.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6 mt-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="has_printer"
              name="has_printer"
              defaultChecked={hasPrinter}
              onCheckedChange={(checked) => setHasPrinter(checked as boolean)}
            />
            <label htmlFor="has_printer" className="block text-sm font-medium">
              I have a printer!
            </label>
          </div>

          {hasPrinter && (
            <>
              <div>
                <label
                  htmlFor="preferred_ysws"
                  className="block text-sm font-medium mb-2"
                >
                  Preferred YSWS
                </label>
                {isLoading ? (
                  <div className="w-full h-10 border border-border bg-zinc-100/10 animate-pulse rounded-md flex items-center pl-3">
                    <span className="text-sm text-zinc-400">Loading...</span>
                  </div>
                ) : (
                  <MultipleSelector
                    ref={yswsSelectorRef}
                    onChange={(selected) => {
                      setSelectedLength(selected.length);
                    }}
                    placeholder="Nothing here yet..."
                    value={selectedYSWS}
                    hidePlaceholderWhenSelected={true}
                    onSearchSync={fuzzySearch}
                    options={filteredYSWS}
                    className="w-full"
                  />
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  Pick the you-ship-we-ships you'd like to see more of. You
                  still see prints from all of them, but these will be
                  prioritized in search.{" "}
                  {selectedLength === filteredYSWS.length && (
                    <span className="text-red-500">
                      (Well done! Selecting them all is like... selecting none.)
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label
                  htmlFor="printer_type"
                  className="block text-sm font-medium mb-2"
                >
                  Printer Type
                </label>
                <Input
                  id="printer_type"
                  name="printer_type"
                  placeholder="Enter printer type"
                  required={hasPrinter}
                  defaultValue={settingsData.printer_type}
                />
                <p className="mt-1 text-xs text-zinc-400">
                  Describe your printer model (e.g. "Bambu A1 Mini", "Prusa i3
                  MK3S+")
                </p>
              </div>

              <div>
                <label
                  htmlFor="printer_details"
                  className="block text-sm font-medium mb-2"
                >
                  Printer Details
                </label>
                <Textarea
                  id="printer_details"
                  name="printer_details"
                  placeholder="Enter any additional details about your printer setup (e.g., modifications, special capabilities, etc.)"
                  required={false}
                  defaultValue={settingsData.printer_details}
                  className="min-h-[100px]"
                />
              </div>
            </>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
