<script lang="ts">
  import { queryClient } from "$lib/stores/stores";
  import { QueryObserver } from "@tanstack/svelte-query";
  import { ClipboardCopy } from "lucide-svelte";

  import QRCode from "qrcode";
  import { onDestroy } from "svelte";
  import { type EventPacket } from "rx-nostr";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { addToast } from "./Toast.svelte";
  import Dialog from "./Dialog.svelte";

  interface Props {
    invoice: string | undefined;
    id: string | undefined;
    open?: boolean;
    closeInvoice?: () => void;
  }

  let { invoice, id, open = $bindable(false), closeInvoice }: Props = $props();

  let url = $derived(invoice ? `lightning:${invoice}` : undefined);

  let zapped: { data: EventPacket; status: any; error: any } | undefined =
    $state();

  let unsubscribe: (() => void) | undefined = undefined;

  // ザップ完了したら画面を閉じる
  $effect(() => {
    if (open && !zapped) {
      const observer:
        | QueryObserver<unknown, Error, unknown, unknown, string[]>
        | undefined = id
        ? new QueryObserver(queryClient, {
            queryKey: ["reactions", id, "zapped", lumiSetting.get().pubkey],
          })
        : undefined;

      unsubscribe = observer?.subscribe((value: any) => {
        if (!value) return;
        const data = value?.data as EventPacket[];
        if (data && data.length > 0) {
          zapped = value[0];
          console.log(zapped);
          open = false;
          unsubscribe?.();
        }
      });
    } else if (!open) {
      closeInvoice?.();
      unsubscribe?.();
    }
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  const handleClickCopy = async () => {
    try {
      if (invoice) {
        await navigator.clipboard.writeText(invoice);
        addToast({
          data: {
            title: "Success",
            description: "Copied to clipboard",
            color: "bg-green-500",
          },
        });
      } else {
        throw new Error("No invoice");
      }
    } catch (error: any) {
      console.error(error.message);
      addToast({
        data: {
          title: "Warning",
          description: "Failed to copy",
          color: "bg-orange-500",
        },
      });
    }
  };
</script>

<Dialog bind:open id="zap-invoice">
  {#snippet title()}
    Invoice
  {/snippet}
  {#snippet main()}
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
  {/snippet}
  {#snippet footer({ close })}
    <div class="mt-6 flex justify-end gap-4">
      <button
        onclick={close}
        class="inline-flex h-8 items-center justify-center rounded-sm
                  bg-zinc-100 px-4 font-medium leading-none text-zinc-600"
      >
        Cancel
      </button>
    </div>
  {/snippet}
</Dialog>
