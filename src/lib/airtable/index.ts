import Airtable from "airtable";
import { cache } from "react";

const init = () => {
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error("Missing AIRTABLE_API_KEY");
  }

  if (!process.env.AIRTABLE_BASE_ID) {
    throw new Error("Missing AIRTABLE_BASE_ID");
  }

  const airtable = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY,
  });

  const base = airtable.base(process.env.AIRTABLE_BASE_ID);
  return { base, airtable };
};

const cached_init = cache(init);
const { base, airtable } = cached_init();

// Table references
export const jobsTable = base("Form");
export const usersTable = base("Users");
export const yswsIndexTable = base("YSWS Index");

export { airtable };
export * from "./jobs";
export * from "./users";
export * from "./shared";
export * from "./ysws_index";
