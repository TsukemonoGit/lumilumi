<script lang="ts">
  import { Zap } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  import { profile } from "$lib/func/util";
  import { nowProgress } from "$lib/stores/stores";

  import { getZapRelay, makeInvoice } from "$lib/func/zap";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";
  import ZapInvoiceWindow from "$lib/components/Elements/ZapInvoiceWindow.svelte";
  import DisplayName from "./DisplayName.svelte";
  import { type Writable, writable } from "svelte/store";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { MenuButtonClass } from "$lib/func/constants";
  import { addToast } from "$lib/components/Elements/Toast.svelte";

  interface Props {
    metadata: Nostr.Event;
    children?: () => any;
    comment?: string;
    zapOpen?: boolean;
  }

  let {
    metadata,
    children,
    comment,
    zapOpen = $bindable(false),
  }: Props = $props();
  let invoice: string | undefined = $state();
  let dialogOpen: (bool: boolean) => void = $state(() => {});
  let zapAmount: number = $state(50);
  let zapComment: string = $derived(comment ?? "");
  let invoiceOpen: (bool: boolean) => void = $state(() => {});

  let prof = $derived(profile(metadata));
  let invOp = false;
  const onClickOK = async () => {
    invoice = undefined;
    console.log(zapAmount);
    console.log(zapComment);
    if (zapAmount <= 0) {
      zapOpen = false;
      //toast dasite
      dialogOpen?.(false);
      return;
    }
    $nowProgress = true;
    const amount = zapAmount * 1000;
    const zapRelays = await getZapRelay(metadata.pubkey);
    const zapInvoice = await makeInvoice({
      metadata,
      eventTag: undefined,
      amount: amount,
      comment: zapComment,
      zapRelays: zapRelays,
    });
    if (zapInvoice === null) {
      addToast({
        data: {
          title: "Error",
          description: "Failed to zap",
          color: "bg-red-500",
        },
      });
      $nowProgress = false;
      zapOpen = false;
      return;
    }
    $nowProgress = false;
    invoice = zapInvoice;
    dialogOpen?.(false);
    invoiceOpen?.(true);
    invOp = true;
    try {
      //サップの量保存
      localStorage.setItem(STORAGE_KEYS.ZAP, zapAmount.toString());
    } catch (error) {
      console.log("failed to save localStorage");
    }
  };

  let amountEle: HTMLInputElement | undefined = $state();

  const handleClickZap = async () => {
    console.log("zap");
    const storagezap = localStorage.getItem(STORAGE_KEYS.ZAP);
    if (storagezap) {
      zapAmount = Number(storagezap);
    }
    //amount comment画面を開いてamountのinputにfocus
    dialogOpen?.(true);
    setTimeout(() => {
      amountEle?.focus();
    }, 1);
    zapOpen = true;
  };

  let dialogStatus: Writable<boolean> = $state(writable(false));
  const closeInvoice = () => {
    zapOpen = false;
    invOp = true;
  };
  // svelte-ignore state_referenced_locally
  dialogStatus.subscribe((value) => {
    if (!value && !invOp) {
      zapOpen = false;
    }
  });
</script>

<button onclick={handleClickZap} title="zap"
  >{#if children !== undefined}
    {@render children()}
  {:else}
    <Zap class={`${MenuButtonClass} `} />
  {/if}
</button>
<AlertDialog
  bind:dialogStatus
  bind:openDialog={dialogOpen}
  onClickOK={() => onClickOK()}
  title="Zap"
>
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

<ZapInvoiceWindow
  bind:openZapwindow={invoiceOpen}
  {invoice}
  id={undefined}
  {closeInvoice}
/>
