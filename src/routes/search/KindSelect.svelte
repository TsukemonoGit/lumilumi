<script lang="ts">
  import { eventKinds } from "$lib/func/kinds";
  import { locale } from "@konemono/svelte5-i18n";
  import { fly } from "svelte/transition";
  import InputNumber from "./InputNumber.svelte";
  import Popover from "$lib/components/Elements/Popover.svelte";

  interface Props {
    selectedKind?: string | undefined;
  }

  let { selectedKind = $bindable(undefined) }: Props = $props();
  let openPopover: boolean = $state(false);

  const handleClickKind = (kind: number) => {
    selectedKind = kind.toString();
    openPopover = false;
  };

  const handleConfirmCustom = (customKind: number) => {
    const value = String(customKind);
    if (value.trim() !== "" && !isNaN(Number(value))) {
      selectedKind = value;
    }
    openPopover = false;
  };
</script>

<Popover ariaLabel="kind select" bind:open={openPopover}>
  <div
    class="text-magnum-400 transition-colors cursor-pointer w-5 h-5 rounded-full border border-magnum-400 text-xs font-bold"
  >
    K
  </div>

  {#snippet popoverContent()}
    <div class="menu" transition:fly={{ duration: 150, y: -10 }}>
      <InputNumber onConfirm={handleConfirmCustom} />
      <div class="border-t border-neutral-700 my-1"></div>
      <div class="flex flex-col max-h-80 overflow-y-auto">
        {#each Array.from(eventKinds.entries()) as [kind, { ja, en }]}
          <button
            type="button"
            class="p-1 w-full border border-transparent hover:border-magnum-400 rounded-md text-start"
            onclick={() => handleClickKind(kind)}
          >
            {kind}
            {$locale === "ja" ? ja : en}
          </button>
        {/each}
      </div>
    </div>
  {/snippet}
</Popover>
