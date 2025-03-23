<!--バッジ受賞-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { _ } from "svelte-i18n";
  import { loginUser } from "$lib/stores/stores";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";

  import Content from "../../content/Content.svelte";
  import UserName from "../../user/UserName.svelte";
  import Reply from "../Reply.svelte";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";
  import NoteActionButtons from "../NoteActionButtuns/NoteActionButtons.svelte";
  import SeenonIcons from "../SeenonIcons.svelte";
  import ShowStatus from "../Status/ShowStatus.svelte";
  import DisplayTime from "./DisplayTime.svelte";
  import ProfileDisplay from "./ProfileDisplay.svelte";
  import ReplyTo from "../layout/ReplyTo.svelte";
  import { hexRegex, nip33Regex } from "$lib/func/regex";
  import { parseNaddr } from "$lib/func/util";
  import type { AddressPointer } from "nostr-tools/nip19";
  import NaddrEvent from "../NaddrEvent.svelte";
  import UserAvatar from "../../user/UserAvatar.svelte";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;
    tieKey: string | undefined;
    mini: boolean;
    warning: string[] | undefined;

    repostable: boolean;
    deleted: boolean;
    zIndex?: number;
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

    repostable,
    deleted = $bindable(),
    zIndex,
  }: Props = $props();
  let badgeName = $derived(
    note.tags.find((tag) => tag[0] == "name" && tag.length > 1)?.[1]
  );
  let description = $derived(
    note.tags.find((tag) => tag[0] == "description" && tag.length > 1)?.[1]
  );
  let image = $derived(
    note.tags.find((tag) => tag[0] == "image" && tag.length > 1)?.[1]
  );
  const size = 80;
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
    <ProfileDisplay
      pubkey={note.pubkey}
      {metadata}
      kindInfo={true}
      kind={note.kind}
    />
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
    <div class="mt-1 grid grid-cols-[auto_1fr] gap-1">
      <UserAvatar
        url={image}
        name={badgeName}
        pubkey={undefined}
        {size}
        square={true}
      />
      <div>
        <p class="font-bold">{badgeName}</p>
        <p>{description}</p>
      </div>
    </div>
  {/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} {tieKey} bind:deleted />{/if}
  {/snippet}
</NoteComponent>
