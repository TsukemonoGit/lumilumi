<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { getDoukiList, getQueryRelays, toMuteList } from "$lib/func/settings";

  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";
  import { mutes, nowProgress, toastSettings } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import AddMute from "./AddMute.svelte";

  import MuteTabList from "./MuteTabList.svelte";
  import { writable } from "svelte/store";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";

  interface Props {
    pubkey: string;
  }

  let { pubkey = $bindable() }: Props = $props();
  //export let muteList: LumiMute | undefined;
  let dialogOpen: any = writable(false);
  async function handleClickMute() {
    const beforeList = $mutes?.event;
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
        !beforeList ||
        beforeList.pubkey !== pk.event.pubkey ||
        pk.event.created_at >= beforeList.created_at
      ) {
        $mutes = {
          list: await toMuteList(pk.event),
          updated: Math.floor(Date.now() / 1000),
          event: pk.event,
        };
        try {
          localStorage.setItem("lumiMute", JSON.stringify($mutes));
        } catch (error) {
          console.log("Failed to save");
        }
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
</script>

<button
  disabled={$nowProgress}
  class="h-10 ml-2 rounded-md bg-magnum-600 px-3 py-1 font-medium text-magnum-100 hover:opacity-75 active:opacity-50 disabled:opacity-25"
  onclick={handleClickMute}>Mute</button
><time class="ml-2"
  >{$_("settings.lastUpdated")}: {$mutes
    ? formatAbsoluteDateFromUnix($mutes?.updated)
    : ""}</time
>{#if $mutes}<button
    class="rounded-md border ml-2 p-1 m-1 border-magnum-600 font-medium text-magnum-100 hover:opacity-75 active:opacity-50"
    onclick={() => ($dialogOpen = true)}>view data</button
  >{/if}
<!--JSON no Dialog-->

<Dialog open={dialogOpen} id={"mute"}>
  {#snippet main()}
    <div class="w-full h-[480px] max-h-[90vh] overflow-x-hidden">
      {#if $mutes}
        <AddMute />
        <MuteTabList />
      {/if}
      {#if lumiSetting.get().pubkey}<a
          class="underline text-magnum-300 break-all ml-4 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            lumiSetting.get().pubkey
          )}/10000"
        >
          {$_("settings.nostviewstr.kind10000")}
        </a>{/if}
    </div>
  {/snippet}
</Dialog>
