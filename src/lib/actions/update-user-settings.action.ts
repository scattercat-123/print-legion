"use server";
import "server-only";
import { revalidatePath } from "next/cache";
import { getById, createRecord, updateBySlackId } from "../airtable";
import { auth } from "../auth";
import type { User } from "../types";

export async function updateUserSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Extract form data
  const preferred_ysws_form = formData.get("preferred_ysws")?.toString();
  const printer_type = formData.get("printer_type")?.toString();
  const printer_details = formData.get("printer_details")?.toString();
  const has_printer = formData.get("has_printer")?.toString();
  const region_coordinates = formData.get("region_coordinates")?.toString();
  const region_complete_name = formData.get("region_complete_name")?.toString();
  const user = await getById("user", session.user.id);
  const onboarded = formData.get("onboarded") ? formData.get("onboarded") === "on" : undefined;

  const obj: User = {
    slack_id: session.user.id,
    preferred_ysws: preferred_ysws_form ? JSON.parse(preferred_ysws_form) : undefined,
    printer_has: has_printer === "on",
    printer_type,
    printer_details,
    onboarded,
    region_coordinates,
    region_complete_name,
  };

  if (!user) {
    const success = await createRecord("user", obj);
    if (!success) {
      throw new Error("Failed to create user");
    }
    return { success: true };
  }

  // Update the printer record
  const success = await updateBySlackId("user", session.user.id, obj);

  if (success) {
    revalidatePath("/dashboard/settings");
    return { success: true };
  }

  throw new Error("Failed to update settings");
}
