"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PAGE_LIST } from "./api";

// Which connected page the admin is currently looking at — "all" means the
// account-wide aggregate. Every data call in the app threads this through
// as a pageId, so a one-page account and a many-page account run through
// the exact same code path; "all" is just the identity case.
const STORAGE_KEY = "signalboard-page-scope";
const PageScopeContext = createContext(null);

export function PageScopeProvider({ children }) {
  const [pageId, setPageId] = useState("all");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && (stored === "all" || PAGE_LIST.some((p) => p.id === stored))) {
      setPageId(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, pageId);
  }, [pageId]);

  return (
    <PageScopeContext.Provider value={{ pageId, setPageId, pages: PAGE_LIST }}>
      {children}
    </PageScopeContext.Provider>
  );
}

export function usePageScope() {
  const ctx = useContext(PageScopeContext);
  if (!ctx) throw new Error("usePageScope must be used inside PageScopeProvider");
  return ctx;
}
