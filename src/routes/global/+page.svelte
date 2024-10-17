<script lang="ts">
  import SetGlobalRelays from "$lib/components/NostrMainData/SetGlobalRelays.svelte";

  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";

  import { generateRandomId, promisePublishEvent } from "$lib/func/nostr";
  import { onMount, SvelteComponent } from "svelte";

  import { _ } from "svelte-i18n";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";

  import Settei from "./Settei.svelte";
  import { generateResultMessage } from "$lib/func/util";
  import GlobalDescription from "./GlobalDescription.svelte";
  import GlobalTimeline from "./GlobalTimeline.svelte";
  import { afterNavigate } from "$app/navigation";
  import type { QueryKey } from "@tanstack/svelte-query";

  import type { EventPacket } from "rx-nostr";

  let compRef: SvelteComponent;
  let openGlobalTimeline: boolean;
  let globalRelays: string[] = [];
  let timelineQuery: QueryKey = ["global", "feed", generateRandomId(2)];
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
      $queryClient.refetchQueries({
        queryKey: ["globalRelay", $loginUser],
      });
      timelineQuery = ["global", "feed", generateRandomId(2)];
      $queryClient.removeQueries({
        queryKey: timelineQuery,
      });
      $queryClient.removeQueries({
        queryKey: [...timelineQuery, "olderData"],
      });
      globalRelays = relays;
    }
    $nowProgress = false;
  };

  const setRelay = (event: { detail: { relays: string[] } }) => {
    console.log("setRelay", event);
    if (event.detail.relays.length > 0) {
      globalRelays = event.detail.relays;
    }
    // openGlobalTimeline = true;
  };
  $: console.log(openGlobalTimeline);
  $: if (globalRelays.length > 0) {
    console.log("global");
    openGlobalTimeline = false;

    setTimeout(() => {
      openGlobalTimeline = true;
    }, 1);
  }
  let relaySettei = false;
  onMount(async () => {
    //paramにリレーがあったらそれをセットする
    const params = new URLSearchParams(window.location.search);
    const relay = params.getAll("relay");
    console.log(relay);
    if (relay.length > 0) {
      globalRelays = relay;
    } else {
      relaySettei = true;
    }
  });

  afterNavigate(async () => {
    //paramにリレーがあったらそれをセットする
    const params = new URLSearchParams(window.location.search);
    const relay = params.getAll("relay");
    console.log(relay);
    if (relay.length > 0) {
      globalRelays = relay;
    } else {
      relaySettei = true;

      //すでにあるならデータをセットする
      const data: EventPacket | undefined = $queryClient.getQueryData([
        "globalRelay",
        $loginUser,
      ]);
      console.log("afterNavigate", data);
      if (data) {
        globalRelays = (data.event.tags as string[][])
          .filter((tag: string[]) => tag[0] === "relay" && tag.length > 1)
          .map((tag: string[]) => tag[1]);
      }
    }
  });
</script>

<svelte:head>
  <title>Lumilumi-Global</title>
  <meta property="og:description" content="Global" />
  <meta name="description" content="Global" />
</svelte:head>

<section class="w-full break-words overflow-hidden">
  {#if relaySettei}<!--パラムにリレーが設定されてるときはそれ表示させるだけ-->
    <SetGlobalRelays pubkey={$loginUser} let:relays on:relayChange={setRelay}
      ><div slot="loading" class="w-full"></div>
      <div slot="error" class="w-full"></div>
      <div slot="nodata" class="w-full"></div>
    </SetGlobalRelays>

    <Settei
      title={"Global"}
      relays={globalRelays}
      {onClickSave}
      Description={GlobalDescription}
    />
  {/if}

  {#if openGlobalTimeline && globalRelays.length > 0}
    <GlobalTimeline bind:this={compRef} {globalRelays} {timelineQuery} />
  {/if}
</section>

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
