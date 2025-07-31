import { browser } from "$app/environment";
export type ColorScheme = "orange" | "grayscale";
export function changeTheme(colorScheme: string = "orange") {
  if (!browser) return;
  const root = document.documentElement;

  switch (colorScheme) {
    case "orange":
    default:
      root.style.setProperty("--color-magnum-50", "255 249 237");
      root.style.setProperty("--color-magnum-100", "254 242 214");
      root.style.setProperty("--color-magnum-200", "252 224 172");
      root.style.setProperty("--color-magnum-300", "249 201 120");
      root.style.setProperty("--color-magnum-400", "247 177 85");
      root.style.setProperty("--color-magnum-500", "243 141 28");
      root.style.setProperty("--color-magnum-600", "228 115 18");
      root.style.setProperty("--color-magnum-700", "189 87 17");
      root.style.setProperty("--color-magnum-800", "150 69 22");
      root.style.setProperty("--color-magnum-900", "121 58 21");
      root.style.setProperty("--color-magnum-950", "65 28 9");
      break;
    case "grayscale":
      root.style.setProperty("--color-magnum-50", "252 252 252");
      root.style.setProperty("--color-magnum-100", "245 245 245");
      root.style.setProperty("--color-magnum-200", "229 229 229");
      root.style.setProperty("--color-magnum-300", "212 212 212");
      root.style.setProperty("--color-magnum-400", "163 163 163");
      root.style.setProperty("--color-magnum-500", "115 115 115");
      root.style.setProperty("--color-magnum-600", "82 82 82");
      root.style.setProperty("--color-magnum-700", "64 64 64");
      root.style.setProperty("--color-magnum-800", "64 64 64");
      root.style.setProperty("--color-magnum-900", "58 58 58");
      root.style.setProperty("--color-magnum-950", "23 23 23");
      break;
  }
}
