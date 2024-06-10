<script lang="ts">
  import { createPopover, createSync, melt } from "@melt-ui/svelte";
  import { Repeat, Heart, MessageSquare, Ellipsis, X } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";
  import { fade } from "svelte/transition";
  import Popover from "./Popover.svelte";

  export let note: Nostr.Event;
</script>

<div class="flex justify-around">
  <Popover {note}>
    <MessageSquare size="20" />
    <div slot="popoverContent">test</div>
  </Popover>
  <Popover {note}>
    <Repeat size="20" />
  </Popover>
  <Popover {note}>
    <Heart size="20" />
  </Popover>
  <Popover {note}>
    <Ellipsis size="20" />
  </Popover>
</div>
