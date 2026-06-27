<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { getDoukiList, getQueryRelays, toMuteList } from "$lib/func/settings";

  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import { mutes, nowProgress } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";
  import AddMute from "./AddMute.svelte";

  import MuteTabList from "./MuteTabList.svelte";
  import { writable } from "svelte/store";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { addToast } from "../Elements/Toast.svelte";
  import SyncCard from "./SyncCard.svelte";
  import { saveLocalStorage } from "$lib/func/storage";

  interface Props {
    pubkey: string;
  }

  let { pubkey = $bindable() }: Props = $props();
  //export let muteList: LumiMute | undefined;
  let dialogOpen: any = writable(false);
  async function handleClickMute(e: MouseEvent) {
    //  e.preventDefault();
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
      addToast({
        data: {
          title: "Error",
          description: "pubkey not found ",
          color: "bg-red-500",
        },
      });
      return;
    }
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      addToast({
        data: {
          title: "Error",
          description: "relay list not found ",
          color: "bg-red-500",
        },
      });
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
          saveLocalStorage(STORAGE_KEYS.LUMI_MUTE, JSON.stringify($mutes));
        } catch (error) {
          console.log("Failed to save");
        }
      }
    } else {
      addToast({
        data: {
          title: "Warning",
          description: "mute list not found ",
          color: "bg-red-500",
        },
      });
    }

    $nowProgress = false;
  }
</script>

<SyncCard
  onclickUpdate={handleClickMute}
  label={"Mute List"}
  updatedAt={$mutes ? formatAbsoluteDateFromUnix($mutes?.updated) : ""}
  viewable={$mutes ? true : false}
  onclickView={() => ($dialogOpen = true)}
/>

<Dialog open={dialogOpen} id={"mute"}>
  {#snippet main()}
    <div class="w-full h-[480px] max-h-[90vh] overflow-x-hidden">
      {#if $mutes}
        <AddMute />
        <MuteTabList />
      {/if}
    </div>
  {/snippet}
</Dialog>
