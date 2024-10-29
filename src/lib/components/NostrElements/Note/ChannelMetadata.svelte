<script lang="ts">
  import Text from "$lib/components/NostrMainData/Text.svelte";
  import { nip19 } from "nostr-tools";
  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import ChannelMetadataLayout from "./ChannelMetadataLayout.svelte";
  import { encodetoNote, encodetoNpub } from "$lib/func/encode";

  export let id: string; //kind40 channel id
  export let handleClickToChannel: (() => void) | undefined = undefined;
  export let linkButtonTitle: string;
  export let tieKey: string | undefined;

  $: loadingText = encodetoNpub(id);
</script>

<!--querykeyをTLとおなじにしとかないとTLでこのIDのイベント出てきたあとこれ取得しようとしたときに取得できなくなる的な-->
<Text queryKey={["timeline", id]} {id} let:text>
  <button slot="loading" on:click={handleClickToChannel} class="break-all"
    >loading {loadingText}
  </button>
  <button slot="nodata" on:click={handleClickToChannel} class="break-all"
    >nodata {loadingText}
  </button>
  <button slot="error" on:click={handleClickToChannel} class="break-all"
    >error {loadingText}
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
