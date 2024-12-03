<script lang="ts">
  import Text from "$lib/components/NostrMainData/Text.svelte";

  import LatestEvent from "$lib/components/NostrMainData/LatestEvent.svelte";
  import ChannelMetadataLayout from "./ChannelMetadataLayout.svelte";
  import { encodetoNpub } from "$lib/func/encode";

  interface Props {
    id: string; //kind40 channel id
    handleClickToChannel?: (() => void) | undefined;
    linkButtonTitle: string;
    tieKey: string | undefined;
  }

  let {
    id,
    handleClickToChannel = undefined,
    linkButtonTitle,
    tieKey,
  }: Props = $props();

  let loadingText = $derived(encodetoNpub(id));
  //console.log(id);
</script>

<!--querykeyをTLとおなじにしとかないとTLでこのIDのイベント出てきたあとこれ取得しようとしたときに取得できなくなる的な-->
<Text queryKey={["timeline", id]} {id}>
  {#snippet loading()}
    <button onclick={handleClickToChannel} class="break-all"
      >loading {loadingText}
    </button>
  {/snippet}
  {#snippet nodata()}
    <button onclick={handleClickToChannel} class="break-all"
      >nodata {loadingText}
    </button>
  {/snippet}
  {#snippet error()}
    <button onclick={handleClickToChannel} class="break-all"
      >error {loadingText}
    </button>
  {/snippet}
  {#snippet content({ data: text })}
    <LatestEvent
      queryKey={["channel", "kind41", id]}
      filters={[{ kinds: [41], authors: [text.pubkey], limit: 1, "#e": [id] }]}
    >
      {#snippet loading()}
        <div class="w-full">
          <ChannelMetadataLayout
            {handleClickToChannel}
            {id}
            {linkButtonTitle}
            event={text}
            {tieKey}
          />
        </div>
      {/snippet}
      {#snippet nodata()}
        <div class="w-full">
          <ChannelMetadataLayout
            {handleClickToChannel}
            {id}
            {linkButtonTitle}
            event={text}
            {tieKey}
          />
        </div>
      {/snippet}
      {#snippet error()}
        <div class="w-full">
          <ChannelMetadataLayout
            {handleClickToChannel}
            {id}
            {linkButtonTitle}
            event={text}
            {tieKey}
          />
        </div>
      {/snippet}
      {#snippet children({ event })}
        <ChannelMetadataLayout
          {handleClickToChannel}
          {id}
          {linkButtonTitle}
          {event}
          {tieKey}
        />
      {/snippet}
    </LatestEvent>
  {/snippet}
</Text>
