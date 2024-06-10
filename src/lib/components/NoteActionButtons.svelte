<script lang="ts">
  import { Repeat, Heart, MessageSquare, Ellipsis } from "lucide-svelte";
  import * as Nostr from "nostr-typedef";

  export let note: Nostr.Event;

  function handleClickReply(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {
    throw new Error("Function not implemented.");
  }

  function handleClickRepost(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {
    throw new Error("Function not implemented.");
  }

  function handleClickReaction(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {
    throw new Error("Function not implemented.");
  }

  function handleClickEllopsis(
    event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }
  ) {
    throw new Error("Function not implemented.");
  }
</script>

<div class="flex justify-around">
  <button
    class="hover:opacity-75 active:opacity-50 text-magnum-500"
    on:click={handleClickReply}><MessageSquare size="20" /></button
  >
  <button
    class="hover:opacity-75 active:opacity-50 text-magnum-500"
    on:click={handleClickRepost}><Repeat size="20" /></button
  >
  <button
    class="hover:opacity-75 active:opacity-50 text-magnum-500"
    on:click={handleClickReaction}><Heart size="20" /></button
  >
  <button
    class="hover:opacity-75 active:opacity-50 text-magnum-500"
    on:click={handleClickEllopsis}><Ellipsis size="20" /></button
  >
</div>
