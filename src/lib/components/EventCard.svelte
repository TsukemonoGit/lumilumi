<script lang="ts">
  import * as Nostr from "nostr-typedef";
  import type { Profile } from "$lib/types";
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
    {note.content}
  </div>
{:else if note.kind === 6}
  <div class="rounded-md border border-magnum-500">
    {#if metadata}
      {profile(metadata)?.name}
    {/if}
    <hr />
    {JSON.stringify(note.tags)}
  </div>
{:else}
  <div class="rounded-md border border-magnum-500">
    {#if metadata}
      {profile(metadata)?.name}
    {/if}
    <hr />
    {note.content}
  </div>
{/if}
