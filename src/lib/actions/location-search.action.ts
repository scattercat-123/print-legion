"use server";
import "server-only";
import { geocodeSearch } from "../geo";

const cleanDisplayName = (displayName: string) => {
  const split = displayName.split(",");
  if (split.length < 4) return displayName;

  // pick the first 3 and the last 2
  const firstThree = split.slice(0, 2).join(",");
  const lastTwo = split.slice(-2).join(",");
  return `${firstThree}, ${lastTwo}`
    .split(",")
    .map((s) => s.trim())
    .join(", ");
};

export async function searchLocations(query: string) {
  const results = await geocodeSearch(query);
  const seen: Set<string> = new Set();
  const seen_coords: Set<string> = new Set();
  return results.reduce(
    (acc, result) => {
      const clean_name = cleanDisplayName(result.display_name);
      if (seen.has(clean_name)) {
        return acc;
      }
      if (seen_coords.has(`${result.lat},${result.lon}`)) {
        return acc;
      }
      seen.add(clean_name);
      seen_coords.add(`${result.lat},${result.lon}`);
      acc.push({
        value: `${result.lat},${result.lon}`,
        label: clean_name,
      });
      return acc;
    },
    [] as { value: string; label: string }[],
  );
}
