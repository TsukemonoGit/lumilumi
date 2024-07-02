<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  /** Internal helpers */

  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";

  const {
    elements: {
      trigger,
      overlay,
      content,
      title,
      description,
      close,
      portalled,
    },
    states: { open },
  } = createDialog({
    forceVisible: true,
  });

  export { open };
  export let dialogTitle: string | undefined = undefined;
</script>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] max-w-[90vw]
           w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
            p-6 shadow-lg"
      use:melt={$content}
    >
      {#if dialogTitle}
        <h2 use:melt={$title} class="m-0 text-lg font-medium">{dialogTitle}</h2>
      {/if}
      <div class="mb-4">
        <slot name="main" />
      </div>

      <div class="mt-6 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Close
        </button>
      </div>
      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800
                hover:bg-magnum-300 focus:shadow-magnum-400 bg-magnum-100"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
{/if}
