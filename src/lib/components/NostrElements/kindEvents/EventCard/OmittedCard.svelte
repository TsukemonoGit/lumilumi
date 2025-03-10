<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import Content from "../../content/Content.svelte";
  import SimpleMarkdown from "$lib/components/MarkdownItem/SimpleMarkdown.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import { get31990Ogp, replyedEvent } from "$lib/func/event";
  import OgpCard from "$lib/components/Elements/OgpCard.svelte";
  import ChannelTag from "../../content/ChannelTag.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import UserName from "../../user/UserName.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";

  interface Props {
    repostable: boolean;
    displayMenu: boolean;

    depth: number;
    tieKey: string | undefined;
    maxHeight: number | undefined;
    text: Nostr.Event;
  }

  let { repostable, displayMenu, depth, tieKey, maxHeight, text }: Props =
    $props();

  let deleted = $state(false);
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else}
  <div class="ml-6 text-sm opacity-80">
    {#if text && (text.kind === 1 || text.kind === 42 || text.kind === 4) && text.tags.length > 0}
      {@const { replyUsers } = replyedEvent(text.tags, text.kind)}
      {#if replyUsers.length > 0}
        <div
          class="my-1 text-xs text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-24 overflow-y-auto"
        >
          <ReplyTo
            >{#each replyUsers as user}
              {#if !displayMenu}<UserName pubhex={user} />{:else}
                <PopupUserName pubkey={user} {tieKey} />{/if}
            {/each}</ReplyTo
          >
        </div>
      {/if}
    {/if}
    {#if text.kind === 30023 || text.kind === 30024}<SimpleMarkdown
        {maxHeight}
        text={text.content ?? ""}
        tags={text.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />
    {:else if text.kind === 31990}
      {@const data = get31990Ogp(text)}
      {#if data}
        <OgpCard contents={data.ogp} url={data.url} />
      {:else}
        <Content
          {maxHeight}
          text={text.content ?? ""}
          tags={text.tags}
          {displayMenu}
          {depth}
          {repostable}
          {tieKey}
        />
      {/if}
    {:else}
      <Content
        text={text.content ?? ""}
        tags={text.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />{#if text.kind !== 1}{#if text.kind === 42}{@const heyaId =
            text.tags.find(
              (tag) => tag[0] === "e" && tag[3] === "root"
            )?.[1]}<ChannelTag {heyaId} {tieKey} />{:else}<span
            class="flex ml-auto hover:opacity-75 focus:opacity-50 text-neutral-300 text-sm"
            style="word-break: break-word;">kind:{text.kind}</span
          >{/if}{/if}
    {/if}
    {#if displayMenu}
      <NoteActionButtons note={text} {repostable} {tieKey} bind:deleted />{/if}
  </div>
{/if}
