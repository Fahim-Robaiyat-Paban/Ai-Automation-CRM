"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange } from "lucide-react";
import { RANGES, useRange } from "../lib/range-context";
import { addDays, fmtShort, fromISO, toISO } from "../lib/dates";

const PRESETS = [
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This year", days: null },
];

function presetRange(days) {
  const today = new Date();
  return {
    from: toISO(days ? addDays(today, -(days - 1)) : new Date(today.getFullYear(), 0, 1)),
    to: toISO(today),
  };
}

export default function RangeSwitch() {
  const { range, setRange, customRange, setCustomRange } = useRange();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(customRange);
  const ref = useRef(null);
  const today = toISO(new Date());
  const valid = draft.from && draft.to && draft.from <= draft.to && draft.to <= today;

  useEffect(() => {
    if (!open) return;
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(next) {
    setCustomRange(next);
    setRange("custom");
    setOpen(false);
  }

  const pill = (active) =>
    `relative px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
      active ? "text-void" : "text-mute hover:text-ink"
    }`;

  const activePill = (
    <motion.span
      layoutId="range-pill"
      className="absolute inset-0 rounded-full bg-gradient-to-br from-signal to-wire"
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
    />
  );

  return (
    <div className="relative" ref={ref}>
      <div
        role="tablist"
        aria-label="Analytics time range"
        className="inline-flex items-center gap-0.5 bg-raised border border-line rounded-full p-1"
      >
        {RANGES.map((r) => {
          const active = range === r.key;
          return (
            <button key={r.key} role="tab" aria-selected={active} onClick={() => setRange(r.key)} className={pill(active)}>
              {active && activePill}
              <span className="relative z-10">{r.label}</span>
            </button>
          );
        })}
        <button
          role="tab"
          aria-selected={range === "custom"}
          aria-expanded={open}
          onClick={() => {
            setDraft(customRange);
            setOpen((v) => !v);
          }}
          className={pill(range === "custom")}
        >
          {range === "custom" && activePill}
          <span className="relative z-10 flex items-center gap-1.5">
            <CalendarRange size={12} />
            {range === "custom" ? `${fmtShort(fromISO(customRange.from))} – ${fmtShort(fromISO(customRange.to))}` : "Custom"}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 w-72 bg-panel border border-line rounded-xl shadow-2xl p-4 z-40 origin-top-right"
          >
            <p className="text-xs text-mute mb-2">Quick picks</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => apply(presetRange(p.days))}
                  className="text-xs px-2.5 py-1 rounded-full border border-line text-mute hover:text-ink hover:border-wire/50 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "from", label: "From" },
                { key: "to", label: "To" },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-[11px] text-mute">{label}</span>
                  <input
                    type="date"
                    value={draft[key]}
                    max={today}
                    onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
                    className="mt-1 w-full bg-raised border border-line rounded-lg px-2 py-1.5 text-xs text-ink outline-none focus:border-wire/60"
                  />
                </label>
              ))}
            </div>

            {!valid && <p className="text-[11px] text-rose mt-2">Pick a start date on or before the end date, and nothing in the future.</p>}

            <button
              disabled={!valid}
              onClick={() => apply(draft)}
              className="mt-4 w-full text-xs font-medium py-2 rounded-lg bg-gradient-to-br from-signal to-wire text-void disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply range
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
