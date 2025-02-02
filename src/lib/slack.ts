"use server";

import { cache } from "react";

export type SlackUserInfo = {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    title: string;
    phone: string;
    skype: string;
    real_name: string;
    real_name_normalized: string;
    display_name: string;
    display_name_normalized: string;
    fields: unknown; // Adjust this type if you have a specific structure for fields
    status_text: string;
    status_emoji: string;
    status_emoji_display_info: {
      emoji_name: string;
      display_url: string;
    }[];
    status_expiration: number;
    avatar_hash: string;
    image_original: string;
    is_custom_image: boolean;
    pronouns: string;
    huddle_state: string;
    huddle_state_expiration_ts: number;
    first_name: string;
    last_name: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
    image_1024: string;
    status_text_canonical: string;
    team: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  is_email_confirmed: boolean;
  who_can_share_contact_card: string;
};

export const getSlackUserInfo = cache(async (id: string) => {
  try {
    const data = await fetch(`https://slack.com/api/users.info?user=${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
    });
    const json = await data.json();
    if (!json.ok) return null;
    return json.user as SlackUserInfo;
  } catch (error) {
    console.error(error);
    return null;
  }
});
