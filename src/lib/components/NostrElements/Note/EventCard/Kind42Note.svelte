<script lang="ts">
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";

  import { MessagesSquare } from "lucide-svelte";
  import Text from "$lib/components/NostrMainData/Text.svelte";
  import type { ChannelData } from "$lib/types";
  import { getRelaysById } from "$lib/func/nostr";
  import { goto } from "$app/navigation";

  import PopupUserName from "$lib/components/Elements/PopupUserName.svelte";
  import Content from "../Content.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import UserName from "../UserName.svelte";
  import Reply from "../Reply.svelte";
  import { replyedEvent } from "$lib/func/event";
  import ChannelTag from "./ChannelTag.svelte";

  export let thread: boolean;
  export let displayMenu: boolean;
  export let note: Nostr.Event;
  export let depth: number;
  export let repostable: boolean;
  export let tieKey: string | undefined;

  const heyaId = note.tags.find(
    (tag) => tag[0] === "e" && tag[3] === "root"
  )?.[1];

  $: res = replyedEvent(note.tags);
  $: replyTag =
    res.replyTag && res.replyTag.length > 3 && res.replyTag[3] === "root"
      ? undefined
      : res.replyTag; //rootは部屋ID
  $: replyUsers = res.replyUsers;
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
  $: warningTag = checkContentWarning(note.tags);
</script>

{#if replyUsers.length > 0}
  <div
    class="my-1 text-sm text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-24 overflow-y-auto"
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
  <div class=" max-h-64 overflow-y-auto overflow-x-auto">
    <Content
      text={note.content}
      tags={note.tags}
      {displayMenu}
      {depth}
      {repostable}
      {tieKey}
    />
  </div>
  {#if warningTag}
    <WarningHide2 text={warningTag[1]} />
  {/if}
</div>

<ChannelTag {heyaId} {tieKey} />
{#if displayMenu}
  <NoteActionButtons {note} {repostable} {tieKey} />{/if}
