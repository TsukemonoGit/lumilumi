<script lang="ts">
  import * as Nostr from "nostr-typedef";

  export let note: Nostr.Event;
  export let metadata: Nostr.Event | undefined = undefined;
  export let status: string | undefined = undefined;
</script>

<div class="rounded-md border border-magnum-500">
  {note.content}
</div>
