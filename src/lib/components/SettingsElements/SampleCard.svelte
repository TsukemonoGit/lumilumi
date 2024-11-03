<script lang="ts">
  import type { Profile } from "$lib/types";
  import { name } from "@melt-ui/svelte";
  import UserAvatar from "../Elements/UserAvatar.svelte";
  import * as Nostr from "nostr-typedef";
  import { page } from "$app/stores";

  import Content from "../NostrElements/Note/Content.svelte";

  import SeenonIcons from "../NostrElements/Note/SeenonIcons.svelte";

  import DisplayName from "../Elements/DisplayName.svelte";
  import { clientTag, datetime, formatAbsoluteDate } from "$lib/func/util";

  import SampleNoteActionButtons from "./SampleNoteActionButtons.svelte";
  import { TrendingUp } from "lucide-svelte";
  import { parseEmojiText } from "$lib/func/displayname";
  import CustomEmoji from "../NostrElements/Note/content/CustomEmoji.svelte";
  import Avatar from "svelte-boring-avatars";

  export let showImg: boolean;
  export let showUserStatus: boolean;
  export let showClientTag: boolean;
  export let showRelayIcon: boolean;
  export let showReactioninTL: boolean;
  const note: Nostr.Event = {
    id: "",
    sig: "",
    pubkey: "aaa",
    content: "hello nostr.\nThis is a sample view",
    tags: [clientTag],
    created_at: 0,
    kind: 1,
  };
  const prof: Profile = {
    name: "name",
    display_name: "displayName",
    picture: `${$page.url.origin}/ogp.webp`,
  };
  const metadata: Nostr.Event = {
    id: "",
    sig: "",
    pubkey: "aaa",
    content: JSON.stringify(prof),
    tags: [],
    created_at: 0,
    kind: 0,
  };
  const status: Nostr.Event = {
    id: "",
    sig: "",
    pubkey: "aaa",
    content: "my status :ogp:",
    tags: [
      ["d", "general"],
      ["emoji", "ogp", `${$page.url.origin}/ogp.webp`],
    ],
    created_at: 0,
    kind: 30315,
  };
  const tieKey = undefined;
  const displayMenu = true;
  const depth = 0;
  $: console.log(DisplayName);
</script>

<div class={"self-end grid grid-cols-[auto_1fr] w-fit overflow-x-hidden "}>
  <div class="grid grid-rows-[auto_1fr] p-1">
    <div>
      {#if showImg}
        <UserAvatar
          url={prof.picture}
          name={metadata.pubkey}
          pubkey={metadata.pubkey}
          size={40}
        />
      {:else}
        <Avatar size={40} name={metadata.pubkey} variant="beam" />
      {/if}
    </div>
    {#if showRelayIcon}
      <SeenonIcons id={note.id} width={40} {tieKey} />{/if}
  </div>

  <div class="pt-1 max-w-full overflow-x-hidden">
    <div class="flex align-middle max-w-full overflow-x-hidden">
      <div>
        <DisplayName
          height={21}
          name={prof.display_name ?? ""}
          tags={metadata.tags}
        />
        {#if prof.name && prof.name !== ""}<span
            class="inline text-magnum-100 text-sm"
            ><DisplayName
              height={21}
              name={`@${prof.name}`}
              tags={metadata.tags}
            /></span
          >{/if}
      </div>
      {#if displayMenu}
        <time
          class="ml-2 inline-flex mr-1 min-w-7 text-magnum-100 text-xs hover:underline items-end"
          datetime={datetime(note.created_at)}
          >{formatAbsoluteDate(note.created_at)}</time
        >
      {/if}
    </div>
    {#if showUserStatus}
      <div class="text-sm text-zinc-500 min-w-[16px] flex items-center gap-1">
        <TrendingUp />
        <div
          class="truncate line-clamp-2 max-w-full"
          style="	white-space: pre-wrap; word-break: break-word;"
        >
          {#if !showImg}
            <!---->{status.content}
          {:else}
            {@const emojiTags = status.tags.filter(
              (tag) => tag[0] === "emoji" && tag.length > 2
            )}

            {@const parts =
              emojiTags.length >= 0
                ? parseEmojiText(status.content, emojiTags)
                : undefined}

            {#if !parts}{name}{:else}{#each parts as part}{#if part.type === "emoji"}<CustomEmoji
                    {part}
                    height={20}
                  />{:else}<span class="inline align-middle"
                    >{part.content}</span
                  >{/if}
              {/each}{/if}
          {/if}
        </div>
      </div>
    {/if}
    <!-- {#if showUserStatus}<ShowStatus pubkey={note.pubkey} {tieKey} />{/if} -->
    <!-- {@const { replyID, replyUsers } = replyedEvent(note.tags)}-->

    <div class="relative overflow-hidden mb-1.5">
      <div class="mt-0.5 overflow-y-auto overflow-x-hidden">
        <Content
          text={note.content}
          tags={note.tags}
          displayMenu={false}
          depth={0}
          tieKey={undefined}
          repostable={true}
          {showClientTag}
        />
      </div>
    </div>

    <SampleNoteActionButtons {showReactioninTL} />
  </div>
</div>
