<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import Content from "./Content.svelte";
  import UserMenu from "$lib/components/Elements/UserPopupMenu.svelte";
  import { datetime, formatAbsoluteDate, profile } from "$lib/func/util";
  import { showImg } from "$lib/stores/stores";
  import NoteActionButtons from "./NoteActionButtuns/NoteActionButtons.svelte";
  import SimpleMarkdown from "$lib/components/MarkdownItem/SimpleMarkdown.svelte";
  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";
  import { goto } from "$app/navigation";
  import ClientTag from "./ClientTag.svelte";
  import { eventKinds } from "$lib/func/kinds";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined;
  export let displayMenu: boolean;
  export let depth: number;
  export let maxHeight: string;
  export let repostable: boolean;
  export let tieKey: string | undefined;

  $: title = note.tags.find((tag) => tag[0] === "title" && tag.length > 1)?.[1];
  $: dtag = note.tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1];
  $: description = note.tags.find(
    (tag) =>
      (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
  )?.[1];
  $: image = note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1];

  const replaceable =
    (note.kind >= 30000 && note.kind < 40000) ||
    (note.kind >= 10000 && note.kind < 20000) ||
    note.kind === 0 ||
    note.kind === 3;
  const eventpointer: nip19.EventPointer = {
    id: note.id,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
    author: note.pubkey,
    kind: note.kind,
  };
  const naddrpointer: nip19.AddressPointer = {
    kind: note.kind,
    identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
    pubkey: note.pubkey,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
  };
  const naddr = nip19.naddrEncode(naddrpointer);
  const nevent = nip19.neventEncode(eventpointer);

  const handleClickToNotepage = () => {
    //Goto Note page

    goto(`/${replaceable ? naddr : nevent}`);
  };
</script>

<div
  class="break-words overflow-x-hidden gap-4 p-1"
  style="word-break: break-word;"
>
  <div class="w-full flex gap-1">
    {#if metadata}
      <div>
        <UserMenu
          pubkey={note.pubkey}
          bind:metadata
          size={20}
          {displayMenu}
          {depth}
          {tieKey}
        />
      </div>
      <div class="text-magnum-100 text-sm">
        @{profile(metadata)?.name && profile(metadata)?.name !== ""
          ? profile(metadata)?.name
          : profile(metadata)?.display_name}
      </div>
      <div class="text-neutral-300/50 text-sm">
        {eventKinds.get(note.kind)?.en ?? `kind:${note.kind}`}
      </div>
      {#if displayMenu}
        <button
          on:click={handleClickToNotepage}
          class="  ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
        >
          <time datetime={datetime(note.created_at)}
            >{formatAbsoluteDate(note.created_at)}</time
          >
        </button>
      {/if}
    {/if}
  </div>
  {#if title || dtag || description}
    <div class="rounded-md bg-neutral-800 p-2">
      {#if (title && title !== "") || dtag}
        <div class="text-lg font-bold">
          {title && title !== "" ? title : dtag}
        </div>{/if}
      <div
        class="grid grid-rows-[1fr_auto] xs:grid-cols-[1fr_auto] w-full gap-1 whitespace-pre-wrap"
      >
        {#if description && description !== ""}<div
            class="px-1 text-neutral-300/80 max-h-32 xs:max-h-40 overflow-y-auto"
          >
            {description}
          </div>{/if}

        {#if image && $showImg}
          <img
            loading="lazy"
            src={image}
            alt=""
            class="object-contain overflow-hidden max-w-32 max-h-32 xs:max-w-40 xs:max-h-40 mx-auto"
          />{/if}
      </div>
    </div>{/if}
  <div
    class="mt-0.5 overflow-y-auto overflow-x-hidden"
    style="max-height:{maxHeight ?? 'none'}"
  >
    {#if note.kind === 30023 || note.kind === 30024}
      <SimpleMarkdown
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      /><ClientTag tags={note.tags} />{:else}
      <Content
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />{/if}
  </div>
  {#if displayMenu}<NoteActionButtons {note} {repostable} {tieKey} />{/if}
</div>
