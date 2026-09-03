/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI",
          "system-ui",
          "-apple-system",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: ["'Cormorant Garamond'", "'Times New Roman'", "serif"],
      },
      colors: {
        // Dark chrome (sidebar, top bar, table headers, filter bars)
        shell: "#20100F",
        "shell-alt": "#2A1418",
        "shell-hover": "#38222A",
        "shell-line": "#48292E",
        cream: "#F3E4CE",
        "cream-muted": "#CFB4A6",
        "cream-subtle": "#9E8279",

        // Light content (pages, cards, tables, forms)
        page: "#F6F1EA",
        card: "#FFFFFF",
        "card-alt": "#FAF5EF",
        hairline: "#E7DDD2",
        "hairline-strong": "#D8CABB",
        ink: "#33231F",
        "ink-muted": "#6F5B54",
        "ink-subtle": "#9C877E",
        field: "#FFFFFF",

        brand: {
          50: "#F8EBEC",
          100: "#EACBCD",
          200: "#D89DA1",
          300: "#C4767C",
          400: "#AD545B",
          500: "#93353D",
          600: "#7C2A31",
          700: "#5E1A20",
          800: "#451319",
          900: "#300D11",
          DEFAULT: "#93353D",
        },
        gold: {
          100: "#F6E7C9",
          200: "#EBD3A5",
          300: "#DFBD7E",
          400: "#CDA45C",
          500: "#B98C42",
          600: "#98702F",
          700: "#775726",
          DEFAULT: "#B98C42",
        },

        // Status (light-surface friendly)
        "ok-fg": "#1F7A46",
        "ok-bg": "#E8F4EC",
        "ok-border": "#C0E2CE",
        "err-fg": "#B23B43",
        "err-bg": "#FBE9EA",
        "err-border": "#EFC8CB",
        "warn-fg": "#8A6220",
        "warn-bg": "#F9F0DA",
        "warn-border": "#EBD9B0",
        "info-fg": "#3B5C8A",
        "info-bg": "#EAF0F8",
        "info-border": "#CCDAEC",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        card: "0 10px 26px -14px rgba(51,35,31,0.22)",
        pop: "0 24px 60px -20px rgba(32,16,15,0.35)",
      },
      ringColor: {
        gold: "#B98C42",
        brand: "#93353D",
      },
    },
  },
  plugins: [],
};
