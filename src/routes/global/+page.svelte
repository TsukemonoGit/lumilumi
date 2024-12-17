<script lang="ts">
  import {
    loginUser,
    nowProgress,
    queryClient,
    tieMapStore,
    toastSettings,
  } from "$lib/stores/stores";

  import { promisePublishEvent, usePromiseReq } from "$lib/func/nostr";
  import { onMount, type SvelteComponent } from "svelte";

  import { _ } from "svelte-i18n";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import Settei from "./Settei.svelte";
  import { generateResultMessage } from "$lib/func/util";
  import GlobalDescription from "./GlobalDescription.svelte";
  import GlobalTimeline from "./GlobalTimeline.svelte";
  import { afterNavigate } from "$app/navigation";
  import { pipe } from "rxjs";
  import { latest } from "rx-nostr";
  import { page } from "$app/stores";
  import { writable, type Writable } from "svelte/store";

  import * as Nostr from "nostr-typedef";
  import { toGlobalRelaySet } from "$lib/stores/useGlobalRelaySet";
  import { unsucscribeGlobal } from "$lib/func/useReq";
  let compRef: SvelteComponent | undefined = $state();
  let openGlobalTimeline: boolean = $state(false);
  let globalRelays: Writable<string[]> = writable([]);
  const tieKey = "global";
  let timelineQuery = $derived(["global", "feed", tieKey]);

  const onClickSave = async (relays: string[]) => {
    $nowProgress = true;
    console.log(relays);
    const newTags = [["d", "global"]];
    relays.map((relay) => newTags.push(["relay", relay]));
    console.log(newTags);
    const { event, res } = await promisePublishEvent({
      content: "",
      tags: newTags,
      kind: 30002,
    });
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);

    let str = generateResultMessage(isSuccess, isFailed);
    console.log(str);

    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: str,
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };

    if (isSuccess.length > 0) {
      console.log("removeQueries");

      const relaylist = toGlobalRelaySet(event);
      if (relaylist.length > 0) {
        queryClient.setQueryData(["globalRelay", $loginUser], relaylist);
        $globalRelays = relaylist;
      }

      queryClient.removeQueries({
        queryKey: timelineQuery,
      });
      queryClient.removeQueries({
        queryKey: [...timelineQuery, "olderData"],
      });
      // tieMapStoreの中身にアクセス
      const globalTie = $tieMapStore[tieKey];

      // globalTieが存在し、Mapが正しい形式の場合にclear()を実行
      if (globalTie) {
        const [, seenOn] = globalTie;
        seenOn.clear();
      }
      $globalRelays = relays;
    }
    $nowProgress = false;
  };

  // run(() => {
  //   console.log(openGlobalTimeline);
  // });
  globalRelays.subscribe((value) => {
    if (value.length > 0) {
      console.log("global");
      openGlobalTimeline = false;

      setTimeout(() => {
        openGlobalTimeline = true;
      }, 1);
    }
  });
  let relaySettei = $state(false);
  onMount(async () => {
    //paramにリレーがあったらそれをセットする
    const params = new URLSearchParams(window.location.search);
    const relay = params.getAll("relay");
    console.log(relay);
    if (relay.length > 0) {
      $globalRelays = relay;
    } else {
      relaySettei = true;
      setGlobalRelay();
    }
  });

  afterNavigate(async (navigate) => {
    if (navigate.type === "form") {
      return;
    }
    $globalRelays = [];
    //paramにリレーがあったらそれをセットする
    const params = new URLSearchParams(window.location.search);
    const relay = params.getAll("relay");
    console.log(relay);
    if (relay.length > 0) {
      $globalRelays = relay;
    } else {
      relaySettei = true;
      setGlobalRelay();
    }
  });
  console.log($page);

  const setGlobalRelay = async () => {
    //すでにあるならデータをセットする
    const data: string[] | undefined = queryClient.getQueryData([
      "globalRelay",
      $loginUser,
    ]);

    if (data) {
      $globalRelays = data;
    } else {
      $nowProgress = true;
      const fetchRelays = await usePromiseReq(
        {
          filters: [
            {
              authors: [$loginUser],
              kinds: [30002],
              "#d": ["global"],
              limit: 1,
            },
          ] as Nostr.Filter[],
          operator: pipe(latest()),
        },
        undefined,
        undefined
      );
      $nowProgress = false;
      if (fetchRelays.length > 0) {
        const relaylist = toGlobalRelaySet(fetchRelays[0].event);
        if (relaylist.length > 0) {
          queryClient.setQueryData(["globalRelay", $loginUser], relaylist);
          $globalRelays = relaylist;
          // unsucscribeGlobal();
        }
      }
    }
  };
</script>

{#if !$loginUser && $globalRelays.length <= 0}
  <p class="whitespace-pre-wrap break-words p-2">
    {$_("global.explain")}

    <code class="block p-2 rounded">
      {`${$page.url.origin}${$page.url.pathname}?relay=[relayUrl]&relay=[relayUrl]`}
    </code>
    <br />
    <a
      href="/settings"
      class="underline text-magnum-400 hover:opacity-75"
      style="word-break: break-word;"
    >
      {$_("global.gotoSetting")}
    </a>
  </p>
{:else}
  <section class="w-full break-words overflow-hidden">
    {#if relaySettei}<!--パラムにリレーが設定されてるときはそれ表示させるだけ-->

      <Settei
        title={"Global"}
        relays={$globalRelays}
        {onClickSave}
        Description={GlobalDescription}
      />
    {/if}

    <!-- {#snippet children()} -->
    {#if openGlobalTimeline && $globalRelays.length > 0}
      <GlobalTimeline
        bind:this={compRef}
        globalRelays={$globalRelays}
        {timelineQuery}
      />
    {/if}
    <!-- {/snippet} -->
  </section>
{/if}
<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>

<style>
  section {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 0.6;
  }
</style>
