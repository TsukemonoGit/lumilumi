<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { _ } from "svelte-i18n";

  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import { getStatusLink } from "$lib/func/status";
  import { page } from "$app/state";
  import GeneralStatusDisplay from "../Status/GeneralStatusDisplay.svelte";
  import MusicStatusDisplay from "../Status/MusicStatusDisplay.svelte";

  import OtherStatusDisplay from "../Status/OtherStatusDisplay.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;

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

    repostable = true,
  }: Props = $props();

  let deleted = $state(false);
  let statusTag = $derived(note.tags.find((tag) => tag[0] === "d")?.[1]);

  let statusLink = $derived(getStatusLink(note, page.url.origin));
</script>

{#if deleted}
  <div class="italic text-neutral-500 px-1">Deleted Note</div>
{:else if note}
  <script lang="ts">
    import * as Nostr from "nostr-typedef";

    import { lumiSetting } from "$lib/stores/globalRunes.svelte";
    import UserPopupMenu from "../../user/UserPopupMenu.svelte";

    import { checkContentWarning } from "$lib/func/event";

    import NoteComponent from "../layout/NoteComponent.svelte";
    import Content from "../../content/Content.svelte";
    import UserName from "../../user/UserName.svelte";
    import PopupUserName from "../../user/PopupUserName.svelte";
    import ShowStatus from "../Status/ShowStatus.svelte";
    import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
    import ProfileDisplay from "./ProfileDisplay.svelte";
    import SeenonIcons from "../SeenonIcons.svelte";
    import Reply from "../Reply.svelte";
    import DisplayTime from "./DisplayTime.svelte";

    interface Props {
      note: Nostr.Event;
      metadata?: Nostr.Event | undefined;
      zIndex?: number;
      maxHeight?: number;
      replyTag: string[] | undefined;
      thread: boolean;
      repostable: boolean;

      mini?: boolean;

      depth: number;

      displayMenu?: boolean;
      tieKey: string | undefined;
      kindInfo?: boolean;
      replyUsers: string[];
      deleted: boolean;
    }

    let {
      note,
      metadata = $bindable(undefined),
      mini = false,
      depth,
      displayMenu = true,
      tieKey,
      kindInfo = false,
      zIndex,
      maxHeight,
      repostable,
      replyUsers,
      deleted = $bindable(),
      replyTag,
      thread,
    }: Props = $props();

    let warning = $derived(checkContentWarning(note?.tags));
  </script>

  <NoteComponent
    warningText={warning !== undefined
      ? warning.length > 1
        ? warning[1]
        : ""
      : undefined}
  >
    {#snippet icon()}
      <UserPopupMenu
        pubkey={note.pubkey}
        {metadata}
        size={mini ? 20 : 40}
        {displayMenu}
        {depth}
        {tieKey}
      />
    {/snippet}
    {#snippet seenOn()}
      {#if lumiSetting.get().showRelayIcon && displayMenu}
        <SeenonIcons id={note.id} width={mini ? 20 : 40} {tieKey} />{/if}
    {/snippet}
    {#snippet name()}
      <ProfileDisplay {note} {metadata} kindInfo={true} />
    {/snippet}
    {#snippet time()}
      <DisplayTime {displayMenu} {note} {tieKey} />
    {/snippet}
    {#snippet status()}
      {#if lumiSetting.get().showUserStatus}<ShowStatus
          pubkey={note.pubkey}
          {tieKey}
        />{/if}
    {/snippet}

    {#snippet content()}
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
    {/snippet}
    {#snippet actionButtons()}
      {#if displayMenu}
        <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
    {/snippet}
  </NoteComponent>
{/if}
