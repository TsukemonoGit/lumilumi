<script lang="ts">
  import { queryClient, toastSettings } from "$lib/stores/stores";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { QueryObserver } from "@tanstack/svelte-query";
  import { X } from "lucide-svelte";

  import QRCode from "qrcode";
  import { onDestroy } from "svelte";
  import { fade } from "svelte/transition";
  import { type EventPacket } from "rx-nostr";

  export let invoice: string | undefined;
  export let id: string;

  $: url = invoice ? `lightning:${invoice}` : undefined;

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

  let zapped: { data: EventPacket; status: any; error: any };
  let unsubscribe: (() => void) | undefined; // Start as undefined

  const observer = new QueryObserver($queryClient, {
    queryKey: ["reactions", "zapped", id],
  });

  $: if (!$open && unsubscribe) {
    unsubscribe(); // Call the unsubscribe function if it exists
    unsubscribe = undefined; // Reset unsubscribe after calling
  } else if ($open && !zapped) {
    unsubscribe = observer.subscribe((result: any) => {
      if (result?.data?.event) {
        zapped = result;
        console.log(zapped);
        unsubscribe?.(); // Unsubscribe after receiving data
      }
    });
  } else if ($open && zapped) {
    $toastSettings = {
      title: "Zapped",
      description: "Success to zap",
      color: "bg-green-500",
    };
    $open = false;
  }

  onDestroy(() => {
    unsubscribe?.(); // Ensure unsubscribe is only called if it exists
  });
</script>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    />
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-800
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium">Invoice</h2>
      {#if invoice && url}
        <fieldset class="mb-4 flex flex-col items-center gap-5">
          <div class="flex justify-center">
            {#await QRCode.toDataURL(url)}
              loading
            {:then dataUrl}<a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                class="shadow hover:opacity-75 p-2 rounded-md bg-magnum-500 dark:bg-magnum-500"
              >
                <img
                  src={dataUrl}
                  alt="invoice"
                  class="w-52 h-52 max-w-full object-contain"
                />
              </a>
            {/await}
          </div>
          <div class="break-all">{invoice}</div>
          <iframe src={url} title="Lightning" width="0" height="0" />
        </fieldset>
      {/if}
      <div class="mt-6 flex justify-end gap-4">
        <button
          use:melt={$close}
          class="inline-flex h-8 items-center justify-center rounded-sm
                    bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
        >
          Cancel
        </button>
      </div>
      <button
        use:melt={$close}
        aria-label="close"
        class="absolute right-4 top-4 inline-flex h-6 w-6 appearance-none
                items-center justify-center rounded-full p-1 text-magnum-800
                hover:bg-magnum-100 focus:shadow-magnum-400"
      >
        <X class="size-4" />
      </button>
    </div>
  </div>
{/if}
