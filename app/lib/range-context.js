"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { addDays, toISO } from "./dates";

export const RANGES = [
  { key: "hourly", label: "Hourly" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const RangeContext = createContext(null);

const lastDays = (n) => {
  const today = new Date();
  return { from: toISO(addDays(today, -(n - 1))), to: toISO(today) };
};

export function RangeProvider({ children }) {
  const [range, setRange] = useState("daily");
  const [customRange, setCustomRange] = useState(() => lastDays(30));

  // What every api call receives: a preset name ("daily") or, for a custom
  // range, a {from, to} object. Memoized so effects depending on it only
  // re-run when the range actually changes.
  const period = useMemo(
    () => (range === "custom" ? { from: customRange.from, to: customRange.to } : range),
    [range, customRange.from, customRange.to]
  );

  return (
    <RangeContext.Provider value={{ range, setRange, customRange, setCustomRange, period }}>
      {children}
    </RangeContext.Provider>
  );
}

export function useRange() {
  const ctx = useContext(RangeContext);
  if (!ctx) throw new Error("useRange must be used inside RangeProvider");
  return ctx;
}
