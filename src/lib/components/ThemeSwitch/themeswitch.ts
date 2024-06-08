import { getContext, setContext } from "svelte";

import type { Select } from "@melt-ui/svelte";
import type { Theme } from "$lib/types";

export const getThemeCtx = () => {
  return getContext<Select<Theme>>("theme");
};

export const setThemeCtx = (ctx: Select<Theme>) => {
  setContext("theme", ctx);
};
