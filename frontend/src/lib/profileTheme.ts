import type { CSSProperties } from "react";

export interface ProfileAreaTheme {
  page: CSSProperties;
  banner: CSSProperties;
  panel: CSSProperties;
  subtlePanel: CSSProperties;
  avatar: CSSProperties;
}

export function getProfileAreaTheme(colorValue: string): ProfileAreaTheme {
  return {
    page: {
      backgroundImage: `linear-gradient(180deg, hsl(${colorValue} / 0.14), transparent 30%)`,
    },
    banner: {
      backgroundImage: [
        `radial-gradient(circle at 18% 18%, hsl(${colorValue} / 0.9), transparent 34%)`,
        `radial-gradient(circle at 84% 0%, hsl(${colorValue} / 0.7), transparent 30%)`,
        `linear-gradient(135deg, hsl(${colorValue} / 0.96), hsl(${colorValue} / 0.44))`,
      ].join(", "),
      boxShadow: `inset 0 -52px 72px hsl(var(--background) / 0.3)`,
    },
    panel: {
      backgroundImage: `linear-gradient(135deg, hsl(${colorValue} / 0.24), hsl(var(--card)) 72%)`,
      borderColor: `hsl(${colorValue} / 0.3)`,
      boxShadow: `0 18px 40px -30px hsl(${colorValue} / 0.72)`,
    },
    subtlePanel: {
      backgroundImage: `linear-gradient(135deg, hsl(${colorValue} / 0.14), hsl(var(--card) / 0.68) 72%)`,
      borderColor: `hsl(${colorValue} / 0.22)`,
    },
    avatar: {
      boxShadow: `0 20px 44px -22px hsl(${colorValue} / 0.8)`,
    },
  };
}
