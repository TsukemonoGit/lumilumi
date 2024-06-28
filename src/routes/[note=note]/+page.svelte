<script lang="ts">
  import NostrMain from "$lib/components/NostrMain.svelte";
  import SetSearchRelays from "$lib/components/NostrMainData/SetSearchRelays.svelte";
  import Note from "$lib/components/Note/Note.svelte";
  import { defaultRelays } from "$lib/stores/relays";
  import { queryClient } from "$lib/stores/stores";
  import { toRelaySet } from "$lib/stores/useRelaySet";

  export let data: {
    id: string;
    relays?: string[] | undefined;
    kind?: number | undefined;
    author?: string | undefined;
  };
</script>

<section>
  <NostrMain let:pubkey let:localRelays>
    <SetSearchRelays
      defaultRelays={localRelays.length > 0
        ? localRelays
        : toRelaySet($queryClient.getQueryData(["defaultRelay", pubkey]))}
      setRelayList={data.relays ?? defaultRelays}
      let:searchRelays
    >
      <div class="container break-words overflow-x-hidden">
        <Note id={data.id} />
      </div>
    </SetSearchRelays>
  </NostrMain>
</section>
