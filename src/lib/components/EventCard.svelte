<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { getRelaysById } from "$lib/func/nostr";
  import { Repeat } from "lucide-svelte";
  import Reaction from "./Reaction.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import Reply from "./Reply.svelte";
  import { loginUser } from "$lib/stores/stores";
  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;

  const profile = (ev: Nostr.Event): Profile | undefined => {
    try {
      return JSON.parse(ev.content);
    } catch (error) {
      return undefined;
    }
  };
  //eかa
  const repostedId = (
    tags: string[][]
  ): { tag: string[] | undefined; kind: number | undefined } => {
    const kindtag = tags.find((tag) => tag[0] === "k");
    const kind = kindtag ? Number(kindtag[1]) : undefined;
    return {
      tag: tags.find((tag) => tag[0] === "e" || tag[0] === "a"),
      kind: kind,
    };
  };
  const noteClass = () => {
    const ptag = note.tags.find((tag) => tag[0] === "p");

    return (ptag?.[1] as string) === $loginUser
      ? "border-magnum-500 bg-magnum-700/20"
      : "border-magnum-500";
  };

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
    const root = IDs?.find((item) => item.length > 3 && item[3] === "root");
    const reply = IDs?.find((item) => item.length > 3 && item[3] === "reply");
    //  console.log(root?.[1]);
    return {
      replyUsers: users,
      replyID: reply ? reply[1] : root ? root[1] : undefined,
    };
  };
</script>

<div class="rounded-md border {noteClass()} ">
  {#if note.kind === 1}
    {#if metadata}
      {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
        class="text-neutral-500 text-sm">@{profile(metadata)?.name}</span
      >
    {/if}
    <hr />
    {#await replyedEvent(note.tags) then { replyID, replyUsers }}
      {#if replyID || replyUsers.length > 0}<div class="px-2">
          <Reply {replyID} {replyUsers} />
          <hr />
        </div>
      {/if}
    {/await}

    {note.content}
  {:else if note.kind === 6 || note.kind === 16}
    <div class="flex gap-1">
      <Repeat size="20" class=" mt-auto  stroke-magnum-500" />
      {#if metadata}
        {profile(metadata)?.name ?? profile(metadata)?.display_name}
      {/if}
    </div>
    <hr />
    {#await repostedId(note.tags) then { kind, tag }}
      {#if tag}
        <RepostedNote {tag} {kind} />
      {/if}
    {/await}
  {:else if note.kind === 7}
    <div class="flex gap-1">
      <div class="w-fit"><Reaction event={note} /></div>
      {#if metadata}
        <div class="break-keep whitespace-nowrap">
          {profile(metadata)?.name}
        </div>
      {/if}
    </div>
    <hr />
    {#await repostedId(note.tags) then { kind, tag }}
      {#if tag}
        <RepostedNote {tag} {kind} />
      {/if}
    {/await}
  {:else}
    kind:{note.kind}{#if metadata}
      {profile(metadata)?.name}
    {/if}
    <hr />
    {note.tags}
    <hr />
    {note.content}
  {/if}
</div>
<!--seenonの更新を検知できないので新しいノートがでたりとかで画面更新されるときにシーンonも更新される-->
{getRelaysById(note.id)}
