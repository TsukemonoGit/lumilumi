<script lang="ts">
  import * as Nostr from "nostr-typedef";

  import { nip19 } from "nostr-tools";

  import { datetime, formatAbsoluteDate, profile } from "$lib/func/util";

  import { getRelaysById } from "$lib/func/nostr";
  import { goto } from "$app/navigation";
  import SeenonIcons from "../SeenonIcons.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import { followList, lumiSetting } from "$lib/stores/globalRunes.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import { eventKinds } from "$lib/func/kinds";
  import type { Snippet } from "svelte";
  import {
    isReplaceableKind,
    isParameterizedReplaceableKind,
  } from "nostr-tools/kinds";
  import { checkBirthDay } from "$lib/func/event";
  import { Cake } from "lucide-svelte";

  interface Props {
    note: Nostr.Event;
    metadata?: Nostr.Event | undefined;

    mini?: boolean;

    depth: number;

    displayMenu?: boolean;
    tieKey: string | undefined;
    children?: Snippet;
    kindInfo?: boolean;
  }

  let {
    note,
    metadata = $bindable(undefined),
    mini = false,
    depth,
    displayMenu = true,
    tieKey,
    children,
    kindInfo = false,
  }: Props = $props();
  let petname = $derived(followList.get().get(note.pubkey));

  let replaceable = $derived(
    note &&
      (isReplaceableKind(note.kind) ||
        isParameterizedReplaceableKind(note.kind))
  );

  let eventpointer: nip19.EventPointer = $derived({
    id: note.id,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
    author: note.pubkey,
    kind: note.kind,
  });

  let naddrpointer: nip19.AddressPointer = $derived({
    kind: note.kind,
    identifier: note.tags.find((item) => item[0] === "d")?.[1] ?? "",
    pubkey: note.pubkey,
    relays: tieKey ? getRelaysById(note.id, tieKey) : [],
  });
  let naddr = $derived(nip19.naddrEncode(naddrpointer));
  let nevent = $derived(nip19.neventEncode(eventpointer));

  // const handleClickToNotepage = () => {
  //   //Goto Note page

  //   goto(`/${replaceable ? naddr : nevent}`);
  // };

  let prof = $derived(profile(metadata));
  let isBirthDay = $derived(checkBirthDay(prof));
</script>

<div class={"grid grid-cols-[auto_1fr] max-w-full overflow-hidden my-1"}>
  <div class="grid grid-rows-[auto_1fr] p-1">
    <div>
      <UserPopupMenu
        pubkey={note.pubkey}
        {metadata}
        size={mini ? 20 : 40}
        {displayMenu}
        {depth}
        {tieKey}
      />
    </div>
    {#if lumiSetting.get().showRelayIcon && displayMenu}
      <SeenonIcons id={note.id} width={mini ? 20 : 40} {tieKey} />{/if}
  </div>

  <div class="pt-1 max-w-full overflow-hidden">
    <div class="flex align-middle max-w-full overflow-x-hidden">
      <div class="flex items-center flex-wrap overflow-hidden max-w-full">
        <!-- {#if isBirthDay}<Cake
            size={16}
            class="text-magnum-400"
          />{/if} -->{#if petname}<span
            class="text-magnum-100">📛{petname}</span
          >
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
      </div>

      {#if displayMenu}
        <a
          href={`/${replaceable ? naddr : nevent}`}
          class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
        >
          <time datetime={datetime(note.created_at)}
            >{formatAbsoluteDate(note.created_at)}</time
          >
        </a>
      {/if}
    </div>

    {@render children?.()}
  </div>
</div>
