<script lang="ts">
  import { createDialog, melt } from "@melt-ui/svelte";
  import type { Snippet } from "svelte";

  import { fade } from "svelte/transition";
  import { X } from "lucide-svelte";
  import type { Writable } from "svelte/store";

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
    states: { open: dialogOpen },
  } = createDialog({
    forceVisible: true,
  });

  //export { open };
  interface Props {
    dialogTitle?: string | undefined;
    main?: Snippet;
    open?: Writable<boolean>;
    zIndex?: number;
  }

  let {
    open = $bindable(),
    dialogTitle = undefined,
    main,
    zIndex = 10,
  }: Props = $props();
  open?.subscribe((value: boolean) => {
    // console.log(value);
    if (value) {
      $dialogOpen = true;
      $open = false;
    }
  });
</script>

{#if $dialogOpen}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class={`fixed inset-0  bg-black/50`}
      style={`z-index:${zIndex}`}
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class={`fixed left-1/2 top-1/2  max-h-[90vh] max-w-[96vw] 
            -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-900
            p-2 sm:p-6 shadow-lg overflow-hidden grid grid-rows-[auto_1fr_auto]`}
      style={`z-index:${zIndex}`}
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium">
        {dialogTitle || ""}
      </h2>

      {@render main?.()}

      <div class="mt-4 flex justify-end gap-4">
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
