<script lang="ts">
  import ZapInvoiceWindow from "$lib/components/Elements/ZapInvoiceWindow.svelte";
  import { nowProgress } from "$lib/stores/stores";
  import { decode, type DecodedInvoice } from "light-bolt11-decoder";
  import { Zap } from "lucide-svelte";

  interface Props {
    invoice: string;
  }

  let { invoice }: Props = $props();
  // svelte-ignore non_reactive_update
  let invoiceOpen: (bool: boolean) => void = () => {};

  const invoiceDecode = (
    str: string | undefined
  ): DecodedInvoice | undefined => {
    if (!str) {
      return undefined;
    }
    try {
      // console.log(decode(str));
      return decode(str);
    } catch (error) {
      return undefined;
    }
  };
  const handleClickPay = () => {
    console.log("pay");
    invoiceOpen?.(true);
  };

  let decoded = $derived(invoiceDecode(invoice));

  // 金額（satoshi単位）を取得
  let amount: number | undefined = $derived(
    decoded ? getAmountSats(decoded) : undefined
  );

  function getAmountSats(decoded: DecodedInvoice): number | undefined {
    const section = decoded.sections.find((s) => s.name === "amount");
    if (!section) return undefined;

    const letters = section.letters; // e.g. '20u'
    const match = letters.match(/^(\d+)([munp])$/);
    if (!match) return undefined;

    const [_, numStr, unit] = match;
    const num = parseInt(numStr);
    if (isNaN(num)) return undefined;

    // 単位倍率（BTC → sats）
    const unitToSats: Record<string, number> = {
      m: 1e5, // millibtc = 0.001 BTC = 100,000 sats
      u: 1e2, // microbtc = 0.000001 BTC = 100 sats
      n: 0.1, // nanobtc  = 0.000000001 BTC = 0.1 sats
      p: 0.0001, // picobtc  = 0.000000000001 BTC = 0.0001 sats
    };

    const multiplier = unitToSats[unit];
    if (multiplier === undefined) return undefined;

    const sats = num * multiplier;

    // 最終的に整数satsに丸める（切り捨て）
    return Math.floor(sats);
  }
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
<ZapInvoiceWindow bind:openZapwindow={invoiceOpen} {invoice} id={undefined} />
