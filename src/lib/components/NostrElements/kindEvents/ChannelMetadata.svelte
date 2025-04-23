<script lang="ts">
  import Text from "$lib/components/renderSnippets/nostr/Text.svelte";

  import LatestEvent from "$lib/components/renderSnippets/nostr/LatestEvent.svelte";
  import ChannelMetadataLayout from "./ChannelMetadataLayout.svelte";
  import { encodetoNpub } from "$lib/func/encode";
  import EmptyListCard from "./layout/EmptyListCard.svelte";

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
  const kind = 41;
  //console.log(id);
</script>

<!--querykeyをTLとおなじにしとかないとTLでこのIDのイベント出てきたあとこれ取得しようとしたときに取得できなくなる的な-->
<Text queryKey={["timeline", id]} {id}>
  {#snippet loading()}
    <EmptyListCard {handleClickToChannel} {linkButtonTitle} {id}>
      loading {loadingText}
    </EmptyListCard>
  {/snippet}
  {#snippet nodata()}
    <EmptyListCard {handleClickToChannel} {linkButtonTitle} {id}>
      nodata {loadingText}
    </EmptyListCard>
  {/snippet}
  {#snippet error()}
    <EmptyListCard {handleClickToChannel} {linkButtonTitle} {id}>
      error {loadingText}
    </EmptyListCard>
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
