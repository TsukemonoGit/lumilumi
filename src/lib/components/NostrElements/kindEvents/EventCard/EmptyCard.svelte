<script lang="ts">
  import { MessageSquare, Repeat2, Heart, Zap, Ellipsis } from "lucide-svelte";
  import EllipsisMenuNote from "../NoteActionButtuns/EllipsisMenuNote.svelte";
  import EllipsisMenuNaddr from "../NoteActionButtuns/EllipsisMenuNaddr.svelte";
  interface Props {
    children?: any;
    nevent?: string | undefined;
    naddr?: string | undefined;
  }
  let { children, nevent, naddr }: Props = $props();
</script>

<div
  class={"grid grid-cols-[auto_1fr] w-full overflow-hidden my-1 justify-start gap-1 pt-0.5 px-1 animate-pulse"}
>
  <!--icon-->
  <div class="rounded-full bg-neutral-700 w-10 h-10"></div>

  <div class="pt-1 max-w-full overflow-hidden">
    <!--name-->
    <div
      class="flex items-center flex-wrap overflow-hidden w-24 h-4 bg-neutral-700 max-w-full rounded-full"
    ></div>

    <!--text-->
    {#if children}
      <div class="break-all text-neutral-500 italic">
        {@render children()}
      </div>
    {:else}
      <div
        class="mt-1 w-full flex items-center flex-wrap overflow-hidden h-10 bg-neutral-700 rounded-full"
      ></div>{/if}
    <div class=" mt-1 flex justify-between text-neutral-600">
      <MessageSquare size="20" /><Repeat2 size="22" /><Heart
        size="20"
        class=" mt-auto overflow-hidden"
      />
      <Zap size="20" />{#if nevent}<EllipsisMenuNote
          encodedId={nevent}
        />{:else if naddr}<EllipsisMenuNaddr {naddr} />{:else}<Ellipsis />{/if}
    </div>
  </div>
</div>
