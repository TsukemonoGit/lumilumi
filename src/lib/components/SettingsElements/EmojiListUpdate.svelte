<!--あとでようちぇっく-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import {
    createEmojiListFrom10030,
    getDoukiList,
    getQueryRelays,
  } from "$lib/func/settings";
  import { emojis, nowProgress, toastSettings } from "$lib/stores/stores";
  import { t as _ } from "@konemono/svelte5-i18n";

  import { createRxNostr } from "rx-nostr/src";

  import { verifier as cryptoVerifier } from "rx-nostr-crypto";

  import { loginUser, verifier } from "$lib/stores/globalRunes.svelte";

  interface Props {
    buttonClass?: string;
    children?: () => any;
  }
  let { buttonClass, children }: Props = $props();

  async function handleClickEmoji() {
    $nowProgress = true;
    let pubkey: string = "";
    const beforeEvent = $emojis?.event;

    try {
      if (!loginUser.get()) {
        const pubkey = await (
          window.nostr as Nostr.Nip07.Nostr
        )?.getPublicKey();
        if (pubkey) {
          loginUser.set(pubkey);
        }
      }
      if (loginUser.get()) {
        pubkey = loginUser.get();
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
      $nowProgress = false;
      return;
    }
    const relays = await getQueryRelays(pubkey);
    console.log(relays);
    if (!relays) {
      $toastSettings = {
        title: "Error",
        description: "relay list not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    }

    const filters: Nostr.Filter[] = [
      { limit: 1, kinds: [10030], authors: [pubkey] },
    ];
    const pk = await getDoukiList(filters, relays);
    if (!pk && !beforeEvent) {
      $toastSettings = {
        title: "Warning",
        description: "emoji list not found",
        color: "bg-red-500",
      };
      $nowProgress = false;
      return;
    }
    const kind10030event =
      !beforeEvent ||
      beforeEvent.pubkey !== pk.event.pubkey ||
      pk.event.created_at >= beforeEvent.created_at
        ? pk.event
        : beforeEvent;

    const rxNostr = createRxNostr({
      verifier: verifier.get() ?? cryptoVerifier,
    });
    const list = await createEmojiListFrom10030(
      kind10030event,
      rxNostr,
      relays
    );

    $emojis = {
      list: list,
      updated: Math.floor(Date.now() / 1000),
      event: kind10030event,
    };

    localStorage.setItem("lumiEmoji", JSON.stringify($emojis));
    rxNostr.dispose();
    $nowProgress = false;
  }
</script>

<button
  class={buttonClass ||
    "hover:opacity-75 active:opacity-50 disabled:opacity-25"}
  disabled={$nowProgress}
  onclick={handleClickEmoji}
  title="update emoji list"
  >{@render children?.()}
</button>
