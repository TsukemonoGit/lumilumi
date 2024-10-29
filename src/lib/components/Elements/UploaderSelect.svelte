<script lang="ts">
  import { mediaUploader } from "$lib/func/util";
  import { createSelect, melt } from "@melt-ui/svelte";
  import { Check, ChevronDown } from "lucide-svelte";
  import { fade } from "svelte/transition";

  export let defaultValue: string | undefined;
  export let selectedUploader: string;

  const options = mediaUploader.map((url, index) => ({
    value: url,
    label: getHostname(url),
  }));

  // console.log(defaultValue);
  //console.log(options);

  function getHostname(url: string): string {
    try {
      return new URL(url).hostname;
    } catch (error) {
      console.error(`Invalid URL: ${url}`);
      return "Invalid URL";
    }
  }

  const {
    elements: { trigger, menu, option },
    states: { selected, selectedLabel, open },
    helpers: { isSelected },
  } = createSelect<string>({
    forceVisible: true,

    positioning: {
      placement: "bottom",
      fitViewport: true,
      sameWidth: true,
    },
  });

  $: if ($selected) {
    selectedUploader = $selected.value;
    localStorage?.setItem("uploader", selectedUploader);
  }
</script>

<div class="flex flex-col gap-1 w-full">
  <button
    class="flex h-8 items-center justify-between rounded-lg bg-zinc-900 px-3 py-2 border border-magnum-500
    text-magnum-300 shadow transition-opacity hover:opacity-90"
    use:melt={$trigger}
    aria-label="Food"
  >
    {($selected?.label ?? defaultValue !== undefined)
      ? getHostname(defaultValue ?? "")
      : options[0].label}
    <ChevronDown class="size-5" />
  </button>
  {#if $open}
    <div
      class="z-[60] flex max-h-[300px] flex-col
      overflow-y-auto rounded-lg bg-zinc-900 p-1
      shadow focus:!ring-0"
      use:melt={$menu}
      transition:fade={{ duration: 150 }}
    >
      {#each options as item}
        <div
          class="relative cursor-pointer rounded-lg py-1 pl-8 pr-4 text-neutral-100
          hover:bg-magnum-100 focus:z-10
          focus:text-magnum-700
          data-[highlighted]:bg-magnum-500/25 data-[highlighted]:text-neutral-100
          data-[disabled]:opacity-50"
          use:melt={$option({ value: item.value })}
        >
          <div class="check {$isSelected(item.value) ? 'block' : 'hidden'}">
            <Check class="size-4" />
          </div>
          {item.label}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  .check {
    position: absolute;
    left: theme(spacing.2);
    top: 50%;
    z-index: theme(zIndex.20);
    translate: 0 calc(-50% + 1px);
    color: theme(colors.magnum.500);
  }
</style>
