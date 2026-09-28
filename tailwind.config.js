/** @type {import('tailwindcss').Config} */
function themeColor(varName) {
  return `rgb(var(${varName}) / <alpha-value>)`;
}

module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: themeColor("--c-void"),
        panel: themeColor("--c-panel"),
        raised: themeColor("--c-raised"),
        line: themeColor("--c-line"),
        ink: themeColor("--c-ink"),
        mute: themeColor("--c-mute"),
        signal: themeColor("--c-signal"),
        wire: themeColor("--c-wire"),
        amber: themeColor("--c-amber"),
        rose: themeColor("--c-rose"),
        mint: themeColor("--c-mint"),
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--c-signal) / 0.25), 0 8px 30px -8px rgb(var(--c-signal) / 0.25)",
      },
      backgroundImage: {
        "grad-signal": "linear-gradient(135deg, rgb(var(--c-signal)) 0%, rgb(var(--c-wire)) 100%)",
        "grad-warm": "linear-gradient(135deg, rgb(var(--c-amber)) 0%, rgb(var(--c-rose)) 100%)",
        "grad-wire": "linear-gradient(135deg, rgb(var(--c-wire)) 0%, rgb(var(--c-rose)) 100%)",
        "grad-mint": "linear-gradient(135deg, rgb(var(--c-mint)) 0%, rgb(var(--c-signal)) 100%)",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "80%, 100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
      animation: {
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
      },
    },
  },
  plugins: [],
};
