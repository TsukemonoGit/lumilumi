<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    clickAction: boolean;
    linkButtonTitle?: string;
    handleClickToChannel?: () => void | undefined;
    listAvatar: Snippet;
    listProps: { kind: number; name: string; about: string };
    userAvatar: Snippet;
    menu: Snippet;
  }

  let {
    clickAction,
    linkButtonTitle,
    handleClickToChannel,
    listAvatar,
    userAvatar,
    listProps,
    menu,
  }: Props = $props();
</script>

<div class="w-full grid grid-cols-[1fr_auto]">
  {#if clickAction}
    <button
      title={linkButtonTitle || ""}
      class="grid grid-cols-[auto_1fr] hover:opacity-75 active:opacity-50"
      onclick={handleClickToChannel}
    >
      <!--がぞう-->

      <div class="relative">
        {@render listAvatar?.()}
        <div
          class="absolute text-xs bottom-0 left-1 align-bottom text-magnum-900 dark:text-magnum-100 font-semibold bg-black/40 px-0.5"
        >
          kind:{listProps.kind}
        </div>
      </div>
      <!--てきすとたち-->
      <div class="ml-2 text-start flex flex-col">
        <div class="text-xl font-bold text-magnum-400">
          {listProps.name}
        </div>

        <div class="text-magnum-100">{listProps.about}</div>
      </div></button
    >{:else}
    <div class="grid grid-cols-[auto_1fr]">
      <!--がぞう-->

      <div class="relative">
        {@render listAvatar?.()}
        <div
          class="absolute text-xs bottom-0 left-1 align-bottom text-magnum-900 dark:text-magnum-100 font-semibold bg-black/40 px-0.5"
        >
          kind:{listProps.kind}
        </div>
      </div>
      <!--てきすとたち-->
      <div class="ml-2 text-start flex flex-col">
        <div class="text-xl font-bold text-magnum-400">
          {listProps.name}
        </div>

        <div class="text-magnum-100">{listProps.about}</div>
      </div>
    </div>
  {/if}

  <div class="flex flex-col justify-between items-center">
    {@render userAvatar?.()}
    {@render menu?.()}
  </div>
</div>
