"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpDown } from "lucide-react";
import Topbar from "../components/Topbar";
import LeadDrawer from "../components/LeadDrawer";
import { getLeads } from "../lib/api";
import { stageStyle } from "../lib/style";
import { usePageScope } from "../lib/page-scope-context";

const STAGES = ["All", "Commented", "Engaged", "Paid", "Ghosted"];

const columns = [
  { key: "name", label: "Lead" },
  { key: "page", label: "Page" },
  { key: "stage", label: "Stage" },
  { key: "source", label: "Source" },
  { key: "email", label: "Email" },
  { key: "last", label: "Last activity" },
];

export default function LeadsPage() {
  const { pageId } = usePageScope();
  const [leads, setLeads] = useState(null);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("All");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLeads(null);
    getLeads(pageId).then(setLeads);
  }, [pageId]);

  const visible = useMemo(() => {
    if (!leads) return [];
    let rows = leads.filter((l) => {
      const matchesStage = stage === "All" || l.stage === stage;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.page.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q);
      return matchesStage && matchesSearch;
    });

    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const res = a[sortKey].localeCompare(b[sortKey]);
        return sortDir === "asc" ? res : -res;
      });
    }
    return rows;
  }, [leads, search, stage, sortKey, sortDir]);

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <>
      <Topbar
        title="Leads"
        subtitle="Every person your automations have touched, in one table."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, page, email…"
      />

      <div className="p-4 md:p-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {STAGES.map((s) => {
            const active = stage === s;
            return (
              <button
                key={s}
                onClick={() => setStage(s)}
                className={`relative text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  active
                    ? "border-wire/50 text-ink"
                    : "border-line text-mute hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="stage-pill"
                    className="absolute inset-0 rounded-full bg-wire/15"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10">{s}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-panel border border-line rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-line text-left text-xs text-mute">
                {columns.map((c) => (
                  <th key={c.key} className="px-6 py-4 font-medium">
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="flex items-center gap-1 hover:text-ink"
                    >
                      {c.label}
                      <ArrowUpDown size={11} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!leads &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-raised rounded animate-pulse" />
                    </td>
                  </tr>
                ))}

              {leads && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-mute text-sm">
                    No leads match this search or filter.
                  </td>
                </tr>
              )}

              {leads &&
                visible.map((l, i) => (
                  <motion.tr
                    key={l.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i, 8) * 0.03 }}
                    onClick={() => setSelected(l)}
                    className="border-b border-line last:border-0 hover:bg-raised/50 cursor-pointer"
                  >
                    <td className="px-6 py-4 text-ink font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {l.name}
                        {/* Emoji reaction on their last message — a free
                            lead-temperature signal, no reply required. */}
                        {l.reaction && (
                          <span title="Reacted to the bot's last message" className="text-xs">
                            {l.reaction}
                          </span>
                        )}
                        {/* Repeat-customer flag — how many separate times
                            this exact person has ordered before. */}
                        {l.repeat > 1 && (
                          <span
                            title={`${l.repeat} past orders from this customer`}
                            className="text-[10px] text-mint bg-mint/10 border border-mint/30 rounded-full px-1.5 py-0.5"
                          >
                            ×{l.repeat}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-mute">{l.page}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full border ${stageStyle[l.stage]}`}
                      >
                        {l.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-mute">{l.source}</td>
                    <td className="px-6 py-4 text-mute">{l.email}</td>
                    <td className="px-6 py-4 text-mute">{l.last}</td>
                  </motion.tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <LeadDrawer lead={selected} onClose={() => setSelected(null)} />
    </>
  );
}
