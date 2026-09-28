// Every dashboard block that renders a bordered card uses this instead of
// repeating "bg-panel border border-line rounded-xl p-6" — one shared shell,
// one place to change it. `accent` gives a card its own colour: a soft
// gradient wash plus a hairline along the top edge.
const ACCENTS = {
  signal: { wash: "from-signal/10", line: "via-signal/60" },
  wire: { wash: "from-wire/10", line: "via-wire/60" },
  amber: { wash: "from-amber/10", line: "via-amber/60" },
  mint: { wash: "from-mint/10", line: "via-mint/60" },
  rose: { wash: "from-rose/10", line: "via-rose/60" },
};

export default function Panel({ children, className = "", noPadding = false, accent, ...rest }) {
  const padding = noPadding ? "" : "p-5";
  const a = ACCENTS[accent];

  return (
    <div
      data-accent={accent}
      className={`relative bg-panel border border-line rounded-xl ${padding} ${
        a ? `bg-gradient-to-br ${a.wash} to-transparent` : ""
      } ${className}`}
      {...rest}
    >
      {a && (
        <span
          className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent ${a.line} to-transparent`}
        />
      )}
      {children}
    </div>
  );
}
