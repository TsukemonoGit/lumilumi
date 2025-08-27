<script lang="ts">
  import type { Snippet } from "svelte";
  import ContentParts from "../../content/ContentParts.svelte";

  interface Props {
    clickAction: boolean;
    linkButtonTitle?: string;
    handleClickToChannel?: () => void | undefined;
    listAvatar: Snippet;
    listProps: {
      kind: number;
      name: string;
      about: string;
      kategories?: string[];
    };
    userAvatar: Snippet;
    menu: Snippet;
  }

  const {
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
  <!-- コンテンツ部分を共通化 -->
  {#snippet content()}
    <div class="grid grid-cols-[auto_1fr]">
      <!-- 画像 -->
      <div class="relative">
        {@render listAvatar?.()}
        <div
          class="absolute text-xs bottom-0 left-1 align-bottom text-magnum-900 dark:text-magnum-100 font-semibold bg-black/40 px-0.5"
        >
          kind:{listProps.kind}
        </div>
      </div>

      <!-- テキスト -->
      <div class="ml-2 text-start flex flex-col">
        <div class="text-lg font-bold text-magnum-400">
          {listProps.name}
        </div>

        <div class="text-sm text-magnum-100 max-w-full">
          {#if clickAction}
            <div
              class="line-clamp-4"
              style="white-space: pre-wrap; word-break: break-word;"
            >
              {listProps.about}
            </div>
          {:else}
            <ContentParts
              event={{ content: listProps.about, kind: listProps.kind }}
              displayMenu={false}
              depth={0}
              repostable={false}
            />
          {/if}
        </div>

        {#if listProps.kategories}
          <div
            class="mr-1 mt-auto flex gap-2 justify-end text-magnum-100 text-sm"
          >
            {#each listProps.kategories as kategory}
              <div>{kategory}</div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/snippet}

  <!-- クリック可能かどうかで分岐 -->
  {#if clickAction}
    <button
      title={linkButtonTitle || ""}
      class="hover:opacity-75 active:opacity-50"
      onclick={handleClickToChannel}
    >
      {@render content()}
    </button>
  {:else}
    {@render content()}
  {/if}

  <div class="flex flex-col justify-between items-center">
    {@render userAvatar?.()}
    {@render menu?.()}
  </div>
</div>
