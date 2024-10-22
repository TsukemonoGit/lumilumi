<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { usePromiseReq } from "$lib/func/nostr";
  import {
    loginUser,
    nowProgress,
    queryClient,
    toastSettings,
  } from "$lib/stores/stores";

  import type { QueryKey } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import { pipe } from "rxjs";
  import { latest, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  //import { samplemetadata, sample2 } from "./data";
  import { _ } from "svelte-i18n";

  import { X } from "lucide-svelte";
  import { writable } from "svelte/store";

  export let data: {
    pubkey: string;
  };
  // const data={pubkey:$page.params.npub};
  console.log(data.pubkey);

  let kind10002: Nostr.Event;
  let newTags = writable<string[][]>([]);

  // Read/Write状態を保存するためのMap
  const relayStates: Map<string, { read: boolean; write: boolean }> = new Map();

  let isError = false;
  let isMount = false;
  onMount(async () => {
    if (!isMount) {
      isMount = true;

      await init();
      isMount = false;
    }
  });

  afterNavigate(async (navigate) => {
    console.log("afterNavigate", navigate.type);

    if (!isMount) {
      isMount = true;

      await init();
      isMount = false;
    }
  });

  async function init() {
    if (!$queryClient) {
      console.log("error");
      return;
    }

    try {
      const signPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      )?.getPublicKey();
      if (data.pubkey !== signPubkey) {
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

      $newTags = getTags(kind10002);
      // newKind10002.tagsの値に基づいてread/writeの初期値を設定

      $newTags.forEach(([r, url, rw], index) => {
        // "rw" の値を解析して初期値を設定
        relayStates.set(url, {
          read: !rw || rw === "read" ? true : false,
          write: !rw || rw === "write" ? true : false,
        });
      });
      $nowProgress = false;
    }
    $nowProgress = false;
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
      $queryClient?.getQueryData(["defaultRelay", pubkey] as QueryKey);
    if (defaultRelayData) {
      // console.log(defaultRelayData);
      return defaultRelayData[0];
    }
    try {
      const relaydata = await usePromiseReq(
        {
          filters: [{ kinds: [10002], authors: [pubkey], limit: 1 }],
          operator: pipe(latest()),
        },
        undefined
      );
      //console.log(relaydata);
      if (relaydata && relaydata.length > 0) {
        $queryClient.setQueryData(
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

  let newRelay: string = "";

  function addNewRelay() {
    newRelay = newRelay.trim();
    if (newRelay === "") {
      return;
    }

    // ここでスラッシュを追加
    newRelay = !newRelay.endsWith("/") ? `${newRelay}/` : newRelay;

    if (!/^wss?:\/\/\S+\/?$/.test(newRelay)) {
      $toastSettings = {
        title: "Error",
        description: "Please check the relay URL format",
        color: "bg-orange-500",
      };
      return;
    }

    // Duplicate check
    console.log($newTags);
    if ($newTags.find((tag) => tag[1] === newRelay)) {
      $toastSettings = {
        title: "Warning",
        description: "The entered relay is already included",
        color: "bg-orange-500",
      };
      return;
    }

    // 新しいリレーを追加
    // $newTags.push(["r", newRelay]);
    newTags.update((before) => {
      return [...before, ["r", newRelay]];
    });
    relayStates.set(newRelay, { read: true, write: true });
    updateRelayCounts();
  }

  function removeRelay(url: string) {
    newTags.update((before) => {
      return before.filter((tag) => tag[1] !== url);
    });
    relayStates.delete(url);
    updateRelayCounts();
  }

  function reset() {
    //
    $newTags = getTags(kind10002);
    updateRelayCounts();
  }

  function save() {
    console.log($newTags);

    // 新しいタグを生成
    $newTags = relayStates.entries().reduce((before, [url, state]) => {
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
    console.log($newTags);
    const eventParam: Nostr.EventParameters = {
      content: "",
      tags: $newTags,
      kind: 10002,
      pubkey: $loginUser,
    };
  }
  let writeLen: number = 0;
  let readLen: number = 0;
  // $: if (relayStates) {
  //   writeLen = Array.from(relayStates.values()).filter(
  //     (state) => state.write
  //   ).length;
  // }

  // $: console.log(writeLen);
  // $: readLen = Array.from(relayStates.values()).filter(
  //   (state) => state.read
  // ).length;
  $: if ($newTags) {
    updateRelayCounts();
  }
  // 状態を更新する関数
  function updateRelayCounts() {
    writeLen = Array.from(relayStates.values()).filter(
      (state) => state.write
    ).length;
    readLen = Array.from(relayStates.values()).filter(
      (state) => state.read
    ).length;
    console.log("writeLen:", writeLen, "readLen:", readLen);
  }
</script>

<section class="w-full">
  <table>
    <tr>
      <th class="text-center"
        >relay
        <div class=" text-xs font-normal">{$newTags.length}</div></th
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
    </tr>
    {#each $newTags as [r, url, rw], index}
      <tr>
        <td class="text-left break-all"
          >{url}
          <!-- <RelayCard
              {url}
              read={readStates[index]}
              write={writeStates[index]}
            /> -->
        </td>
        <td class="text-center"
          ><input
            type="checkbox"
            checked={relayStates.get(url)?.read}
            on:change={(e) => handleClickRead(e, url)}
          /></td
        >
        <td class="text-center"
          ><input
            type="checkbox"
            checked={relayStates.get(url)?.write}
            on:change={(e) => handleClickWrite(e, url)}
          /></td
        ><td
          ><button
            class="m-auto h-6 w-6 flex justify-center items-center
            rounded-full text-magnum-800 bg-magnum-100
            hover:opacity-75 hover:bg-magnum-200 active:bg-magnum-300"
            on:click={() => removeRelay(url)}><X size={20} /></button
          ></td
        >
      </tr>
    {/each}
  </table>
  <div class="mt-2 flex items-center w-full">
    <input
      type="text"
      class="flex-grow h-10 rounded-md border border-magnum-300 px-1 leading-none text-zinc-100"
      placeholder="wss://"
      bind:value={newRelay}
    />
    <button
      class="h-10 ml-2 rounded-md bg-magnum-600 px-6 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 w-fit"
      on:click={addNewRelay}
    >
      Add
    </button>
  </div>
  <div class="flex">
    <button
      class="h-10 ml-2 rounded-md bg-magnum-600 px-6 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 w-fit"
      on:click={reset}
    >
      Reset
    </button><button
      class="h-10 ml-2 rounded-md bg-magnum-600 px-6 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 w-fit"
      on:click={save}
    >
      Save
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
    border: 1px solid theme("colors.magnum.300");
  }

  th,
  td {
    padding: 6px;
    border: 1px solid theme("colors.magnum.300");
  }
  tr:hover {
    background-color: theme("colors.neutral.800");
  }
</style>
