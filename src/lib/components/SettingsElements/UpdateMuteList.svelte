<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { getDoukiList, getQueryRelays, toMuteList } from "$lib/func/settings";
  import type { LumiMute } from "$lib/types";
  import { formatAbsoluteDate } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import { loginUser, nowProgress, toastSettings } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { _ } from "svelte-i18n";
  import AddMute from "./AddMute.svelte";
  import { X } from "lucide-svelte";
  import { createTabs } from "@melt-ui/svelte";
  import { crossfade } from "svelte/transition";
  import { cubicInOut } from "svelte/easing";
  import MuteTabList from "./MuteTabList.svelte";

  export let pubkey: string;
  export let muteList: LumiMute | undefined;
  let dialogOpen: any;
  async function handleClickMute() {
    try {
      const gotPubkey = await (
        window.nostr as Nostr.Nip07.Nostr
      ).getPublicKey();
      if (gotPubkey) {
        pubkey = gotPubkey;
      }
    } catch (error) {
      console.log(error);
    }
    if (pubkey === "") {
      $toastSettings = {
        title: "Error",
        description: "pubkey not found ",
        color: "bg-red-500",
      };
      return;
    }
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      $toastSettings = {
        title: "Error",
        description: "relay list not found ",
        color: "bg-red-500",
      };
      return;
    }
    $nowProgress = true;
    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10000], authors: [pubkey] },
    ];
    const pk = await getDoukiList(filters, relays);
    // console.log(event);

    console.log(pk);
    if (pk) {
      if (
        !muteList?.event ||
        muteList?.event.pubkey !== pk.event.pubkey ||
        pk.event.created_at >= muteList.event.created_at
      ) {
        muteList = {
          list: await toMuteList(pk.event),
          updated: Math.floor(Date.now() / 1000),
          event: pk.event,
        };
      }
    } else {
      $toastSettings = {
        title: "Warning",
        description: "mute list not found ",
        color: "bg-red-500",
      };
    }

    $nowProgress = false;
  }

  const {
    elements: { root, list, content, trigger },
    states: { value },
  } = createTabs({
    defaultValue: "tab-1",
  });
  const triggers = [
    { id: "tab-1", title: `Word (${muteList?.list.word.length})` },
    { id: "tab-2", title: `Hashtag (${muteList?.list.t.length})` },
    { id: "tab-3", title: `User (${muteList?.list.p.length})` },
    { id: "tab-4", title: `Event (${muteList?.list.e.length})` },
  ];
  const [send, receive] = crossfade({
    duration: 250,
    easing: cubicInOut,
  });
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  on:click={handleClickMute}>Mute</button
><time class="ml-2"
  >{$_("settings.lastUpdated")}: {muteList
    ? formatAbsoluteDate(muteList?.updated)
    : ""}</time
>{#if muteList}<button
    class="rounded-md border ml-2 p-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    on:click={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen}>
  <div slot="main" class="min-h-[29rem]">
    {#if muteList}
      <AddMute bind:muteList />
      <MuteTabList bind:muteList />
    {/if}<a
      class="underline text-magnum-300 break-all ml-4 text-sm"
      target="_blank"
      rel="noopener noreferrer"
      href="https://nostviewstr.vercel.app/{nip19.npubEncode($loginUser)}/10000"
    >
      {$_("settings.nostviewstr.kind10000")}
    </a>
  </div>
</Dialog>

<style lang="postcss">
  ul {
    @apply divide-y divide-neutral-600;
  }
  li {
    @apply flex  justify-between w-full my-0.5 items-center;
  }
  .remove {
    @apply rounded-full bg-magnum-600 w-6 h-6 flex my-auto justify-center items-center text-magnum-100 hover:opacity-75 active:opacity-50;
  }
</style>
