"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { DistanceSchema, User, YSWSIndex } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import YSWS_Selector, {
  useYSWSSelector,
  YSWS_SelectorProvider,
} from "@/hooks/use-ysws-search";
import { AutoComplete } from "@/components/ui/autocomplete";
import { useMemo } from "react";
import { searchLocations } from "@/lib/actions/location-search.action";
import { updateUserSettings } from "@/lib/actions/update-user-settings.action";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfinityIcon } from "lucide-react";
import { z } from "zod";

export default function SettingsPage({ settingsData }: { settingsData: User }) {
  return (
    <YSWS_SelectorProvider
      getInitialValue={(yswsData) => {
        return (
          (settingsData.preferred_ysws ?? [])
            .map((ysws_id) => yswsData?.find((ysws) => ysws.id === ysws_id))
            .filter(Boolean) as (YSWSIndex & { id: string })[]
        ).map((ysws) => ({
          value: ysws.id,
          label: ysws.name ?? "",
          img_url: ysws.logo?.[0]?.url ?? "",
        }));
      }}
    >
      <PureSettingsPage settingsData={settingsData} />
    </YSWS_SelectorProvider>
  );
}

function PureSettingsPage({ settingsData }: { settingsData: User }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPrinter, setHasPrinter] = useState(
    settingsData.printer_has ?? false
  );
  const [locationOptions, setLocationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    { value: string; label: string } | undefined
  >(
    settingsData.region_coordinates
      ? {
          value: settingsData.region_coordinates,
          label: settingsData.region_complete_name || "",
        }
      : undefined
  );

  const [preferredDistance, setPreferredDistance] = useState(
    settingsData.preferred_distance
  );
  const {
    selectedLength,
    ref: yswsSelectorRef,
    serverYSWSOptions,
  } = useYSWSSelector();

  const debouncedSearchLocation = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return async (query: string) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!query.trim()) {
        setLocationOptions([]);
        return;
      }

      timeoutId = setTimeout(async () => {
        setIsLoadingLocation(true);
        try {
          const results = await searchLocations(query);
          setLocationOptions(results);
        } catch (error) {
          console.error("Failed to search locations:", error);
          toast.error("Error searching locations");
        } finally {
          setIsLoadingLocation(false);
        }
      }, 300);
    };
  }, []);

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
      if (selectedLocation) {
        formData.set("region_coordinates", selectedLocation.value);
        formData.set("region_complete_name", selectedLocation.label);
      }
      if (preferredDistance) {
        formData.set("preferred_distance", preferredDistance);
      }

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
          <div>
            <label
              htmlFor="region_complete_name"
              className="block text-sm font-medium mb-2"
            >
              Your Location
            </label>
            <AutoComplete
              options={locationOptions}
              emptyMessage="No locations found"
              value={selectedLocation}
              onValueChange={(value) => {
                setSelectedLocation(value);
              }}
              isLoading={isLoadingLocation}
              disabled={isSubmitting}
              placeholder="Search for your location..."
              onInputChange={debouncedSearchLocation}
            />
            <p className="mt-1 text-xs text-zinc-400">
              Enter your location to help us match you with nearby prints.
              Please <b>do not add your exact address</b>, but rather a general
              area.
            </p>
          </div>

          <div>
            <label
              htmlFor="region_complete_name"
              className="block text-sm font-medium mb-2"
            >
              {hasPrinter ? "Travel Distance" : "Viewing Distance"}
            </label>
            <Select
              value={preferredDistance}
              onValueChange={(value) => {
                setPreferredDistance(value as z.infer<typeof DistanceSchema>);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a distance" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="5km_city">
                    <span className="flex items-center gap-2">
                      5 km <span className="text-xs text-zinc-400">City</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="10km_neighbourhood">
                    10 km{" "}
                    <span className="text-xs text-zinc-400">Neighbourhood</span>
                  </SelectItem>
                  <SelectItem value="25km_nearby_town">
                    25 km{" "}
                    <span className="text-xs text-zinc-400">Nearby Town</span>
                  </SelectItem>
                  <SelectItem value="50km_day_trip">
                    50 km{" "}
                    <span className="text-xs text-zinc-400">Day Trip</span>
                  </SelectItem>
                  <SelectItem value="400km_cross_state">
                    400 km{" "}
                    <span className="text-xs text-zinc-400">Cross State</span>
                  </SelectItem>
                  <SelectItem value="infinitekm_global">
                    <span className="flex items-center gap-2">
                      <InfinityIcon className="w-4 h-4" />
                      km
                      <span className="text-xs text-zinc-400">Global</span>
                    </span>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-zinc-400">
              {hasPrinter ? (
                <>
                  Pick how far you&apos;d be willing to travel to fulfil a
                  print.{" "}
                  {![
                    "5km_city",
                    "10km_neighbourhood",
                    "25km_nearby_town",
                  ].includes(preferredDistance ?? "") && (
                    <span className="text-xs text-zinc-400 font-medium">
                      Note: you will only be able to claim items within 25km of
                      your location - your selected distance is for viewing
                      purposes only.
                    </span>
                  )}
                </>
              ) : (
                <>Pick how far you&apos;d like to see prints from in search.</>
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="preferred_ysws"
              className="block text-sm font-medium mb-2"
            >
              Preferred YSWS
            </label>
            <YSWS_Selector />
            <p className="mt-1 text-xs text-zinc-400">
              Pick the you-ship-we-ships you&apos;d like to see more of. You
              still see prints from all of them, but these will be prioritized
              in search.{" "}
              {selectedLength === serverYSWSOptions.length && (
                <span className="text-red-500">
                  (Well done! Selecting them all is like... selecting none.)
                </span>
              )}
            </p>
          </div>

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
                  Describe your printer model (e.g. &quot;Bambu A1 Mini&quot;,
                  &quot;Prusa i3 MK3S+&quot;)
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
