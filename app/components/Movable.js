"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, ArrowUp, ArrowDown } from "lucide-react";
import SectionHeading from "./SectionHeading";
import { useDashboardLayout } from "../lib/dashboard-layout-context";

// Wraps one Signal Feed section and gives it a "⋯" menu to move it one slot
// up or down the page. With a `label` the menu sits in a heading row above
// the content (for groups of stat cards); without one it floats in the
// top-right corner of the card it wraps.
export default function Movable({ id, label, children }) {
  const { order, move } = useDashboardLayout();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const index = order.indexOf(id);

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

  function handleMove(direction) {
    move(id, direction);
    setOpen(false);
  }

  const items = [
    { label: "Move up", Icon: ArrowUp, direction: -1, disabled: index <= 0 },
    { label: "Move down", Icon: ArrowDown, direction: 1, disabled: index >= order.length - 1 },
  ];

  const menu = (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 rounded-lg flex items-center justify-center text-mute hover:text-ink hover:bg-raised transition-colors"
        aria-label="Section options"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-1 w-36 bg-panel border border-line rounded-lg shadow-2xl overflow-hidden z-30 origin-top-right"
          >
            {items.map(({ label: text, Icon, direction, disabled }) => (
              <button
                key={text}
                disabled={disabled}
                onClick={() => handleMove(direction)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-ink hover:bg-raised/60 disabled:text-mute/40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              >
                <Icon size={13} />
                {text}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <motion.div
      layout="position"
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      className={`relative ${open ? "z-20" : ""}`}
    >
      {label ? (
        <div className="flex items-center justify-between mb-3">
          <SectionHeading>{label}</SectionHeading>
          {menu}
        </div>
      ) : (
        <div className="absolute top-3 right-3 z-10">{menu}</div>
      )}
      {children}
    </motion.div>
  );
}
