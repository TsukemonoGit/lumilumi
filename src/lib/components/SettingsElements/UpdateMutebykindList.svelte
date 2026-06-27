<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    getMuteByList,
    getMutebykindList,
    getQueryRelays,
  } from "$lib/func/settings";
  import { formatAbsoluteDateFromUnix } from "$lib/func/util";
  import * as nip19 from "nostr-tools/nip19";
  import { mutebykinds, nowProgress } from "$lib/stores/stores";
  import Dialog from "../Elements/Dialog.svelte";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { eventKinds } from "$lib/func/kinds";
  import { locale } from "@konemono/svelte5-i18n";

  import { writable, type Writable } from "svelte/store";
  import { loginUser, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { STORAGE_KEYS } from "$lib/func/localStorageKeys";
  import { addToast } from "../Elements/Toast.svelte";
  import SyncCard from "./SyncCard.svelte";
  import { saveLocalStorage } from "$lib/func/storage";

  interface Props {
    pubkey: string;
  }

  let { pubkey = $bindable() }: Props = $props();
  // export let mutebykindList: LumiMuteByKind | undefined = undefined;

  // svelte-ignore non_reactive_update
  let dialogOpen: Writable<boolean> = writable(false);
  async function handleClickMuteByKind() {
    const beforeList = $mutebykinds?.list;
    try {
      if (!loginUser.value) {
        const gpubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        if (gpubkey) {
          loginUser.value = gpubkey;
        }
      }
      if (loginUser.value) {
        pubkey = loginUser.value;
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
      $nowProgress = false;
      return;
    }
    const relays = await getQueryRelays(pubkey);

    if (!relays) {
      addToast({
        data: {
          title: "Error",
          description: "relay list not found ",
          color: "bg-red-500",
        },
      });
      $nowProgress = false;
      return;
    }
    $nowProgress = true;
    const filters: Nostr.Filter[] = [{ kinds: [30007], authors: [pubkey] }];
    const pk = await getMutebykindList(filters, relays);
    console.log(pk);
    if (pk && pk.length > 0) {
      $mutebykinds = {
        list: await getMuteByList(
          pk.map((p) => p.event),
          beforeList,
        ),
        updated: Math.floor(Date.now() / 1000),
      };
      try {
        saveLocalStorage(
          STORAGE_KEYS.LUMI_MUTE_BY_KIND,
          JSON.stringify($mutebykinds),
        );
      } catch (error) {
        console.log("Failed to save");
      }
    } else {
      addToast({
        data: {
          title: "Warning",
          description: "mute by kind list not found ",
          color: "bg-red-500",
        },
      });
    }
    $nowProgress = false;
  }
</script>

<SyncCard
  onclickUpdate={handleClickMuteByKind}
  label={"Mute By Kind"}
  updatedAt={$mutebykinds
    ? formatAbsoluteDateFromUnix($mutebykinds?.updated)
    : ""}
  viewable={$mutebykinds ? true : false}
  onclickView={() => ($dialogOpen = true)}
/>

<!--JSON no Dialog-->
<Dialog bind:open={dialogOpen} id={"mutebykind"}>
  {#snippet main()}
    <div class="w-full h-[480px] max-h-[90vh] overflow-x-hidden">
      {#if $mutebykinds}
        <h2 class="m-0 text-lg font-medium">Mute By Kind</h2>
        {#each $mutebykinds.list as list, index}
          {#if list.list && list.list.length > 0}
            {@const kindstr = eventKinds.get(list.kind)}
            <h2 class="m-0 text-lg font-medium">
              kind: {list.kind}
              {kindstr ? `(${kindstr[$locale === "ja" ? "ja" : "en"]})` : ""}
            </h2>
            <ul
              class="break-all whitespace-pre-wrap break-words overflow-auto border rounded-md border-magnum-500/50 p-2 max-h-[15vh]"
            >
              {#each list.list as p, index}
                <li>{index}, {nip19.npubEncode(p)}</li>
              {/each}
            </ul>
          {/if}
        {/each}
      {/if}

      {#if lumiSetting.get().pubkey}<a
          class="underline text-magnum-300 break-all ml-4 text-sm"
          target="_blank"
          rel="noopener noreferrer"
          href="https://nostviewstr.vercel.app/{nip19.npubEncode(
            lumiSetting.get().pubkey,
          )}/30007"
          >{$_("settings.nostviewstr.kind30007")}
        </a>{/if}
    </div>
  {/snippet}
</Dialog>
