<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { usePromiseReq } from "$lib/func/nostr";
  import { nowProgress, queryClient, toastSettings } from "$lib/stores/stores";

  import type { QueryKey } from "@tanstack/svelte-query";
  import { onMount } from "svelte";
  import { pipe } from "rxjs";
  import { latest, type EventPacket } from "rx-nostr";
  import * as Nostr from "nostr-typedef";
  //import { samplemetadata, sample2 } from "./data";
  import { _ } from "svelte-i18n";

  import RelayCard from "$lib/components/NostrElements/Note/RelayCard.svelte";

  export let data: {
    pubkey: string;
  };
  // const data={pubkey:$page.params.npub};
  console.log(data.pubkey);

  let kind10002: Nostr.Event;
  let newKind10002: Nostr.EventParameters;
  const operator = pipe(latest());

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
      newKind10002 = {
        kind: 10002,
        tags:
          relayEvent.event.tags.filter((tag) => tag[0] === "r") ??
          ([] as string[][]),
        content: "",
      };
      $nowProgress = false;
    }
    $nowProgress = false;
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
</script>

<section class=" w-full">
  まだ
  {#if newKind10002 && newKind10002.tags}
    {#each newKind10002.tags as [r, url, rw], index}
      <div class=" overflow-hidden p-1">
        <RelayCard
          {url}
          read={!rw || rw === "read" ? true : false}
          write={!rw || rw === "write" ? true : false}
        />
      </div>
    {/each}
  {/if}
</section>
