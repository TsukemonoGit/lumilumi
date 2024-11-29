<script lang="ts">
  import { run } from "svelte/legacy";

  import { Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import AlertDialog from "./AlertDialog.svelte";
  import { profile } from "$lib/func/util";
  import { nowProgress, toastSettings } from "$lib/stores/stores";
  import ZapInvoiceWindow from "./ZapInvoiceWindow.svelte";
  import { getZapRelay, makeInvoice } from "$lib/func/zap";
  import DisplayName from "./DisplayName.svelte";
  import { writable, type Writable } from "svelte/store";
  interface Props {
    metadata: Nostr.Event;
  }

  let { metadata }: Props = $props();
  let invoice: string | undefined = $state();
  let dialogOpen: Writable<boolean> = writable(false);
  let zapAmount: number = $state(50);
  let zapComment: string = $state("");
  let invoiceOpen: Writable<boolean> = writable(false);

  const prof = profile(metadata);
  const onClickOK = async () => {
    console.log(zapAmount);
    console.log(zapComment);
    if (zapAmount <= 0) {
      //toast dasite
      $dialogOpen = false;
      return;
    }
    $nowProgress = true;
    const amount = zapAmount * 1000;
    const zapRelays = await getZapRelay(metadata.pubkey);
    const zapInvoice = await makeInvoice({
      metadata,
      id: undefined,
      amount: amount,
      comment: zapComment,
      zapRelays: zapRelays,
    });
    if (zapInvoice === null) {
      $toastSettings = {
        title: "Error",
        description: "Failed to zap",
        color: "bg-red-500",
      };
      return;
    }
    $nowProgress = false;
    invoice = zapInvoice;
    $dialogOpen = false;
    $invoiceOpen = true;
  };
  invoiceOpen.subscribe((value: boolean) => {
    if (!value) {
      invoice = undefined;
    }
  });

  let amountEle: HTMLInputElement | undefined = $state();
  dialogOpen.subscribe((value: boolean) => {
    if (!value) {
      setTimeout(() => {
        amountEle?.focus();
      }, 1);
    }
  });
  // run(() => {
  //   if ($dialogOpen) {
  //     setTimeout(() => {
  //       amountEle?.focus();
  //     }, 1);
  //   }
  // });
</script>

<button
  onclick={() => ($dialogOpen = true)}
  class="w-fit rounded-full bg-neutral-200 text-magnum-600 p-1 hover:opacity-75 active:opacity-50"
  title="zap"><Zap /></button
>
<AlertDialog open={dialogOpen} onClickOK={() => onClickOK()} title="Zap">
  {#snippet main()}
    <div class=" text-neutral-200">
      <div class="rounded-md">
        {#if prof}
          to.
          <div class="flex flex-row items-center gap-2 mt-1">
            <div class="sm:text-xl text-md font-bold break-all">
              <DisplayName
                height={21}
                name={prof.display_name ?? ""}
                tags={metadata.tags}
              />
              {#if prof.name && prof.name !== ""}<DisplayName
                  height={21}
                  name={`@${prof.name}`}
                  tags={metadata.tags}
                />{/if}
            </div>
          </div>
        {/if}
      </div>
      <div class="mt-4 rounded-md">
        <div class="pt-2 font-bold text-magnum-300 text-lg">amount</div>
        <input
          type="number"
          bind:this={amountEle}
          id="amount"
          class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500"
          placeholder="amount"
          bind:value={zapAmount}
        />
        <div class="pt-1 text-magnum-300 font-bold text-lg">comment</div>
        <input
          type="text"
          id="comment"
          class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500"
          placeholder="comment"
          bind:value={zapComment}
        />
      </div>
    </div>
  {/snippet}</AlertDialog
>

<ZapInvoiceWindow open={invoiceOpen} {invoice} id={undefined} />
