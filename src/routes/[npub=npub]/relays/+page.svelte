<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import {
    promisePublishEvent,
    setRelays,
    usePromiseReq,
  } from "$lib/func/nostr";
  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";

  import type { QueryKey } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import { pipe } from "rxjs";
  import { latest, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  //import { samplemetadata, sample2 } from "./data";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { X, Save } from "lucide-svelte";
  import { formatToEventPacket, generateResultMessage } from "$lib/func/util";

  import Metadata from "$lib/components/renderSnippets/nostr/Metadata.svelte";

  import { relayRegex2 } from "$lib/func/regex";

  import { SvelteMap } from "svelte/reactivity";
  import { loginUser, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { setRelaysByKind10002 } from "$lib/stores/useRelaySet";
  import type { LayoutData } from "../$types";
  import Kind10002Note from "$lib/components/NostrElements/kindEvents/EventCard/Kind10002Note.svelte";

  let { data }: { data: LayoutData } = $props();

  let deleted = $state(false);

  let kind10002: Nostr.Event | undefined = $state();
  let newTags: string[][] = $state([]);

  // Read/Write状態を保存するためのMap

  //svelte-ignore non_reactive_update
  let relayStates: SvelteMap<string, { read: boolean; write: boolean }> =
    new SvelteMap();

  let isError = $state(false);
  let isMount = false;
  let newRelay: string = $state("");
  let writeLen: number = $state(0);
  let readLen: number = $state(0);

  onMount(async () => {
    if (!isMount) {
      isMount = true;

      await init();
      isMount = false;
    }
  });

  afterNavigate(async (navigate) => {
    console.log("afterNavigate", navigate.type);

    if (navigate.type !== "form" && !isMount) {
      isMount = true;

      await init();
      isMount = false;
    }
  });

  async function init() {
    console.log("init");
    if (!queryClient) {
      console.log("error");
      return;
    }

    try {
      if (!loginUser.get()) {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        if (pubkey) {
          loginUser.set(pubkey);
        }
      }
      if (data.pubkey !== loginUser.get()) {
        $toastSettings = {
          title: "Error",
          description: "login pubkey ≠ sign pubkey",
          color: "bg-red-500",
        };
        isError = true;

        return;
      }
    } catch (error) {
      $toastSettings = {
        title: "Error",
        description: "failed to get sign pubkey",
        color: "bg-red-500",
      };
      isError = true;
      return;
    }
    $nowProgress = true;
    const relayEvent = await getQueryRelaysData(data.pubkey);
    console.log(relayEvent);
    if (relayEvent && relayEvent.event) {
      kind10002 = relayEvent.event;

      newTags = getTags(kind10002);
      // newKind10002.tagsの値に基づいてread/writeの初期値を設定

      setAllStates();

      $nowProgress = false;
    }
    $nowProgress = false;
  }
  function setAllStates() {
    relayStates = new SvelteMap();
    newTags.forEach(([r, url, rw], index) => {
      // "rw" の値を解析して初期値を設定
      relayStates.set(url, {
        read: !rw || rw === "read" ? true : false,
        write: !rw || rw === "write" ? true : false,
      });
    });
    updateRelayCounts();
  }

  function getTags(ev: Nostr.Event): string[][] {
    //タグの末尾を揃える
    return ev.tags.reduce((before, tag) => {
      if (tag[0] === "r" && tag.length > 1) {
        const relayURL = tag[1].endsWith("/") ? tag[1] : `${tag[1]}/`;
        tag[1] = relayURL;
        return [...before, tag];
      } else {
        return before;
      }
    }, [] as string[][]);
  }
  async function getQueryRelaysData(
    pubkey: string
  ): Promise<EventPacket | undefined> {
    const defaultRelayData: EventPacket[] | undefined =
      queryClient?.getQueryData(["defaultRelay", pubkey] as QueryKey);
    if (defaultRelayData && defaultRelayData.length > 0) {
      console.log(defaultRelayData[0]);
      return defaultRelayData[0];
    }
    try {
      const relaydata = await usePromiseReq(
        {
          filters: [{ kinds: [10002], authors: [pubkey], limit: 1 }],
          operator: pipe(),
        },
        undefined
      );
      //console.log(relaydata);
      if (relaydata && relaydata.length > 0) {
        queryClient.setQueryData(
          ["defaultRelay", pubkey],
          (oldData: any) => relaydata[0]
        );
        return relaydata[0];
      }
    } catch (error) {
      return;
    }
  }

  function handleClickRead(
    e: Event & { currentTarget: EventTarget & HTMLInputElement },
    url: string
  ) {
    const state = relayStates.get(url);
    if (state) {
      relayStates.set(url, {
        write: state.write,
        read: (e.target as HTMLInputElement).checked,
      });
    }
    updateRelayCounts();
  }

  function handleClickWrite(
    e: Event & { currentTarget: EventTarget & HTMLInputElement },
    url: string
  ) {
    const state = relayStates.get(url);
    if (state) {
      relayStates.set(url, {
        read: state.read,
        write: (e.target as HTMLInputElement).checked,
      });
    }
    updateRelayCounts();
  }

  function addNewRelay() {
    newRelay = newRelay.trim();
    if (newRelay === "") {
      return;
    }

    // ここでスラッシュを追加
    newRelay = !newRelay.endsWith("/") ? `${newRelay}/` : newRelay;

    if (!relayRegex2.test(newRelay)) {
      $toastSettings = {
        title: "Error",
        description: "Please check the relay URL format",
        color: "bg-orange-500",
      };
      return;
    }

    // Duplicate check
    console.log(newTags);
    if (newTags.find((tag) => tag[1] === newRelay)) {
      $toastSettings = {
        title: "Warning",
        description: "The entered relay is already included",
        color: "bg-orange-500",
      };
      return;
    }

    // 新しいリレーを追加
    // newTags.push(["r", newRelay]);
    newTags = [...newTags, ["r", newRelay]];
    relayStates.set(newRelay, { read: true, write: true });
    updateRelayCounts();
    newRelay = "";
  }

  function removeRelay(url: string) {
    newTags = newTags.filter((tag) => tag[1] !== url);
    relayStates.delete(url);
    updateRelayCounts();
  }

  function reset() {
    //
    newTags = kind10002 ? getTags(kind10002) : [];
    setAllStates();
    updateRelayCounts();
  }

  async function save() {
    // console.log(newTags);
    $nowProgress = true;
    // 新しいタグを生成
    newTags = relayStates.entries().reduce((before, [url, state]) => {
      if (state.read && state.write) {
        before.push(["r", url]);
      } else if (state.read) {
        before.push(["r", url, "read"]);
      } else if (state.write) {
        before.push(["r", url, "write"]);
      }
      return before;
    }, [] as string[][]);

    //relayStates　readもwriteもfalseのurlを削除）
    // relayStates から read も write も false の URL を削除
    relayStates.forEach((state, url) => {
      if (!state.read && !state.write) {
        relayStates.delete(url);
      }
    });
    if (newTags.length <= 0) {
      $toastSettings = {
        title: "Warning",
        description: "At least one new relay tag must be added.",
        color: "bg-orange-500",
      };
      $nowProgress = false;
      return;
    }
    console.log(newTags);
    const eventParam: Nostr.EventParameters = {
      content: "",
      tags: $state.snapshot(newTags),
      kind: 10002,
      pubkey: lumiSetting.get().pubkey,
    };
    const { event, res } = await promisePublishEvent(eventParam);
    const isSuccess = res.filter((item) => item.ok).map((item) => item.from);
    const isFailed = res.filter((item) => !item.ok).map((item) => item.from);

    let str = generateResultMessage(isSuccess, isFailed);
    console.log(str);

    $toastSettings = {
      title: isSuccess.length > 0 ? "Success" : "Failed",
      description: str,
      color: isSuccess.length > 0 ? "bg-green-500" : "bg-red-500",
    };
    checkDefaultRelay(event, isSuccess[0]);
    //reset押したときに戻るデータを更新
    updateRelayCounts();
    kind10002 = event;
    $nowProgress = false;
  }

  // 状態を更新する関数
  function updateRelayCounts() {
    // console.log(relayStates);
    writeLen = Array.from(relayStates.values()).filter(
      (state) => state.write
    ).length;
    readLen = Array.from(relayStates.values()).filter(
      (state) => state.read
    ).length;
    console.log("writeLen:", writeLen, "readLen:", readLen);
  }

  function checkDefaultRelay(ev: Nostr.Event, from: string) {
    if (lumiSetting.get().useRelaySet !== "0") {
      return;
    }
    //10002を使う設定にしてる場合デフォリレー更新
    queryClient.setQueryData(["defaultRelay", ev.pubkey], (oldData: any) =>
      formatToEventPacket(ev, from)
    );
    // イベントの形を整えてセット
    const relays = setRelaysByKind10002(ev);
    setRelays(relays);
  }
</script>

<section class="w-full">
  <div class="w-full border border-magnum-400 rounded-md p-1">
    {#if kind10002}
      <Metadata pubkey={data.pubkey} queryKey={["metadata", data.pubkey]}>
        {#snippet loading()}
          {#if kind10002}<Kind10002Note
              note={kind10002}
              depth={0}
              repostable={false}
              {deleted}
            />{/if}
        {/snippet}
        {#snippet nodata()}
          {#if kind10002}<Kind10002Note
              note={kind10002}
              depth={0}
              repostable={false}
              {deleted}
            />{/if}
        {/snippet}
        {#snippet error()}
          {#if kind10002}
            <Kind10002Note
              note={kind10002}
              depth={0}
              repostable={false}
              {deleted}
            />{/if}
        {/snippet}
        {#snippet content({ metadata })}
          {#if kind10002}
            <Kind10002Note
              note={kind10002}
              depth={0}
              repostable={false}
              {deleted}
              {metadata}
            />{/if}{/snippet}
      </Metadata>
    {/if}

    <table>
      <thead>
        <tr>
          <th class="text-center"
            >relay
            <div class=" text-xs font-normal">{newTags.length}</div></th
          ><th class="text-center"
            >read
            <div class=" text-xs font-normal">
              {readLen}
            </div></th
          ><th class="text-center"
            >write
            <div class=" text-xs font-normal">
              {writeLen}
            </div></th
          ><th class="text-center"></th>
        </tr></thead
      ><tbody>
        {#each newTags as [r, url, rw], index}
          <tr>
            <td class="text-left break-all">{url} </td>
            <td class="text-center"
              ><input
                type="checkbox"
                checked={relayStates.get(url)?.read}
                onchange={(e) => handleClickRead(e, url)}
              /></td
            >
            <td class="text-center"
              ><input
                type="checkbox"
                checked={relayStates.get(url)?.write}
                onchange={(e) => handleClickWrite(e, url)}
              /></td
            ><td
              ><button
                class="m-auto h-6 w-6 flex justify-center items-center
            rounded-full text-magnum-800 bg-magnum-100
            hover:opacity-75 hover:bg-magnum-200 active:bg-magnum-300 disabled:opacity-25"
                disabled={isError}
                onclick={() => removeRelay(url)}><X size={20} /></button
              ></td
            >
          </tr>
        {/each}</tbody
      >
    </table>
    <div class="mt-2 flex items-center w-full">
      <input
        id="relay"
        type="text"
        class="flex-grow h-10 rounded-md border border-magnum-300 px-1 leading-none text-zinc-100 disabled:opacity-25"
        disabled={isError}
        placeholder="wss://"
        bind:value={newRelay}
      />
      <button
        class="h-10 ml-2 rounded-md bg-magnum-600 px-6 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 w-fit disabled:opacity-25"
        onclick={addNewRelay}
        disabled={$nowProgress || isError}
      >
        Add
      </button>
    </div>
  </div>
  <div class="w-full flex gap-2 my-8">
    <button
      class=" rounded-md bg-magnum-600 w-24 h-10 flex justify-center items-center gap-1 font-bold text-magnum-100 hover:bg-magnum-900 active:opacity-50 disabled:opacity-25"
      disabled={$nowProgress || isError}
      onclick={save}
    >
      <Save />Save
    </button><button
      class=" rounded-md bg-magnum-200 w-20 h-10 font-medium text-magnum-800 hover:bg-magnum-500 active:opacity-50 disabled:opacity-25"
      disabled={$nowProgress || isError}
      onclick={reset}
    >
      Reset
    </button>
  </div>
</section>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    font-size: 16px;
    text-align: left;
    border: 1px solid rgb(var(--color-magnum-600) / 0.5);
  }

  th,
  td {
    padding: 6px;
    border: 1px solid rgb(var(--color-magnum-600) / 0.5);
  }
  tr:hover {
    background-color: theme("colors.neutral.800");
  }
</style>
