<script lang="ts">
  import { MessageSquare, Repeat2, Heart, Zap, Ellipsis } from "lucide-svelte";
  import EllipsisMenuNote from "../NoteActionButtuns/EllipsisMenuNote.svelte";
  import EllipsisMenuNaddr from "../NoteActionButtuns/EllipsisMenuNaddr.svelte";
  interface Props {
    children?: any;
    nevent?: string | undefined;
    naddr?: string | undefined;
    pulse?: boolean;
    name?: string;
    menu?: boolean;
  }
  const {
    children,
    nevent,
    naddr,
    pulse = true,
    name,
    menu = true,
  }: Props = $props();
</script>

<div
  class={`grid grid-cols-[auto_1fr] w-full overflow-hidden my-1 justify-start gap-1 pt-0.5 px-1 ${
    pulse ? "animate-pulse" : ""
  }`}
>
  <!--icon-->
  <div class="rounded-full bg-neutral-700 w-10 h-10"></div>

  <div class="pt-1 max-w-full overflow-hidden">
    <!--name-->
    {#if name}
      <div class="flex items-center flex-wrap overflow-hidden max-w-full">
        {name}
      </div>{:else}
      <div
        class="flex items-center flex-wrap overflow-hidden w-24 h-4 bg-neutral-700 max-w-full rounded-full"
      ></div>{/if}

    <!--text-->
    {#if children}
      <div class="break-all text-neutral-500 italic">
        {@render children()}
      </div>
    {:else}
      <div
        class="mt-1 w-full flex items-center flex-wrap overflow-hidden h-10 bg-neutral-700 rounded-full"
      ></div>{/if}
    <div class=" mt-1 flex flex-row-reverse justify-between text-neutral-600">
      {#if nevent}<EllipsisMenuNote
          encodedId={nevent}
        />{:else if naddr}<EllipsisMenuNaddr {naddr} />{:else}<Ellipsis
        />{/if}{#if menu}<Zap size="20" /><Heart
          size="20"
          class=" mt-auto overflow-hidden"
        /><Repeat2 size="22" /><MessageSquare size="20" />
      {/if}
    </div>
  </div>
</div>
