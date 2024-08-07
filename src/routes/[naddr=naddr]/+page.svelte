<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import Metadata from "$lib/components/NostrMainData/Metadata.svelte";

  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { setRelays, setTieKey } from "$lib/func/nostr";
  import { defaultRelays } from "$lib/stores/stores";
  import * as Nostr from "nostr-typedef";

  import { onMount } from "svelte";
  import EventCardNaddr from "./EventCardNaddr.svelte";

  export let data: {
    identifier: string;
    pubkey: string;
    kind: number;
    relays?: string[] | undefined;
  };
  const atag = `${data.kind}:${data.pubkey}${data.identifier}`;
  const filters: Nostr.Filter[] = [
    { "#d": [data.identifier], kinds: [data.kind], authors: [data.pubkey] },
  ];
  console.log(filters);
  let amount = 50;
  let viewIndex = 0;
  const tieKey = "naddr";
  let loading = true;

  let isOnMount = false;
  let since: number | undefined = undefined;

  onMount(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });
  afterNavigate(() => {
    if (!isOnMount) {
      isOnMount = true;
      init();

      isOnMount = false;
    }
  });

  async function init() {
    since = undefined;
    setTieKey(tieKey);
    if ($defaultRelays) {
      setRelays($defaultRelays);
    } else if (!$defaultRelays && data.relays) {
      setRelays(data.relays);
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>Lumilumi-Naddr</title>
  <meta property="og:description" content="Naddr" />
  <meta name="description" content="Naddr" />
</svelte:head>
{#if loading}
  loading
{:else}
  <section class="container mb-20">
    <LatestEvent queryKey={["naddr", atag]} {filters} let:event>
      <div slot="loading">loading</div>
      <div slot="error">error</div>
      <div slot="nodata">nodata</div>

      <Metadata
        queryKey={["metadata", event.pubkey]}
        pubkey={event.pubkey}
        let:metadata
      >
        <div slot="loading">
          <EventCardNaddr note={event} status="loading" maxHeight={"none"} />
        </div>
        <div slot="nodata">
          <EventCardNaddr note={event} status="nodata" maxHeight={"none"} />
        </div>
        <div slot="error">
          <EventCardNaddr note={event} status="error" maxHeight={"none"} />
        </div>
        <EventCardNaddr {metadata} note={event} maxHeight={"none"} />
      </Metadata>
    </LatestEvent>
  </section>
  <div class="postWindow">
    <OpenPostWindow
      options={{
        tags: [],
        kind: 1,
      }}
    />
  </div>
{/if}
