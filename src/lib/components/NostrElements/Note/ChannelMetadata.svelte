<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Text from "$lib/components/NostrMainData/Text.svelte";
  import { nip19 } from "nostr-tools";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import ChannelMetadataLayout from "./ChannelMetadataLayout.svelte";
  export let id: string; //kind40 channel id
  export let handleClickToChannel: (() => void) | undefined = undefined;
</script>

<Text queryKey={["channel", "kind40", id]} {id} let:text>
  <button slot="loading" on:click={handleClickToChannel} class="break-all"
    >loading {nip19.noteEncode(id)}
  </button>
  <button slot="nodata" on:click={handleClickToChannel} class="break-all"
    >nodata {nip19.noteEncode(id)}
  </button>
  <button slot="error" on:click={handleClickToChannel} class="break-all"
    >error {nip19.noteEncode(id)}
  </button>
  <LatestEvent
    queryKey={["channel", "kind41", id]}
    filters={[{ kinds: [41], authors: [text.pubkey], limit: 1, "#e": [id] }]}
    let:event
  >
    <div slot="loading">
      <ChannelMetadataLayout {handleClickToChannel} {id} event={text} />
    </div>
    <div slot="nodata">
      <ChannelMetadataLayout {handleClickToChannel} {id} event={text} />
    </div>
    <div slot="error">
      <ChannelMetadataLayout {handleClickToChannel} {id} event={text} />
    </div>
    <ChannelMetadataLayout {handleClickToChannel} {id} {event} />
  </LatestEvent>
</Text>
