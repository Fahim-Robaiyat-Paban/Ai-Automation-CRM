"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Radio,
  Users,
  MessageSquareText,
  ShoppingCart,
  Activity,
  Menu,
  X,
} from "lucide-react";
import PageSwitcher from "./PageSwitcher";

const primaryLinks = [
  { href: "/", label: "Signal Feed", icon: Radio },
  { href: "/comments", label: "Comment activity", icon: Activity },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/posts", label: "Posts & Comments", icon: MessageSquareText },
  // Was a disabled "coming next" stub — now a real page (see
  // app/orders/page.js) tracking COD delivery outcome, so it moved up here.
  { href: "/orders", label: "Orders", icon: ShoppingCart },
];

function SidebarContent({ pathname, onNavigate, scope }) {
  return (
    <>
      <div className="px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="relative inline-flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-signal" />
          </span>
          <span className="font-display font-semibold text-lg tracking-tight text-grad-signal">
            Signalboard
          </span>
        </div>
        <p className="text-xs text-mute mt-1 pl-4">Meta page observability</p>
      </div>

      <PageSwitcher />

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "text-ink"
                  : "text-mute hover:text-ink hover:bg-raised/60"
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`sidebar-active-${scope}`}
                  className="absolute inset-0 rounded-lg bg-raised border border-line"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon size={17} strokeWidth={1.75} className="relative z-10" />
              <span className="relative z-10">{label}</span>
              {active && (
                <span className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-br from-signal to-wire" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-line">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-wire/30 to-signal/30 border border-wire/40 flex items-center justify-center text-xs text-wire font-medium">
            RB
          </div>
          <div className="leading-tight">
            <p className="text-sm text-ink">Robert Brown</p>
            <p className="text-xs text-mute">Admin</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 h-9 w-9 rounded-lg bg-raised border border-line flex items-center justify-center text-ink"
        aria-label="Open menu"
      >
        <Menu size={17} />
      </button>

      {/* desktop sidebar — always mounted, no motion needed */}
      <aside className="hidden md:flex w-60 shrink-0 bg-panel border-r border-line flex-col h-screen sticky top-0 z-50">
        <SidebarContent pathname={pathname} scope="desktop" />
      </aside>

      {/* mobile off-canvas sidebar */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-void/70 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="mobile-panel"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
              className="md:hidden w-60 shrink-0 bg-panel border-r border-line flex flex-col h-screen fixed top-0 left-0 z-50"
            >
              <div className="flex justify-end px-4 pt-4">
                <button
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 rounded-lg bg-raised border border-line flex items-center justify-center text-mute"
                  aria-label="Close menu"
                >
                  <X size={15} />
                </button>
              </div>
              <SidebarContent pathname={pathname} onNavigate={() => setOpen(false)} scope="mobile" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
