export const STATUS_AESTHETIC = {
  needs_printer: {
    color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-200",
    text: "Needs Printer",
  },
  claimed: {
    color: "bg-blue-500/20 text-blue-600 dark:text-blue-200",
    text: "Claimed",
  },
  printing_in_progress: {
    color: "bg-purple-500/20 text-purple-600 dark:text-purple-200",
    text: "In Progress",
  },
  completed_printing: {
    color: "bg-green-500/20 text-green-600 dark:text-green-200",
    text: "Completed",
  },
  cancelled: {
    color: "bg-red-500/20 text-red-600 dark:text-red-200",
    text: "Cancelled",
  },
  fulfilled_awaiting_confirmation: {
    color: "bg-orange-500/20 text-orange-600 dark:text-orange-200",
    text: "Awaiting confirmation",
  },
  finished: {
    color: "bg-green-500/20 text-green-600 dark:text-green-200",
    text: "Finished",
  },
};

export const max_meetup_distance_km = 25;

export const getDistanceColor = (distance: number) => {
  if (distance > max_meetup_distance_km) {
    return "text-red-600 bg-red-400/20 dark:text-red-200 dark:bg-red-600/20";
  }
  if (distance > max_meetup_distance_km / 2) {
    return "text-orange-600 bg-orange-400/20 dark:text-orange-200 dark:bg-orange-600/20";
  }
  return "text-emerald-600 bg-emerald-400/20 dark:text-emerald-200 dark:bg-emerald-600/20";
};
