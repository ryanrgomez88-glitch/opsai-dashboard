/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    transparent: "transparent",
    current: "currentColor",
    extend: {
      colors: {
        navy: "#1E3A5F",
        "blue-accent": "#2196F3",
        tremor: {
          brand: {
            faint: "#EFF6FF",
            muted: "#BFDBFE",
            subtle: "#60A5FA",
            DEFAULT: "#2196F3",
            emphasis: "#1E3A5F",
            inverted: "#FFFFFF",
          },
          background: {
            muted: "#F9FAFB",
            subtle: "#F3F4F6",
            DEFAULT: "#FFFFFF",
            emphasis: "#374151",
          },
          border: { DEFAULT: "#E5E7EB" },
          ring: { DEFAULT: "#E5E7EB" },
          content: {
            subtle: "#9CA3AF",
            DEFAULT: "#6B7280",
            emphasis: "#374151",
            strong: "#111827",
            inverted: "#FFFFFF",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        "tremor-input": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "tremor-card": "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "tremor-dropdown": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },
      borderRadius: {
        "tremor-small": "0.375rem",
        "tremor-default": "0.5rem",
        "tremor-full": "9999px",
      },
      fontSize: {
        "tremor-label": ["0.75rem"],
        "tremor-default": ["0.875rem", { lineHeight: "1.25rem" }],
        "tremor-title": ["1.125rem", { lineHeight: "1.75rem" }],
        "tremor-metric": ["1.875rem", { lineHeight: "2.25rem" }],
      },
    },
  },
  safelist: [
    { pattern: /^(bg|text|border|ring|from|to)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/ },
    { pattern: /^(bg|text|border|ring|from|to)-tremor-/ },
  ],
  plugins: [],
};
