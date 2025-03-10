<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { nip19 } from "nostr-tools";

  import { datetime, formatAbsoluteDate, profile } from "$lib/func/util";

  import { getRelaysById } from "$lib/func/nostr";
  import SeenonIcons from "../SeenonIcons.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import { eventKinds } from "$lib/func/kinds";
  import {
    isReplaceableKind,
    isParameterizedReplaceableKind,
  } from "nostr-tools/kinds";
  import {
    checkBirthDay,
    checkContentWarning,
    noteLink,
  } from "$lib/func/event";
  import { Cake } from "lucide-svelte";
  import NoteComponent from "../layout/NoteComponent.svelte";

  interface Props {
    note: Nostr.Event;
    metadata?: Nostr.Event | undefined;

    mini?: boolean;

    depth: number;

    displayMenu?: boolean;
    tieKey: string | undefined;
    children?: any;
    kindInfo?: boolean;
    content: any;
    replyUsers?: any;
    actionButtons?: any;
    status?: any;
  }

  let {
    note,
    metadata = $bindable(undefined),
    mini = false,
    depth,
    displayMenu = true,
    tieKey,
    content,
    replyUsers,
    actionButtons,
    status,
    kindInfo = false,
  }: Props = $props();
  let petname = $derived(followList.get().get(note.pubkey));

  let replaceable = $derived(
    note &&
      (isReplaceableKind(note.kind) ||
        isParameterizedReplaceableKind(note.kind))
  );

  let prof = $derived(profile(metadata));
  let isBirthDay = $derived(checkBirthDay(prof));
  let warning: string[] | undefined = $derived(checkContentWarning(note?.tags));
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

  {#snippet name()}{#if petname}<span class="text-magnum-100">📛{petname}</span>
    {:else if metadata && prof}
      <span
        class="line-clamp-1 truncate overflow-hidden max-w-full"
        style="white-space: normal; word-break: break-word;"
        ><DisplayName
          height={21}
          name={prof.display_name ?? ""}
          tags={metadata.tags}
        /></span
      >
      {#if prof.name && prof.name !== ""}<span
          class="text-magnum-100 text-sm line-clamp-1 truncate overflow-hidden max-w-full"
          style="white-space: normal; word-break: break-word;"
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
    {/if}{#if isBirthDay}<Cake size={16} class="text-magnum-400" />{/if}
    {#if kindInfo}
      <span class=" text-neutral-300/50 text-sm whitespace-nowrap ml-1">
        {eventKinds.get(note.kind)?.en ?? `kind:${note.kind}`}
      </span>{/if}
  {/snippet}
  {#snippet time()}
    {#if displayMenu}
      <a
        href={`/${noteLink(note, tieKey)}`}
        class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
      >
        <time datetime={datetime(note.created_at)}
          >{formatAbsoluteDate(note.created_at)}</time
        >
      </a>
    {:else}
      <time datetime={datetime(note.created_at)}
        >{formatAbsoluteDate(note.created_at)}</time
      >
    {/if}
  {/snippet}

  {#snippet status()}
    {@render status?.()}
  {/snippet}
  {#snippet replyUser()}
    {@render replyUser?.()}
  {/snippet}
  {#snippet content()}
    {@render content?.()}
  {/snippet}
  {#snippet actionButtons()}
    {@render actionButtons?.()}
  {/snippet}
</NoteComponent>
