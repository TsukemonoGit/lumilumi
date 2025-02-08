<script lang="ts">
  import UniqueEventList from "$lib/components/renderSnippets/nostr/UniqueEventList.svelte";
  import { page } from "$app/state";
  import Link from "$lib/components/Elements/Link.svelte";
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";
  import { Share, BriefcaseMedical } from "lucide-svelte";
  import Github from "../settings/Github.svelte";
  import { _ } from "svelte-i18n";
  import AlertDialog from "$lib/components/Elements/AlertDialog.svelte";

  import type { EventTemplate } from "nostr-tools";
  import { monoZap } from "$lib/func/constants";
  import * as Nostr from "nostr-typedef";
  import ZapInvoiceWindow from "$lib/components/Elements/ZapInvoiceWindow.svelte";
  import { QueryObserver, type QueryKey } from "@tanstack/svelte-query";
  import { now } from "rx-nostr";
  import { lumiSetting, viewEventIds } from "$lib/stores/globalRunes.svelte";
  import { makeZapRequest } from "$lib/func/zap";
  import ZapList from "$lib/components/NostrElements/AllReactionsElement/ZapList.svelte";

  const handleClickShare = async () => {
    //share link
    const shareData = {
      title: `LUMILUMI the NOSTR client`,
      //  text:  undefined,
      url: page.url.origin,
    };
    try {
      await navigator.share(shareData);
      // await navigator.clipboard.writeText(
      //   `${page.url.origin}/channel/${nevent}`
      // );
      // $toastSettings = {
      //   title: "Success",
      //   description: `shared successfully`,
      //   color: "bg-green-500",
      // };
    } catch (error: any) {
      console.error(error.message);
      $toastSettings = {
        title: "Error",
        description: "Failed to share",
        color: "bg-orange-500",
      };
    }
  };
  let loadImage: boolean = $state(false);

  let dialogOpen: (bool: boolean) => void = $state(() => {});
  let zapAmount: number = $state(0);
  let zapComment: string = $state("");
  let invoice: string | undefined = $state(undefined);
  let invoiceOpen: (bool: boolean) => void = $state(() => {});
  const observer2 = new QueryObserver(queryClient, {
    queryKey: ["reactions", monoZap.eventTag[1], "zapped", $loginUser],
  });
  let unsubscribe: () => void = $state(() => {});
  async function onClickZap() {
    invoice = undefined;
    if (zapAmount <= 0) {
      //toast dasite
      dialogOpen?.(false);
      return;
    }
    $nowProgress = true;
    const amount = zapAmount * 1000;

    try {
      const zapRequest: EventTemplate = makeZapRequest({
        profile: monoZap.pubkey,
        eventTag: monoZap.eventTag,
        amount: amount,
        relays: monoZap.relays,
        comment: zapComment,
      });
      const signedRequest = await (
        window.nostr as Nostr.Nip07.Nostr
      )?.signEvent(zapRequest);
      const encoded = encodeURI(JSON.stringify(signedRequest));
      const url = `${monoZap.endoiunt}?amount=${amount}&nostr=${encoded}`;
      console.log("[zap url]", url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error("[zap failed]", await response.text());

        throw Error;
      }
      const payment = await response.json();
      const { pr: zapInvoice } = payment;
      if (zapInvoice === undefined) {
        console.error("[zap failed]", payment);
        throw Error;
      }
      dialogOpen?.(false);
      invoiceOpen?.(true);
      invoice = zapInvoice;
      $nowProgress = false;

      //開いた時間（過去ザップしたことあったら開いた後すぐ閉じちゃうから）
      const date = now();
      unsubscribe = observer2.subscribe((result: any) => {
        console.log(result);
        if (result?.data?.event && result.data.event.created_at >= date) {
          invoiceOpen?.(false);
          unsubscribe?.();

          //購読対象から削除
          const index = viewEventIds
            .get()
            .findIndex(
              (item) => item[0] === "a" && item[1] === monoZap.eventTag[1]
            );
          if (index !== -1) {
            viewEventIds.get().splice(index, 1);
          }
          $toastSettings = {
            title: "Success",
            description: "Thank you for the zap!",
            color: "bg-green-500",
          };
        }
      });
      //購読対象に追加
      viewEventIds.get().push(monoZap.eventTag);
      // viewEventIds.get = viewEventIds.get;
    } catch (error) {
      $toastSettings = {
        title: "Error",
        description: "Failed to zap",
        color: "bg-red-500",
      };
      $nowProgress = false;
      //toast
    }
  }
  const zappedQuery: QueryKey = ["reactions", monoZap.eventTag[1], "zapped"]; //atag
  const zappedFilters: Nostr.Filter[] = [
    {
      kinds: [9735],
      "#a": [monoZap.eventTag[1]],
    },
    {
      kinds: [9735],

      "#e": [
        "df6034a5676deca7bc687abc7dc2ea703a8de01954f0d87879cbc790a5ead234",
      ],
    },
  ];

  const zapperEvent = (event: Nostr.Event): Nostr.Event | undefined => {
    const desc = event.tags.find((tag) => tag[0] === "description");
    if (!desc || desc.length <= 1) {
      return;
    }
    try {
      return JSON.parse(desc[1]);
    } catch (error) {
      return;
    }
  };

  const filteredEvents = (events: Nostr.Event[]) => {
    return events.filter(
      (event) =>
        zapperEvent(event)?.pubkey !==
          "5650178597525e90ea16a4d7a9e33700ac238a1be9dbf3f5093862929d9a1e60" &&
        zapperEvent(event)?.pubkey !==
          "84b0c46ab699ac35eb2ca286470b85e081db2087cdef63932236c397417782f5"
    ); //テストザップ除く
  };
</script>

<!-- <h1 class="title my-4">ABOUT</h1> -->
<section class="border border-magnum-500 rounded-md h-full my-4 mx-2 p-2">
  <h1 class="title my-4 text-center">lumilumi the nostr client</h1>
  <ul class="w-full px-4">
    <li>
      <div class="list">Many Thanks for the Zaps!</div>
      <div class="item">
        <p>
          Including those sent through other notes—your support means a lot!
        </p>
        <UniqueEventList
          queryKey={zappedQuery}
          filters={zappedFilters}
          req={undefined}
        >
          {#snippet nodata()}
            <!---->
          {/snippet}
          {#snippet loading()}
            <!---->
          {/snippet}
          {#snippet content({ events: events, status })}
            <!---->
            <div class="max-h-42 overflow-y-auto mt-1">
              <ZapList events={filteredEvents(events)} tieKey={undefined} />
            </div>
          {/snippet}
          {#snippet error()}
            <!---->
          {/snippet}
        </UniqueEventList>

        <button
          class="flex gap-1 items-center rounded-full border-magnum-300 border m-2 px-2 py-1 text-magnum-300 hover:opacity-75 active:opacity-50"
          data-npub="npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
          data-note-id="note15lm4779yy4v7ygdx8dxhgzjuc5ewvsfzw452hew8aq84ztmrgm8q90ks8u"
          data-relays="wss://nostr.mutinywallet.com,wss://bostr.nokotaro.com,wss://relay.nostr.band/"
          onclick={() => dialogOpen?.(true)}
        >
          Zap⚡️Lumilumi
        </button>
      </div>
    </li>
    <li>
      <div class="list">{$_("shortcut.title")}</div>
      <div class="item">
        <table>
          <thead>
            <tr>
              <th> Key </th>
              <th> Command </th>
            </tr>
          </thead>
          <tbody>
            <tr> <td>N</td><td>{$_("shortcut.N")}</td></tr>
            <tr><td>Ctrl+Enter</td><td>{$_("shortcut.CtrlEnter")}</td></tr>
            <tr><td>Esc Esc</td><td>{$_("shortcut.EscEsc")}</td></tr>
          </tbody>
        </table>
      </div>
    </li>
    <li>
      <div class="list">{$_("sourceCode")}</div>
      <div class="item">
        <Link
          href="https://github.com/TsukemonoGit/lumilumi"
          className="flex gap-1 items-center underline"
        >
          {#snippet content()}TsukemonoGit/lumilumi<Github
              size={24}
            />{/snippet}
        </Link>
      </div>
    </li>
    <li>
      <div class="list">{$_("author")}</div>
      <div class="item">
        <Link
          href="https://lumilumi.app/npub1sjcvg64knxkrt6ev52rywzu9uzqakgy8ehhk8yezxmpewsthst6sw3jqcw"
          className="flex gap-1 items-center underline"
        >
          {#snippet content()}@mono{/snippet}
        </Link>
      </div>
    </li>
    <li>
      <div class="list">{$_("mascot")}</div>
      <div class="item">
        Illustration by <a
          class="underline"
          href="/npub1e09suzmq9mp6nt0ud9ttl03790qjx70wzwlc2pwwghcusvwju54qs0c800"
        >
          @stok</a
        >
        <div class=" flex flex-wrap whitespace-pre-wrap">
          {#if lumiSetting.get().showImg || loadImage}
            <img
              loading="lazy"
              class="object-contain"
              src="https://stok33.github.io/illust/lumis.webp"
              alt="lumi"
              width={400}
              height={400}
            />
          {:else}
            <button
              class="my-2 flex items-center w-fit px-2 py-1 max-w-full rounded-md bg-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 overflow-hidden h-fit"
              onclick={() => (loadImage = true)}>load images</button
            >
          {/if}
        </div>
      </div>
    </li>
    <li>
      <div class="list">{$_("others")}</div>
      <ul>
        <li>
          <div class="item flex flex-wrap gap-2 items-center">
            <Link
              href="https://tsukemonogit.github.io/luminostr/"
              className="flex gap-1 items-center underline"
              >{#snippet content()}
                <BriefcaseMedical />Luminostr
              {/snippet}
            </Link>
            <span class="text-sm">{$_("about.luminostr")}</span>
          </div>
        </li>
        <li>
          <div class="item">
            <Link
              href="https://github.com/TsukemonoGit/lumilumi/issues/new/choose"
              className="flex gap-1 items-center underline"
            >
              {#snippet content()}{$_("about.houkoku")}{/snippet}
            </Link>
          </div>
        </li>

        <li>
          <div class="item">
            <button
              onclick={handleClickShare}
              class="flex gap-1 items-center underline"
              >{$_("about.share")}<Share size="20" class="text-magnum-500 " /> Lumilumi</button
            >
          </div>
        </li>
        <li>
          <div class="item">
            <makibishi-component url={page.url.origin} hide-reaction-list={true}
            ></makibishi-component>
          </div>
        </li>
      </ul>
    </li>
  </ul>
</section>

<AlertDialog
  bind:openDialog={dialogOpen}
  onClickOK={() => onClickZap()}
  title="Zap to mono"
>
  {#snippet main()}
    <div class=" text-neutral-200">
      <div class="mt-4 rounded-md">
        <div class="pt-2 font-bold text-magnum-300 text-lg">amount</div>
        <input
          type="number"
          id="amount"
          class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500/75"
          placeholder="amount"
          bind:value={zapAmount}
        />
        <div class="pt-1 text-magnum-300 font-bold text-lg">comment</div>
        <input
          type="text"
          id="comment"
          class="h-10 w-full rounded-md px-3 py-2 border border-magnum-500/75"
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
  id={monoZap.eventTag[1]}
/>

<style lang="postcss">
  li {
    @apply my-4;
  }

  .title {
    display: flex;

    align-items: center;

    color: theme("colors.magnum.400");
    font-weight: 700;
    font-size: var(--text-xl);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    text-decoration: none;
  }
  .list {
    @apply font-bold  mt-6 mb-2 text-lg border-b border-magnum-500 p-1 text-magnum-500;
  }
  .item {
    @apply ml-4;
  }

  /* Reset */

  makibishi-component::part(button) {
    background-color: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    appearance: none;
  }

  makibishi-component::part(avatar-link) {
    text-decoration: none;
  }

  /* Theme */

  makibishi-component {
    display: inline-grid;

    grid-auto-flow: column;
    grid-template-rows: 32px;
    grid-template-columns: 32px 32px 1fr;
  }

  makibishi-component::part(button) {
    display: inline-grid;
    place-content: center;
    border: 1px solid;
    /*background-color: #fcfcff;*/
    border-inline-end: none;
    /* border-color: #c8c3ec;*/
    border-radius: 8px 0 0 8px;
    @apply bg-magnum-900/20 border border-magnum-600;
  }

  makibishi-component::part(button):not(:disabled):hover {
    /* background-color: #dceeff; */
    @apply bg-magnum-900/50;
  }

  makibishi-component::part(button):not(:disabled):active {
    /* background-color: #bdd4e9; */
    @apply bg-magnum-900/80;
  }

  makibishi-component::part(button):disabled {
    /* background-color: #cecece; */
    @apply bg-neutral-800;
  }

  makibishi-component::part(counter) {
    display: inline-grid;
    place-content: center;
    font-size: 11px;
    /* background-color: #f1efff; */
    border: 1px solid;
    border-inline-start: none;
    /* border-color: #c8c3ec; */
    border-radius: 0 8px 8px 0;
    @apply bg-neutral-800 border border-magnum-600 text-neutral-50;
  }

  makibishi-component::part(reaction-list) {
    display: inline-flex;
    padding-inline: 4px;
    user-select: none;
  }

  makibishi-component::part(reaction) {
    position: relative;
    display: inline-block;
    width: 26px;
    height: 32px;
  }

  makibishi-component::part(avatar-link) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  makibishi-component::part(avatar) {
    border-radius: 999px;
  }

  makibishi-component::part(reaction-content) {
    position: absolute;
    left: -2px;
    bottom: -2px;
    z-index: 2;
    display: inline-grid;
    place-content: center;
    width: 16px;
    height: 16px;
    background-color: white;
    border-radius: 999px;
    font-size: 10px;
  }

  makibishi-component::part(ellipsis) {
    padding-inline: 6px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
    /* background-color: theme("colors.neutral.800"); */
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  th,
  td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid theme("colors.neutral.600");
  }
  th {
    background-color: theme("colors.neutral.700");
    font-weight: bold;
  }
</style>
