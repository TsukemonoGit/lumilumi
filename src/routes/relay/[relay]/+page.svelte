<script lang="ts">
  import { afterNavigate, beforeNavigate } from "$app/navigation";
  import RelayCard from "$lib/components/NostrElements/kindEvents/EventCard/RelayCard.svelte";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { onMount } from "svelte";
  import GlobalTimeline from "../../global/GlobalTimeline.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let relayUrl: string | undefined = $state();
  let isMount = false;
  onMount(() => {
    if (isMount) {
      return;
    }
    init();
  });
  afterNavigate((navigate) => {
    if (navigate.type === "form" || isMount) {
      return;
    }
    init();
  });

  beforeNavigate((navigate) => {
    if (navigate.type !== "form") {
      relayUrl = undefined;
    }
  });

  async function init() {
    isMount = true;
    setTimeout(() => {
      relayUrl = data.relay;

      isMount = false;
    }, 0);
  }
</script>

{#if relayUrl}
  <div class="rounded-md border border-magnum-500">
    <RelayCard url={relayUrl} write={false} read={false} />
  </div>

  <GlobalTimeline globalRelays={[relayUrl]} timelineQuery={[relayUrl]} />

  <div class="postWindow">
    <OpenPostWindow
      options={{
        tags: [],
        kind: 1,
      }}
    />
  </div>
{/if}
