<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { _ } from "svelte-i18n";
  import { loginUser } from "$lib/stores/stores";

  import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";

  import Content from "../../content/Content.svelte";
  import NoteTemplate from "../NoteTemplate.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import { getStatusLink } from "$lib/func/status";
  import { page } from "$app/state";
  import GeneralStatusDisplay from "../Status/GeneralStatusDisplay.svelte";
  import MusicStatusDisplay from "../Status/MusicStatusDisplay.svelte";
  import { eventKinds } from "$lib/func/kinds";
  import OtherStatusDisplay from "../Status/OtherStatusDisplay.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: string;
    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;
    replyUsers: string[];
    thread: boolean;
    replyTag: string[] | undefined;
    repostable?: boolean | undefined;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,
    tieKey,
    mini,
    warning,
    replyUsers,
    thread,
    replyTag,
    repostable = true,
  }: Props = $props();

  let statusTag = $derived(note.tags.find((tag) => tag[0] === "d")?.[1]);

  let statusLink = $derived(getStatusLink(note, page.url.origin));
</script>

<NoteTemplate
  {note}
  {metadata}
  {mini}
  {displayMenu}
  {depth}
  {tieKey}
  kindInfo={true}
>
  <div class="relative overflow-hidden mb-1.5">
    <div
      class="mt-0.5 overflow-y-auto overflow-x-hidden"
      style="max-height:{maxHeight ?? 'none'}"
    >
      <div class="grid grid-cols-[auto_1fr] flex-wrap gap-1 items-center">
        {#if statusTag === "general"}
          <GeneralStatusDisplay link={statusLink} event={note} {tieKey} />
        {:else if statusTag === "music"}<MusicStatusDisplay
            link={statusLink}
            event={note}
            {tieKey}
          />{:else}
          <OtherStatusDisplay link={statusLink} event={note} {tieKey} />
        {/if}
      </div>
    </div>
    {#if warning}
      <!-- <WarningHide1 text={tag[1]} /> -->
      <WarningHide2 text={warning[1]} />
    {/if}
  </div>

  {#if displayMenu}
    <NoteActionButtons {note} {repostable} {tieKey} />{/if}
</NoteTemplate>
