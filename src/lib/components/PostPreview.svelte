<script lang="ts">
  import { replyedEvent } from "$lib/func/event";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import { queryClient } from "$lib/stores/stores";
  import type { EventPacket } from "rx-nostr";
  import Content from "./NostrElements/content/Content.svelte";
  import ProfileDisplay from "./NostrElements/kindEvents/EventCard/ProfileDisplay.svelte";
  import NoteComponent from "./NostrElements/kindEvents/layout/NoteComponent.svelte";
  import ReplyTo from "./NostrElements/kindEvents/layout/ReplyTo.svelte";
  import Reply from "./NostrElements/kindEvents/Reply.svelte";
  import ShowStatus from "./NostrElements/kindEvents/Status/ShowStatus.svelte";
  import UserName from "./NostrElements/user/UserName.svelte";
  import UserPopupMenu from "./NostrElements/user/UserPopupMenu.svelte";
  import * as Nostr from "nostr-typedef";

  interface Props {
    tags: string[][];
    text: string;
    onWarning: boolean;
    warningText: string;
    signPubkey: string | undefined;
    kind: number;
    quoteUsers: string[];
    replyUsers: string[];
  }
  let {
    tags,
    text,
    onWarning,
    warningText,
    signPubkey,
    kind,
    replyUsers,
    quoteUsers = $bindable(),
  }: Props = $props();
  const displayMenu = false;
  const mini = false;
  const depth = 0;
  const tieKey = undefined;
  const repostable = false;
  const zIndex = 50;
  const maxHeight = undefined;

  let metadata: Nostr.Event | undefined = $derived(
    signPubkey
      ? (
          queryClient?.getQueryData([
            "metadata",
            signPubkey,
          ]) as EventPacket | null
        )?.event
      : undefined
  );

  // Process reply tags
  let replyTag = $derived.by(() => {
    if ([1, 42, 4, 1111].includes(kind) && tags.length > 0) {
      const res = replyedEvent(tags, kind);

      return res.replyTag;
    }
    return undefined;
  });
</script>

{#if signPubkey}<NoteComponent
    warningText={onWarning ? warningText : undefined}
  >
    {#snippet icon()}
      <UserPopupMenu
        pubkey={signPubkey || ""}
        {metadata}
        size={40}
        displayMenu={false}
        depth={0}
        tieKey={undefined}
      />
    {/snippet}

    {#snippet name()}
      <ProfileDisplay pubkey={signPubkey || ""} {metadata} />
    {/snippet}

    {#snippet status()}
      {#if lumiSetting.get().showUserStatus}<ShowStatus
          pubkey={signPubkey}
          tieKey={undefined}
        />{/if}
    {/snippet}
    {#snippet replyUser()}
      {#if replyUsers.length > 0}
        <ReplyTo
          >{#each replyUsers as user}
            <UserName pubhex={user} />
          {/each}</ReplyTo
        >{/if}
    {/snippet}
    {#snippet reply()}
      {#if replyTag || replyUsers.length > 0}
        <Reply
          {replyTag}
          {displayMenu}
          depth={depth + 1}
          {repostable}
          {tieKey}
        />
      {/if}
    {/snippet}
    {#snippet content()}<!--ここのしょりによってたぐにpが追加されたりするのか？pがないnostr:noteとかにpをつけるquoteUsers に入れて渡す-->
      <Content
        {zIndex}
        {maxHeight}
        {text}
        {tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />
    {/snippet}
  </NoteComponent>
{/if}
