<script lang="ts">
  import ZapInvoiceWindow from "$lib/components/Elements/ZapInvoiceWindow.svelte";
  import { nowProgress } from "$lib/stores/stores";
  import { decode, type DecodedInvoice } from "light-bolt11-decoder";
  import { Zap } from "lucide-svelte";
  import { writable, type Writable } from "svelte/store";

  interface Props {
    invoice: string;
  }

  let { invoice = $bindable() }: Props = $props();
  // svelte-ignore non_reactive_update
  let invoiceOpen: Writable<boolean> = writable(false);

  const invoiceDecode = (
    str: string | undefined
  ): DecodedInvoice | undefined => {
    if (!str) {
      return undefined;
    }
    try {
      console.log(decode(str));
      return decode(str);
    } catch (error) {
      return undefined;
    }
  };
  const handleClickPay = () => {
    console.log("pay");
    $invoiceOpen = true;
  };
  let decoded = $derived(invoiceDecode(invoice));
  let amount = $derived(1);
  // decoded?.sections
  //   ? Math.floor(
  //       Number(
  //         decoded.sections.find((section) => section.name === "amount")?.value
  //       ) / 1000
  //     )
  //   : undefined;
</script>

{#if !decoded || !amount}
  <span class="whitespace-pre-wrap break-words" style="word-break: break-word;"
    >{invoice}</span
  >{:else}
  <div class="w-full rounded-full border-magnum-600/30 border overflow-hidden">
    <div
      class=" flex gap-1 text-magnum-400 justify-center bg-magnum-900/50 font-semibold items-center"
    >
      <Zap />Lightning Invoice
    </div>
    <div class="flex items-center gap-1 justify-center">
      <!--grid grid-cols-[0.6fr_0.4fr] -->
      <div class="flex items-center gap-1 flex-wrap">
        <!--justify-end flex-wrap -->
        <div class="font-bold">
          {amount.toLocaleString()}
        </div>
        sats
      </div>
      <button
        onclick={handleClickPay}
        disabled={$nowProgress}
        class="rounded-md p-2 m-1 w-16 bg-magnum-600 border border-magnum-600 text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-15 font-bold"
        >Pay</button
      >
    </div>
  </div>{/if}
<ZapInvoiceWindow bind:open={invoiceOpen} {invoice} id={undefined} />
