<script lang="ts">
  import { Repeat, Heart, MessageSquare, Ellipsis } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  export let note: Nostr.Event;
</script>

<div class="flex justify-between">
  <button><MessageSquare /></button> <button><Repeat /></button>
  <button><Heart /></button>
  <button><Ellipsis /></button>
</div>
