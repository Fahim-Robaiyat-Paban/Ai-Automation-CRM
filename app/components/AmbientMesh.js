"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Each route owns a different pair of blob positions + colors, so the ambient
// wash isn't the same fixed corner-gradient repeated on every screen — it
// crossfades to a new spot and hue as you navigate. This is purely decorative
// and rendered as a sibling of {children} in the layout, never wrapping it —
// unlike the old PageTransition bug, an AnimatePresence here can never delay
// or block a route from mounting, since the real page content doesn't live
// inside it.
const MESH_BY_ROUTE = {
  "/": {
    a: { top: "-16%", left: "-6%", cls: "bg-signal" },
    b: { top: "64%", left: "90%", cls: "bg-wire" },
  },
  "/leads": {
    a: { top: "-12%", left: "84%", cls: "bg-mint" },
    b: { top: "72%", left: "-8%", cls: "bg-signal" },
  },
  "/posts": {
    a: { top: "-14%", left: "40%", cls: "bg-wire" },
    b: { top: "70%", left: "96%", cls: "bg-amber" },
  },
  "/comments": {
    a: { top: "-12%", left: "20%", cls: "bg-wire" },
    b: { top: "68%", left: "92%", cls: "bg-signal" },
  },
  "/orders": {
    a: { top: "-10%", left: "60%", cls: "bg-amber" },
    b: { top: "78%", left: "8%", cls: "bg-mint" },
  },
};

export default function AmbientMesh() {
  const pathname = usePathname();
  const mesh = MESH_BY_ROUTE[pathname] || MESH_BY_ROUTE["/"];

  return (
    <div className="mesh-bg" aria-hidden="true">
      <AnimatePresence>
        <motion.span
          key={`${pathname}-a`}
          className={`mesh-blob ${mesh.a.cls}`}
          style={{ top: mesh.a.top, left: mesh.a.left }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          key={`${pathname}-b`}
          className={`mesh-blob ${mesh.b.cls}`}
          style={{ top: mesh.b.top, left: mesh.b.left }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        />
      </AnimatePresence>
    </div>
  );
}
