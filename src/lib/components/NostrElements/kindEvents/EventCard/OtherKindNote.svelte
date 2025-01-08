<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { datetime, formatAbsoluteDate, profile } from "$lib/func/util";

  import SimpleMarkdown from "$lib/components/MarkdownItem/SimpleMarkdown.svelte";
  import { nip19 } from "nostr-tools";
  import { getRelaysById } from "$lib/func/nostr";
  import { goto } from "$app/navigation";

  import { eventKinds } from "$lib/func/kinds";
  import Content from "../../content/Content.svelte";
  import ClientTag from "../../content/ClientTag.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: string;
    repostable: boolean;
    tieKey: string | undefined;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    repostable,
    tieKey,
  }: Props = $props();

  let title = $derived(
    note.tags.find((tag) => tag[0] === "title" && tag.length > 1)?.[1]
  );
  let dtag = $derived(
    note.tags.find((tag) => tag[0] === "d" && tag.length > 1)?.[1]
  );
  let description = $derived(
    note.tags.find(
      (tag) =>
        (tag[0] === "description" || tag[0] === "summary") && tag.length > 1
    )?.[1]
  );
  let image = $derived(
    note.tags.find((tag) => tag[0] === "image" && tag.length > 1)?.[1]
  );

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

  let prof = $derived(profile(metadata));
  let petname = $derived(followList.get().get(note.pubkey));
</script>

<div
  class="break-words overflow-x-hidden gap-4 p-1"
  style="word-break: break-word;"
>
  <div class="w-full flex gap-1">
    {#if metadata}
      <div>
        <UserPopupMenu
          pubkey={note.pubkey}
          {metadata}
          size={20}
          {displayMenu}
          {depth}
          {tieKey}
        />
      </div>
      <div class="text-magnum-100 text-sm">
        {#if petname}<span class="text-magnum-100">📛{petname}</span>
        {:else if metadata && prof}
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
        {:else}
          <span class="text-magnum-100 text-sm break-all">
            @{nip19.npubEncode(note.pubkey)}</span
          >
        {/if}
      </div>
    {:else}
      <span class="text-magnum-100 text-sm break-all">
        @{nip19.npubEncode(note.pubkey)}</span
      >
    {/if}
    <div class="text-neutral-300/50 text-sm">
      {eventKinds.get(note.kind)?.en ?? `kind:${note.kind}`}
    </div>
    {#if displayMenu}
      <button
        onclick={handleClickToNotepage}
        class="  ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
      >
        <time datetime={datetime(note.created_at)}
          >{formatAbsoluteDate(note.created_at)}</time
        >
      </button>
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

        {#if image && lumiSetting.get().showImg}
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
      /><ClientTag tags={note.tags} {depth} />{:else}
      <Content
        text={note.content}
        tags={note.tags}
        {displayMenu}
        {depth}
        {repostable}
        {tieKey}
      />{/if}
  </div>
  {#if displayMenu}
    <NoteActionButtons {note} {repostable} {tieKey} />
  {/if}
</div>
