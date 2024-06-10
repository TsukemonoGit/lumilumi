<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
  import { filterKind } from "rx-nostr";
  import { getRelaysById } from "$lib/func/nostr";
  import { Repeat } from "lucide-svelte";
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
</script>

{#if note.kind === 1}
  <div class="rounded-md border border-magnum-500">
    {#if metadata}
      {profile(metadata)?.display_name ?? profile(metadata)?.name}@{profile(
        metadata
      )?.name}
    {/if}
    <hr />
    {note.tags}
    <hr />
    {note.content}
  </div>
{:else if note.kind === 6 || note.kind === 16}
  <div class="rounded-md border border-magnum-500">
    <div class="flex gap-1">
      <Repeat size="20" class=" mt-auto" />
      {#if metadata}
        {profile(metadata)?.name}
      {/if}
    </div>
    <hr />
    {JSON.stringify(note.tags)}
  </div>
{:else}
  <div class="rounded-md border border-magnum-500">
    kind:{note.kind}{#if metadata}
      {profile(metadata)?.name}
    {/if}
    <hr />
    {note.tags}
    <hr />
    {note.content}
  </div>
{/if}
<!--seenonの更新を検知できないので新しいノートがでたりとかで画面更新されるときにシーンonも更新される-->
{getRelaysById(note.id)}
