<script lang="ts">
  import { createPagination, melt } from "@melt-ui/svelte";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";

  import { onMount } from "svelte";

  export let list: string[];
  export let tieKey: string;
  let paginationElement: Element | null;
  onMount(() => {
    paginationElement = document?.querySelector("#pagination");
  });
  // const handleChange: CreatePaginationProps["onPageChange"] = ({
  //   curr,
  //   next,
  // }) => {
  //   console.log(curr, next);
  $: if ($range) {
    setTimeout(() => {
      paginationElement?.scrollIntoView({
        block: "start",
        inline: "nearest",
        behavior: "instant",
      });
      window.scrollBy(0, -150);
    }, 1);
  }
  //   return next;
  // };

  const {
    elements: { root, pageTrigger, prevButton, nextButton },
    states: { pages, range },
  } = createPagination({
    count: list.length,
    perPage: 20,
    defaultPage: 1,
    siblingCount: 1,
    //onPageChange: handleChange,
  });

  $: viewList = list.slice($range.start, $range.end);
</script>

<div
  class=" max-w-[100vw] break-words divide-y divide-magnum-600/30"
  id="pagination"
>
  <nav
    class="flex flex-col items-center"
    aria-label="pagination"
    use:melt={$root}
  >
    <div class="flex items-center gap-2" style="overflow-anchor: auto;">
      <button
        class="grid h-8 items-center rounded-md bg-neutral-800 px-3 text-sm text-magnum-100 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-100
      data-[selected]:text-neutral-800"
        use:melt={$prevButton}><ChevronLeft class="size-4" /></button
      >
      {#each $pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <span>...</span>
        {:else}
          <button
            class="grid h-8 items-center rounded-md bg-neutral-800 px-3 text-sm text-magnum-100 shadow-sm
          hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-100
        data-[selected]:text-neutral-800"
            use:melt={$pageTrigger(page)}>{page.value}</button
          >
        {/if}
      {/each}
      <button
        class="grid h-8 items-center rounded-md bg-neutral-800 px-3 text-sm text-magnum-100 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-100
    data-[selected]:text-neutral-800"
        use:melt={$nextButton}><ChevronRight class="size-4" /></button
      >
    </div>
    <p class="text-center text-magnum-100">
      {$range.start} - {$range.end}
    </p>
  </nav>
  {#each viewList as pubhex, index}<slot
      id={pubhex}
      index={index + $range.start}
    />{/each}
  <nav
    class="flex flex-col items-center"
    aria-label="pagination"
    use:melt={$root}
  >
    <div class="flex items-center gap-2">
      <button
        class="grid h-8 items-center rounded-md bg-neutral-800 px-3 text-sm text-magnum-100 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-100
      data-[selected]:text-neutral-800"
        use:melt={$prevButton}><ChevronLeft class="size-4" /></button
      >
      {#each $pages as page (page.key)}
        {#if page.type === "ellipsis"}
          <span>...</span>
        {:else}
          <button
            class="grid h-8 items-center rounded-md bg-neutral-800 px-3 text-sm text-magnum-100 shadow-sm
          hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-100
        data-[selected]:text-neutral-800"
            use:melt={$pageTrigger(page)}>{page.value}</button
          >
        {/if}
      {/each}
      <button
        class="grid h-8 items-center rounded-md bg-neutral-800 px-3 text-sm text-magnum-100 shadow-sm
      hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-50 data-[selected]:bg-magnum-100
    data-[selected]:text-neutral-800"
        use:melt={$nextButton}><ChevronRight class="size-4" /></button
      >
    </div>
    <p class="text-center text-magnum-100">
      {$range.start} - {$range.end}
    </p>
  </nav>
</div>
