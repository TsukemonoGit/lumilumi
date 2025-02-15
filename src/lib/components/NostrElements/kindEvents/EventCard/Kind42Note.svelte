<script lang="ts">
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";

  import * as Nostr from "nostr-typedef";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";
  import Content from "../../content/Content.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";
  import { replyedEvent } from "$lib/func/event";
  import ChannelTag from "../../content/ChannelTag.svelte";

  interface Props {
    thread: boolean;
    displayMenu: boolean;
    note: Nostr.Event;
    depth: number;
    repostable: boolean;
    tieKey: string | undefined;
    zIndex?: number;
  }

  let {
    thread,
    displayMenu,
    note,
    depth,
    repostable,
    tieKey,
    zIndex = 0,
  }: Props = $props();

  const heyaId = note.tags.find(
    (tag) => tag[0] === "e" && tag[3] === "root"
  )?.[1];

  let res = $derived(replyedEvent(note.tags, note.kind));
  let replyTag = $derived(
    res.replyTag && res.replyTag.length > 3 && res.replyTag[3] === "root"
      ? undefined
      : res.replyTag
  ); //rootは部屋ID
  let replyUsers = $derived(res.replyUsers);
  // const replyedEvent = (
  //   tags: string[][]
  // ): { replyID: string | undefined; replyUsers: string[] } => {
  //   const users = tags.reduce((acc, [tag, value]) => {
  //     if (tag === "p") {
  //       return [...acc, value];
  //     } else {
  //       return acc;
  //     }
  //   }, []);
  //   const IDs = tags?.filter((tag) => tag[0] === "e");
  //   const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
  //   //  console.log(root?.[1]);
  //   return {
  //     replyUsers: users,
  //     replyID: reply ? reply[1] : undefined,
  //   };
  // };

  const checkContentWarning = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "content-warning");
  };
  let warningTag = $derived(checkContentWarning(note.tags));
</script>

{#if replyUsers.length > 0}
  <div
    class="my-1 text-sm text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-12 overflow-y-auto"
  >
    <span class="text-sm text-neutral-50">To:</span>{#each replyUsers as user}
      {#if !displayMenu}<UserName pubhex={user} />{:else}
        <PopupUserName pubkey={user} {tieKey} />{/if}
    {/each}
  </div>
{/if}
{#if !thread && (replyTag || replyUsers.length > 0)}
  <Reply {replyTag} {displayMenu} depth={depth + 1} {repostable} {tieKey} />
  <!--<hr />-->
{/if}

<div class="relative">
  <Content
    {zIndex}
    maxHeight={256}
    text={note.content}
    tags={note.tags}
    {displayMenu}
    {depth}
    {repostable}
    {tieKey}
  />

  {#if warningTag}
    <WarningHide2 text={warningTag[1]} />
  {/if}
</div>

<ChannelTag {heyaId} {tieKey} />
{#if displayMenu}
  <NoteActionButtons {note} {repostable} {tieKey} />{/if}
