<script lang="ts">
  import { noteLink } from "$lib/func/event";
  import { datetime, formatAbsoluteDateFromUnix } from "$lib/func/util";

  const { note, displayMenu } = $props();
</script>

<!-- 
{#if displayMenu} -->
<a
  href={`/${noteLink(note)}`}
  class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs hover:underline"
>
  <time datetime={datetime(note.created_at)}
    >{formatAbsoluteDateFromUnix(note.created_at)}</time
  >
</a>
<!-- {:else}
  <div class="inline-flex ml-auto mr-1 min-w-7 text-magnum-100 text-xs">
    <time datetime={datetime(note.created_at)}
      >{formatAbsoluteDateFromUnix(note.created_at)}</time
    >
  </div>
{/if} -->
