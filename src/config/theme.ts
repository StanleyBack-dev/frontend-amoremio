// Global theme configuration for the frontend.
// AMORE MIO — deep bordô "chrome" (sidebar, top bar, table headers, filter
// bars) wrapping a light, near-white content area (cards, tables, forms).
// Use the semantic Tailwind tokens declared in tailwind.config.js:
//   chrome:  bg-shell / bg-shell-hover / text-cream / text-cream-muted
//   content: bg-page / bg-card / bg-card-alt / border-hairline /
//            text-ink / text-ink-muted / text-ink-subtle / bg-field
// `colors` stays as a legacy alias for older inline styles.

export const palette = {
  // Dark chrome
  shell: "#20100F",
  shellAlt: "#2A1418",
  shellHover: "#38222A",
  shellLine: "#48292E",
  cream: "#F3E4CE",
  creamMuted: "#CFB4A6",
  creamSubtle: "#9E8279",

  // Light content
  page: "#F6F1EA",
  card: "#FFFFFF",
  cardAlt: "#FAF5EF",
  hairline: "#E7DDD2",
  hairlineStrong: "#D8CABB",
  ink: "#33231F",
  inkMuted: "#6F5B54",
  inkSubtle: "#9C877E",
  field: "#FFFFFF",

  // Brand bordô
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
  },

  // Gold accent
  gold: {
    100: "#F6E7C9",
    200: "#EBD3A5",
    300: "#DFBD7E",
    400: "#CDA45C",
    500: "#B98C42",
    600: "#98702F",
    700: "#775726",
  },

  // Status — light-surface friendly
  success: { fg: "#1F7A46", bg: "#E8F4EC", border: "#C0E2CE" },
  danger: { fg: "#B23B43", bg: "#FBE9EA", border: "#EFC8CB", solid: "#B23B43" },
  warning: { fg: "#8A6220", bg: "#F9F0DA", border: "#EBD9B0" },
  info: { fg: "#3B5C8A", bg: "#EAF0F8", border: "#CCDAEC" },

  white: "#FFFFFF",
  black: "#000000",
} as const;

// Legacy alias. Older components referenced colors.brown[800] as heading
// text, colors.black[800] as a dark surface, etc. Remapped to the light
// content palette so anything not yet migrated still renders acceptably.
export const colors = {
  gold: {
    500: palette.gold[500],
    600: palette.gold[600],
  },
  brown: {
    50: palette.hairline,
    100: palette.hairline,
    300: palette.inkSubtle,
    500: palette.inkMuted,
    800: palette.ink,
  },
  purple: {
    400: palette.brand[400],
    500: palette.brand[500],
    700: palette.brand[600],
  },
  black: {
    900: palette.shell,
    800: palette.card,
    700: palette.shellHover,
  },
  red: {
    500: palette.danger.solid,
    600: "#9C333B",
    700: "#83272F",
  },
  white: palette.card,
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "2rem",
};

export const typography = {
  fontFamily:
    "Inter, 'Segoe UI', system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif",
  displayFamily: "'Cormorant Garamond', 'Times New Roman', serif",
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.8125rem",
    md: "0.875rem",
    lg: "1.0625rem",
    xl: "1.375rem",
  },
};

export const radii = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  full: "9999px",
};

export const shadows = {
  sm: "0 1px 2px 0 rgba(51,35,31,0.08)",
  md: "0 10px 26px -14px rgba(51,35,31,0.22)",
  lg: "0 24px 60px -20px rgba(32,16,15,0.35)",
};
