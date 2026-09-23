export const formats = {
  dateTime: {
    short: {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  },
  number: {
    percent: {
      style: "percent",
      maximumFractionDigits: 0,
    },
  },
} as const;
