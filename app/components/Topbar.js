"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Bell, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import AutomationHealthDrawer from "./AutomationHealthDrawer";

const NOTIFICATIONS = [
  { text: "Samira H. went quiet after 120 min — follow-up queued", time: "22m ago" },
  { text: "Urban Threads is approaching its throttle limit", time: "1h ago" },
  { text: "Meherun N. placed a COD order — $42.00", time: "2m ago" },
];

export default function Topbar({ title, subtitle, search, onSearchChange, searchPlaceholder, actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-5 pl-16 md:pl-8 border-b border-line">
      <div>
        <h1 className="font-display font-semibold text-xl text-ink">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-mute mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {actions}

        <div className="flex items-center gap-2 bg-raised border border-line rounded-lg px-3 py-2 w-full sm:w-72 focus-within:border-wire/60 transition-colors">
          <Search size={15} className="text-mute shrink-0" />
          <input
            value={search ?? ""}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder || "Search leads, posts, orders…"}
            className="bg-transparent text-sm text-ink placeholder:text-mute outline-none w-full"
          />
          {search ? (
            <button
              onClick={() => onSearchChange?.("")}
              className="text-mute hover:text-ink"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <ThemeToggle />

        <AutomationHealthDrawer />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative h-9 w-9 rounded-lg bg-raised border border-line flex items-center justify-center text-mute hover:text-ink"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber animate-pulse-ring" />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-amber" />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute right-0 mt-2 w-80 bg-panel border border-line rounded-xl shadow-2xl overflow-hidden z-20 origin-top-right"
              >
                <div className="px-4 py-3 border-b border-line text-sm font-medium text-ink">
                  Notifications
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {NOTIFICATIONS.map((n, i) => (
                    <div
                      key={i}
                      className="px-4 py-3 border-b border-line/70 last:border-0 hover:bg-raised/60"
                    >
                      <p className="text-sm text-ink leading-snug">{n.text}</p>
                      <p className="text-xs text-mute mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
