// Small local-time date helpers shared by the range picker and the api layer.
// Dates travel around the app as "YYYY-MM-DD" strings (what <input type="date">
// speaks) and only become Date objects where math is needed.
export const toISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const fromISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
};

// Whole calendar days from a to b (b - a). Rounded so daylight-saving shifts
// don't turn "1 day" into 0.96.
export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

export const fmtShort = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
