import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import typography from "@tailwindcss/typography";
function getColorFromVariableName(name: string) {
  return `rgb(var(--color-${name}) / <alpha-value>)`;
}
function getColorsFromName(
  name: string,
  variants: number[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
) {
  return Object.fromEntries(
    variants.map((n) => [`${n}`, getColorFromVariableName(`${name}-${n}`)])
  );
}
export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1440px",
      },
    },

    extend: {
      screens: {
        xs: "420px",
      },
      animation: {
        "spin-slow": "spin 1.2s linear infinite",
      },
      colors: {
        magnum: getColorsFromName("magnum"),
        neutral: getColorsFromName("neutral"),
        zinc: getColorsFromName("zinc"),
        green: getColorsFromName("green", [400]),
        white: getColorFromVariableName("white"),
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "SF Mono",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
        title: [
          "Georgia",
          "Segoe UI",
          "sans-serif",

          "serif",
          "Roboto",
          "Oxygen",
          "Fira Sans",

          "-apple-system",
          "BlinkMacSystemFont",

          "Ubuntu",
          "Cantarell",

          "Droid Sans",
          "Helvetica Neue",
          "Arial",

          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
        ],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            code: {
              position: "relative",
              borderRadius: theme("borderRadius.md"),
            },
          },
        },
      }),
    },
  },

  plugins: [
    typography,
    plugin(function ({ addVariant, matchUtilities, theme }) {
      addVariant("hocus", ["&:hover", "&:focus"]);
      // Square utility
      matchUtilities(
        {
          square: (value) => ({
            width: value,
            height: value,
          }),
        },
        { values: theme("spacing") }
      );
    }),
  ],
} satisfies Config;
