// Shared recharts tooltip, themed with the app's colour variables (the
// library's default tooltip ignores dark/light mode). `format` turns a raw
// value into display text; each series is listed with its own colour dot.
export default function ChartTip({ active, payload, label, format = (v) => v.toLocaleString() }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-panel border border-line rounded-lg px-3 py-2 shadow-glow">
      {label && <p className="text-xs text-mute mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2 text-xs text-ink">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-mute">{p.name}</span>
          <span className="font-medium tabular-nums ml-auto pl-3">{format(p.value, p)}</span>
        </p>
      ))}
    </div>
  );
}
