<script lang="ts">
  import Text from "$lib/components/NostrMainData/Text.svelte";
  import { nip19 } from "nostr-tools";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import ChannelMetadataLayout from "./ChannelMetadataLayout.svelte";
  export let id: string; //kind40 channel id
  export let handleClickToChannel: (() => void) | undefined = undefined;
  export let linkButtonTitle: string;
  export let tieKey: string | undefined;
</script>

<!--querykeyをTLとおなじにしとかないとTLでこのIDのイベント出てきたあとこれ取得しようとしたときに取得できなくなる的な-->
<Text queryKey={["timeline", id]} {id} let:text>
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
    <div slot="loading" class="w-full">
      <ChannelMetadataLayout
        {handleClickToChannel}
        {id}
        {linkButtonTitle}
        event={text}
        {tieKey}
      />
    </div>
    <div slot="nodata" class="w-full">
      <ChannelMetadataLayout
        {handleClickToChannel}
        {id}
        {linkButtonTitle}
        event={text}
        {tieKey}
      />
    </div>
    <div slot="error" class="w-full">
      <ChannelMetadataLayout
        {handleClickToChannel}
        {id}
        {linkButtonTitle}
        event={text}
        {tieKey}
      />
    </div>
    <ChannelMetadataLayout
      {handleClickToChannel}
      {id}
      {linkButtonTitle}
      {event}
      {tieKey}
    />
  </LatestEvent>
</Text>
