<script lang="ts">
  import type { Snippet } from "svelte";

  import { t as _ } from "@konemono/svelte5-i18n";

  interface Props {
    title: string;
    desc?: string | undefined;
    children: Snippet;
  }
  let { title, desc, children }: Props = $props();
</script>

<section
  class="rounded-md shadow bg-neutral-950 sm:px-6 py-6 px-2 w-full !items-start"
>
  <h2 class="text-lg top-8 backdrop-blur-sm font-bold text-magnum-300 sticky">
    {title}
  </h2>
  {#if desc}
    <div class="text-neutral-500 text-xs">{desc}</div>
  {/if}
  <div class="mt-4 pb-2 w-full pl-4">
    {@render children?.()}
  </div>
</section>
