<script lang="ts">
  //import WarningHide2 from "$lib/components/Elements/WarningHide2.svelte";
  import WarningHide3 from "$lib/components/Elements/WarningHide3.svelte";
  import type { Snippet } from "svelte";
  interface Props {
    warningText?: string;
    icon?: Snippet;
    seenOn?: Snippet;
    name?: Snippet;
    time?: Snippet;
    status?: Snippet;
    replyUser?: Snippet;
    reply?: Snippet;
    content?: Snippet;
    actionButtons?: Snippet;
    bookmark?: Snippet;
  }
  let {
    warningText,
    icon,
    seenOn,
    name,
    time,
    status,
    replyUser,
    reply,
    content,
    actionButtons,
    bookmark,
  }: Props = $props();
</script>

<div class={"grid grid-cols-[auto_1fr] max-w-full overflow-hidden my-1"}>
  <div class="grid grid-rows-[auto_1fr] p-1">
    <div>
      {@render icon?.()}
    </div>
    {@render seenOn?.()}
  </div>

  <div class="pt-1 max-w-full overflow-hidden">
    <div class="flex align-middle max-w-full overflow-x-hidden">
      <div class="flex items-center flex-wrap overflow-hidden max-w-full">
        {@render name?.()}
      </div>
      {@render time?.()}
      {@render bookmark?.()}
    </div>
    {#if status}
      <div class={`text-sm text-zinc-500`}>
        {@render status?.()}
      </div>{/if}
    <div class="max-w-full overflow-hidden flex flex-col gap-0.5">
      <div
        class=" text-sm text-magnum-300 flex break-all flex-wrap overflow-x-hidden gap-x-1 max-h-12 overflow-y-auto"
      >
        {@render replyUser?.()}
      </div>

      {@render reply?.()}
    </div>
    <div class="relative overflow-hidden mb-1.5">
      {@render content?.()}

      {#if warningText !== undefined}
        <WarningHide3 text={warningText} />
      {/if}
    </div>
    {@render actionButtons?.()}
  </div>
</div>
