<script lang="ts">
  import { createSelect, melt } from "@melt-ui/svelte";
  import { fade } from "svelte/transition";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import {
    nip96MediaUploader,
    blossomMediaUploader,
  } from "$lib/func/constants";
  import { Check, ChevronDown } from "lucide-svelte";
  import type { UploaderOption, UploaderType } from "$lib/types";

  import { uploader } from "$lib/stores/globalRunes.svelte";

  function getHostname(url: string) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  const groupedOptions: Record<UploaderType, UploaderOption[]> = {
    nip96: nip96MediaUploader.map((url) => ({ type: "nip96", address: url })),
    blossom: blossomMediaUploader.map((url) => ({
      type: "blossom",
      address: url,
    })),
  };

  const {
    elements: { trigger, menu, option, group, groupLabel, label },
    states: { selectedLabel, open },
    helpers: { isSelected },
  } = createSelect<UploaderOption>({
    defaultSelected: { value: $uploader },
    forceVisible: true,
    positioning: {
      placement: "bottom",
      fitViewport: true,
      sameWidth: true,
    },
    onSelectedChange: ({ curr, next }) => {
      if (next?.value) {
        $uploader = next.value;
        localStorage.setItem(STORAGE_KEYS.UPLOADER, JSON.stringify(next.value));
      }
      return next; // ChangeFn なので next を返す
    },
  });
</script>

<div class="flex flex-col gap-1 w-full">
  <button
    class="flex h-9 items-center justify-between rounded-lg bg-zinc-900 px-3 py-2 border border-magnum-500
    text-magnum-300 shadow transition-opacity hover:opacity-90"
    use:melt={$trigger}
    aria-label="Uploader"
  >
    {$uploader.address
      ? `[${$uploader.type}] ${getHostname($uploader.address)}`
      : "Select an uploader"}
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
      {#each Object.entries(groupedOptions) as [key, arr]}
        <div use:melt={$group(key)}>
          <div
            class="py-1 pl-4 pr-4 font-semibold capitalize text-neutral-100"
            use:melt={$groupLabel(key)}
          >
            {key}
          </div>
          {#each arr as item}
            <div
              class="relative cursor-pointer rounded-lg py-1 pl-8 pr-4 text-neutral-100
              hover:bg-magnum-100 focus:z-10
              focus:text-magnum-700
              data-[highlighted]:bg-magnum-500/25 data-[highlighted]:text-neutral-100
              data-[disabled]:opacity-50"
              use:melt={$option({
                value: item,
                label: `[${item.type}] ${getHostname(item.address)}`,
              })}
            >
              <div class="check {$isSelected(item) ? 'block' : 'hidden'}">
                <Check class="size-4" />
              </div>
              {getHostname(item.address)}
            </div>
          {/each}
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
