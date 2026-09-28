"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

// Enter-only page transition. The previous PageTransition component wrapped
// {children} in AnimatePresence mode="wait" at the layout level — that's a
// known bad combo with the Next.js App Router: it holds the new route
// unmounted until the old route's exit animation finishes, and the router's
// own mount and that delayed mount occasionally fall out of sync, leaving
// nothing rendered until a hard reload. That's the "blank page on nav" bug.
// A plain enter animation with no AnimatePresence/exit can't cause that —
// there's nothing gating the new route's mount, so it renders immediately
// and just fades/slides in on top.
export default function RouteFade({ children }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
