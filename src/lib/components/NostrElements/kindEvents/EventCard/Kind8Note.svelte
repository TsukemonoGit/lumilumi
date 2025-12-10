<!--バッジ受賞-->
<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { t as _ } from "@konemono/svelte5-i18n";

  import PopupUserName from "$lib/components/NostrElements/user/PopupUserName.svelte";

  import UserName from "../../user/UserName.svelte";

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

  import NaddrEvent from "../NaddrEvent.svelte";
  import Link from "$lib/components/Elements/Link.svelte";
  import { SquareArrowOutUpRight } from "lucide-svelte";
  import * as nip19 from "nostr-tools/nip19";
  import { getRelaysById } from "$lib/func/nostr";

  interface Props {
    note: Nostr.Event;
    metadata: Nostr.Event | undefined;
    displayMenu: boolean;
    depth: number;
    maxHeight: number | undefined;

    mini: boolean;
    warning: string[] | undefined;

    repostable: boolean;
    deleted: boolean;
    zIndex?: number;
    showStatus?: boolean;
  }

  let {
    note,
    metadata,
    displayMenu,
    depth,
    maxHeight,

    mini,
    warning,

    repostable,
    deleted = $bindable(),
    zIndex,
    showStatus = true,
  }: Props = $props();

  let replyUsers: string[] = $derived(
    note.tags
      .filter(
        (tag) => tag[0] === "p" && tag.length > 1 && hexRegex.test(tag[1]),
      )
      .map((tag) => tag[1]),
  );
  let badgeAddress: nip19.AddressPointer | undefined = $derived.by(() => {
    const atag = note.tags.find(
      (tag) => tag[0] === "a" && tag.length > 1 && nip33Regex.test(tag[1]),
    );
    return atag ? parseNaddr(atag) : undefined;
  });

  let nevent: string | undefined = $derived.by(() => {
    if (!note) {
      return undefined;
    }
    try {
      const eventpointer: nip19.EventPointer = {
        id: note.id,
        relays: getRelaysById(note.id),
        author: note.pubkey,
        kind: note.kind,
      };
      return nip19.neventEncode(eventpointer);
    } catch {
      return undefined;
    }
  });
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
    />
  {/snippet}
  {#snippet seenOn()}
    {#if lumiSetting.get().showRelayIcon && displayMenu}
      <SeenonIcons id={note.id} width={mini ? 20 : 40} />{/if}
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
    <DisplayTime {displayMenu} {note} />
  {/snippet}
  {#snippet status()}
    {#if lumiSetting.get().showUserStatus && showStatus}<ShowStatus
        pubkey={note.pubkey}
      />{/if}
  {/snippet}
  {#snippet replyUser()}
    {#if replyUsers.length > 0}
      <ReplyTo
        >{#each replyUsers as user}
          {#if !displayMenu}<UserName pubhex={user} />{:else}
            <PopupUserName pubkey={user} {zIndex} />{/if}
        {/each}</ReplyTo
      >{/if}
  {/snippet}

  {#snippet content()}
    {#if badgeAddress}<div class="border rounded-md border-magnum-600/30">
        <NaddrEvent
          data={badgeAddress}
          {displayMenu}
          {depth}
          content={`${badgeAddress.kind}:${badgeAddress.pubkey}:${badgeAddress.identifier}`}
          {repostable}
          mini={true}
          thread={true}
        />
      </div>
      <Link
        className="underline text-magnum-300 break-all hover:opacity-80 flex items-center gap-1"
        href={`https://nos-haiku.vercel.app/entry/${nevent}`}
        >Manage your badge on Nos Haiku<SquareArrowOutUpRight size={12} /></Link
      >
    {:else}<span class="italic text-neutral-600">badge load error</span
      >{/if}{/snippet}
  {#snippet actionButtons()}
    {#if displayMenu}
      <NoteActionButtons {note} {repostable} bind:deleted {zIndex} />{/if}
  {/snippet}
</NoteComponent>
