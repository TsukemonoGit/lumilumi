<script lang="ts">
  import { noteLink } from "$lib/func/event";
  import { datetime, formatAbsoluteDate } from "$lib/func/util";

  let { note, displayMenu, tieKey } = $props();
</script>

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
  <div class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs">
    <time datetime={datetime(note.created_at)}
      >{formatAbsoluteDate(note.created_at)}</time
    >
  </div>
{/if}
