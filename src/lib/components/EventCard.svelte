<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { getRelaysById } from "$lib/func/nostr";
  import { Repeat, TriangleAlert } from "lucide-svelte";
  import Reaction from "./Reaction.svelte";
  import RepostedNote from "./RepostedNote.svelte";
  import Reply from "./Reply.svelte";
  import { loginUser } from "$lib/stores/stores";
  import NoteActionButtons from "./NoteActionButtons.svelte";
  import { nip19 } from "nostr-tools";
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
  let loadWarning = 0;
  const checkContentWarning = (tags: string[][]): string[] | undefined => {
    return tags.find((item) => item[0] === "content-warning");
  };
</script>

<div class="rounded-md border {noteClass()} ">
  {#if note.kind === 1}
    {#if metadata}
      {profile(metadata)?.display_name ?? profile(metadata)?.name}<span
        class="text-neutral-500 text-sm">@{profile(metadata)?.name}</span
      >
    {:else}
      <span class="text-neutral-500 text-sm"
        >@{nip19.npubEncode(note.pubkey)}</span
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
    {#await checkContentWarning(note.tags) then tag}
      <div class="relative">
        <div class="ml-4">{note.content}</div>
        {#if tag}
          <div class="absolute top-0 left-0 w-full h-full flex">
            <div
              class="  ml-auto mt-auto w-full h-full max-h-[100%] flex resize bg-magnum-600 z-20 overflow-hidden rotate-180"
            >
              <div class="flex -rotate-180">
                {tag[1] ?? "warning"}<TriangleAlert size="20" />
              </div>
            </div>
          </div>
        {/if}
      </div>
      <!-- {#if tag}
        {note.content.slice(0, loadWarning)}
        <div class="flex gap-2">
          {#if loadWarning < note.content.length}<button
              class="brerak-all flex items-center w-fit px-2 rounded-md bg-magnum-400 font-medium text-magnum-900 hover:opacity-75 active:opacity-50"
              on:click={() =>
                (loadWarning = Math.min(loadWarning + 5, note.content.length))}
              ><TriangleAlert size="20" />{tag[1] ?? "warning"}</button
            >{/if}
          {#if loadWarning > 0}
            <button
              class="brerak-all flex items-center w-fit px-2 rounded-md bg-magnum-400 font-medium text-magnum-900 hover:opacity-75 active:opacity-50"
              on:click={() => (loadWarning = Math.max(loadWarning - 5, 0))}
              >hide warning</button
            >
          {/if}
        </div>
      {:else}
        {note.content}
      {/if} -->
    {/await}
    <NoteActionButtons {note} />
  {:else if note.kind === 6 || note.kind === 16}
    <!--リポスト-->
    <div class="flex flex-wrap gap-1">
      <Repeat size="20" class=" mt-auto  stroke-magnum-500" />
      {#if metadata}
        {profile(metadata)?.name ?? profile(metadata)?.display_name}
      {/if}
      <div class="ml-auto mr-2">
        <NoteActionButtons {note} />
      </div>
    </div>
    <hr />
    {#await repostedId(note.tags) then { kind, tag }}
      {#if tag}
        <RepostedNote {tag} {kind} />
      {/if}
    {/await}
  {:else if note.kind === 7}
    <!--リアクション-->
    <div class="flex gap-1">
      <div class="w-fit"><Reaction event={note} /></div>
      {#if metadata}
        <div class="break-keep whitespace-nowrap">
          {profile(metadata)?.name}
        </div>
      {/if}
      <div class="ml-auto mr-2">
        <NoteActionButtons {note} />
      </div>
    </div>
    <hr />
    {#await repostedId(note.tags) then { kind, tag }}
      {#if tag}
        <RepostedNote {tag} {kind} />
      {/if}
    {/await}
  {:else}
    <!--その他-->
    kind:{note.kind}{#if metadata}
      {profile(metadata)?.name}
    {/if}
    <hr />
    {note.tags}
    <hr />
    {note.content}
    <NoteActionButtons {note} />
  {/if}
</div>
