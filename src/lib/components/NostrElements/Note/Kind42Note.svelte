<script lang="ts">
  import ProxyTag from "$lib/components/Elements/ProxyTag.svelte";
  import UserMenu from "$lib/components/Elements/UserMenu.svelte";
  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import { profile, formatAbsoluteDate } from "$lib/func/util";
  import { nip19 } from "nostr-tools";
  import * as Nostr from "nostr-typedef";
  import Content from "./Content.svelte";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import Reply from "./Reply.svelte";
  import { MessagesSquare } from "lucide-svelte";
  import Text from "$lib/components/NostrMainData/Text.svelte";
  import type { ChannelData } from "$lib/types";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined;
  const heyaId = note.tags.find(
    (tag) => tag[0] === "e" && tag[3] === "root"
  )?.[1];

  const replyedEvent = (
    tags: string[][]
  ): { replyID: string | undefined; replyUsers: string[] } => {
    const users = tags.reduce((acc, [tag, value]) => {
      if (tag === "p") {
        return [...acc, value];
      } else {
        return acc;
      }
    }, []);
    const IDs = tags?.filter((tag) => tag[0] === "e");
    const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
    //  console.log(root?.[1]);
    return {
      replyUsers: users,
      replyID: reply ? reply[1] : undefined,
    };
  };

  const checkContentWarning = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "content-warning");
  };

  const checkProxy = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "proxy");
  };

  const getContent = (text: Nostr.Event): ChannelData | undefined => {
    try {
      return JSON.parse(text.content) as ChannelData;
    } catch (error) {
      return undefined;
    }
  };
</script>

{#await replyedEvent(note.tags) then { replyID, replyUsers }}
  {#if replyID || replyUsers.length > 0}
    <Reply {replyID} {replyUsers} />
    <hr />
  {/if}
{/await}
{#await checkContentWarning(note.tags) then tag}
  <div class="relative">
    <div class=" max-h-64 overflow-y-auto">
      <Content text={note.content} tags={note.tags} />
    </div>
    {#if tag}
      <WarningHide2 text={tag[1]} />
    {/if}
  </div>
{/await}
{#if heyaId}
  <Text queryKey={["timeline", heyaId]} id={heyaId} let:text>
    <div slot="loading" class="flex justify-end"><MessagesSquare />kind:42</div>
    <div slot="nodata" class="flex justify-end"><MessagesSquare />kind:42</div>
    <div slot="error" class="flex justify-end"><MessagesSquare />kind:42</div>
    {#await getContent(text) then channelData}
      {#if channelData}
        <div class="flex justify-end">
          <MessagesSquare />{channelData.name}
        </div>
      {:else}
        <div class="flex justify-end">
          <MessagesSquare />kind:42
        </div>
      {/if}
    {/await}
  </Text>
{/if}
<NoteActionButtons {note} />
