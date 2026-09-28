"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

// Order of the Signal Feed sections, top to bottom. Every section has a
// "move up / move down" menu; this is the one place that order lives, and it
// persists in localStorage like the theme and page scope do.
export const DEFAULT_ORDER = ["sales", "activity", "ghosted", "revenue", "pages"];
const STORAGE_KEY = "signalboard-dashboard-order";

const DashboardLayoutContext = createContext(null);

// A saved order is only trusted if it's exactly the current set of sections —
// a stale or hand-edited value falls back to the default instead of hiding one.
function isValidOrder(value) {
  return (
    Array.isArray(value) &&
    value.length === DEFAULT_ORDER.length &&
    DEFAULT_ORDER.every((id) => value.includes(id))
  );
}

export function DashboardLayoutProvider({ children }) {
  const [order, setOrder] = useState(DEFAULT_ORDER);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (isValidOrder(stored)) setOrder(stored);
    } catch {
      // unreadable value — keep the default
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, [order]);

  function move(id, direction) {
    setOrder((current) => {
      const from = current.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= current.length) return current;
      const next = [...current];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  }

  return (
    <DashboardLayoutContext.Provider value={{ order, move, reset: () => setOrder(DEFAULT_ORDER) }}>
      {children}
    </DashboardLayoutContext.Provider>
  );
}

export function useDashboardLayout() {
  const ctx = useContext(DashboardLayoutContext);
  if (!ctx) throw new Error("useDashboardLayout must be used inside DashboardLayoutProvider");
  return ctx;
}
