<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import { profile } from "$lib/func/util";
  import { t as _ } from "@konemono/svelte5-i18n";

  import FollowButton from "../../user/FollowButton.svelte";
  import Content from "../../content/Content.svelte";
  import DisplayName from "$lib/components/NostrElements/user/DisplayName.svelte";
  import UserPopupMenu from "../../user/UserPopupMenu.svelte";
  import { followList } from "$lib/stores/globalRunes.svelte";
  import { checkBirthDay } from "$lib/func/event";
  import { Cake } from "lucide-svelte";
  interface Props {
    displayMenu: boolean;
    note: Nostr.Event;
    depth: number;
    repostable: boolean;
  }

  let { displayMenu, note = $bindable(), depth, repostable }: Props = $props();

  const prof = $derived(profile(note));
  const petname = $derived(followList.get().get(note.pubkey));
  const isBirthDay = $derived(checkBirthDay(prof));
</script>

<div class="grid grid-cols-[auto_1fr] py-1">
  <div class="p-1">
    <UserPopupMenu pubkey={note.pubkey} metadata={note} size={40} {depth} />
  </div>
  <div class="p-1 overflow-x-hidden">
    <div
      class="flex align-middle whitespace-pre-wrap break-words flex-wrap"
      style="word-break: break-word;"
    >
      <div class="mb-2 flex items-center flex-wrap">
        {#if prof}
          <DisplayName
            height={21}
            name={prof.display_name ?? ""}
            tags={note.tags}
          />

          {#if prof.name && prof.name !== ""}<span
              class="text-magnum-100 text-sm mt-auto mb-auto ml-1 inline-flex whitespace-pre-wrap break-words flex-wrap"
              style="word-break: break-word;"
              ><DisplayName
                height={21}
                name={`@${prof.name}`}
                tags={note.tags}
              />
            </span>{/if}{/if}{#if petname}<span class="text-magnum-100"
            >📛{petname}</span
          >{/if}{#if isBirthDay}<Cake size={16} class="text-magnum-400" />{/if}
      </div>
      <div class="ml-auto">
        <FollowButton pubkey={note.pubkey} />
      </div>
    </div>

    <Content
      maxHeight={192}
      event={{
        ...note,
        content: prof?.about?.trim() ?? "",
      }}
      {displayMenu}
      {depth}
      {repostable}
    />
  </div>
</div>
