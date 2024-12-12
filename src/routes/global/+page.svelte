<script lang="ts">
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";

  import { generateRandomId, promisePublishEvent } from "$lib/func/nostr";
  import { onMount, type SvelteComponent } from "svelte";

  import { _ } from "svelte-i18n";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import Settei from "./Settei.svelte";
  import { generateResultMessage } from "$lib/func/util";
  import GlobalDescription from "./GlobalDescription.svelte";
  import GlobalTimeline from "./GlobalTimeline.svelte";
  import { afterNavigate } from "$app/navigation";

  import type { EventPacket } from "rx-nostr";
  import { page } from "$app/stores";
  import { writable, type Writable } from "svelte/store";
  import SetGlobalRelays from "$lib/components/renderSnippets/nostr/relay/SetGlobalRelays.svelte";

  let compRef: SvelteComponent | undefined = $state();
  let openGlobalTimeline: boolean = $state(false);
  let globalRelays: Writable<string[]> = writable([]);
  let tieKey = $state(generateRandomId(2));
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
      queryClient.refetchQueries({
        queryKey: ["globalRelay", $loginUser],
      });

      queryClient.removeQueries({
        queryKey: timelineQuery,
      });
      queryClient.removeQueries({
        queryKey: [...timelineQuery, "olderData"],
      });
      tieKey = generateRandomId(2);
      $globalRelays = relays;
    }
    $nowProgress = false;
  };

  const setRelay = (relays: string[]) => {
    if (relays.length > 0) {
      $globalRelays = relays;
    }
    // openGlobalTimeline = true;
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

      //すでにあるならデータをセットする
      const data: EventPacket | undefined = queryClient.getQueryData([
        "globalRelay",
        $loginUser,
      ]);
      console.log("afterNavigate", data);
      if (data) {
        $globalRelays = (data.event.tags as string[][])
          .filter((tag: string[]) => tag[0] === "relay" && tag.length > 1)
          .map((tag: string[]) => tag[1]);
      }
    }
  });
  console.log($page);
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
      <SetGlobalRelays pubkey={$loginUser} relayChange={setRelay}
        >{#snippet loading()}
          <div class="w-full"></div>
        {/snippet}
        {#snippet error()}
          <div class="w-full"></div>
        {/snippet}
        {#snippet nodata()}
          <div class="w-full"></div>
        {/snippet}
        {#snippet children({ relays })}
          <!---->
        {/snippet}
      </SetGlobalRelays>

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
