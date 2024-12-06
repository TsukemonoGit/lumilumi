<script lang="ts">
  import { queryClient, toastSettings } from "$lib/stores/stores";
  import { createDialog, melt } from "@melt-ui/svelte";
  import { QueryObserver } from "@tanstack/svelte-query";
  import { ClipboardCopy, X } from "lucide-svelte";

  import QRCode from "qrcode";
  import { onDestroy, untrack } from "svelte";
  import { fade } from "svelte/transition";
  import { type EventPacket } from "rx-nostr";

  interface Props {
    invoice: string | undefined;
    id: string | undefined;
    openZapwindow: (bool: boolean) => void;
  }

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
  let { invoice, id, openZapwindow = $bindable() }: Props = $props();

  openZapwindow = (bool: boolean) => {
    $open = bool;
  };

  let url = $derived(invoice ? `lightning:${invoice}` : undefined);

  let zapped: { data: EventPacket; status: any; error: any } | undefined =
    $state();

  let unsubscribe: (() => void) | undefined = undefined; // Start as undefined

  const observer:
    | QueryObserver<unknown, Error, unknown, unknown, string[]>
    | undefined = id
    ? new QueryObserver($queryClient, {
        queryKey: ["reactions", "zapped", id],
      })
    : undefined;

  //ザップ完了したら画面を閉じる（$open=falseにするためのやつ
  //idでしかみてないからユーザーへのザップの場合は閉じない
  open.subscribe((openState) => {
    if (openState && !zapped) {
      //ザップ一回したら押せなくなるけど
      unsubscribe = observer?.subscribe((value: any) => {
        if (value?.data?.event) {
          zapped = value;
          console.log(zapped);
          unsubscribe?.();
        }
      });
    } else {
      unsubscribe?.();
    }
  });

  onDestroy(() => {
    unsubscribe?.(); // Ensure unsubscribe is only called if it exists
  });

  const handleClickCopy = async () => {
    try {
      if (invoice) {
        await navigator.clipboard.writeText(invoice);
        $toastSettings = {
          title: "Success",
          description: "Copied to clipboard",
          color: "bg-green-500",
        };
      } else {
        throw new Error("No invoice");
      }
    } catch (error: any) {
      console.error(error.message);
      $toastSettings = {
        title: "Warning",
        description: "Failed to copy",
        color: "bg-orange-500",
      };
    }
  };
</script>

{#if $open}
  <div class="" use:melt={$portalled}>
    <div
      use:melt={$overlay}
      class="fixed inset-0 z-50 bg-black/50"
      transition:fade={{ duration: 150 }}
    ></div>
    <div
      class="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[90vw]
            max-w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-neutral-800
            p-6 shadow-lg"
      use:melt={$content}
    >
      <h2 use:melt={$title} class="m-0 text-lg font-medium">Invoice</h2>
      {#if invoice && url}
        <fieldset class="my-2 flex flex-col items-center gap-6">
          <div
            class="grid grid-cols-[auto_1fr] items-center rounded-md bg-neutral-700"
          >
            <div class="break-all h-12 overflow-y-auto p-1">{invoice}</div>
            <button
              onclick={handleClickCopy}
              class="w-8 h-full flex justify-center items-center overflow-hidden bg-magnum-600 hover:opacity-75 active:opacity-50 rounded-r-md"
              ><ClipboardCopy /></button
            >
          </div>
          <div class="flex justify-center">
            {#await QRCode.toDataURL(url)}
              loading
            {:then dataUrl}<a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                class="shadow hover:opacity-75 p-1 rounded-md bg-magnum-500 dark:bg-magnum-500 h-fit w-fit"
              >
                <img
                  src={dataUrl}
                  alt="invoice"
                  class="w-80 h-80 max-w-full max-h-[40vh] object-contain"
                />
              </a>
            {/await}
          </div>

          <iframe src={url} title="Lightning" width="0" height="0"></iframe>
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
