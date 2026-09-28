"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronsUpDown, Check, LayoutGrid } from "lucide-react";
import { usePageScope } from "../lib/page-scope-context";

export default function PageSwitcher() {
  const { pageId, setPageId, pages } = usePageScope();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = pages.find((p) => p.id === pageId);
  const label = current ? current.name : "All pages";

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

  // A one-page account never needs this control at all — no point offering
  // a switcher with nothing to switch between.
  if (pages.length < 2) return null;

  return (
    <div className="px-3 pb-3 relative" ref={ref}>
      <p className="px-2 text-[11px] text-mute/70 mb-1.5">Viewing</p>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-raised border border-line text-sm text-ink hover:border-line/80 transition-colors"
      >
        <LayoutGrid size={14} className="text-wire shrink-0" />
        <span className="truncate flex-1 text-left">{label}</span>
        <ChevronsUpDown size={13} className="text-mute shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-3 right-3 mt-1 bg-panel border border-line rounded-lg shadow-2xl overflow-hidden z-20 origin-top"
          >
            <button
              onClick={() => {
                setPageId("all");
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-raised/60"
            >
              <span className={pageId === "all" ? "text-ink" : "text-mute"}>All pages</span>
              {pageId === "all" && <Check size={13} className="text-signal shrink-0" />}
            </button>
            <div className="border-t border-line/70" />
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPageId(p.id);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-raised/60"
              >
                <span className={pageId === p.id ? "text-ink" : "text-mute"}>{p.name}</span>
                {pageId === p.id && <Check size={13} className="text-signal shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
