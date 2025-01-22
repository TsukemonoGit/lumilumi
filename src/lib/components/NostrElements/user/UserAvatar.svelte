<script lang="ts">
  import { followList } from "$lib/func/nostr";
  import { splitHexColorString } from "$lib/func/util";
  import { createAvatar, melt, type CreateAvatarProps } from "@melt-ui/svelte";
  import { untrack } from "svelte";
  import Avatar from "svelte-boring-avatars";
  interface Props {
    url: string | undefined;
    name: string | undefined;
    pubkey: string | undefined;
    size?: number;
    square?: boolean;
    title?: string;
    handleStateError?: any;
  }

  let {
    url,
    name,
    pubkey,
    size = 40,
    square = false,
    title = "",
    handleStateError = () => {},
  }: Props = $props();

  let avatarUrl = $derived.by(() => {
    if (!url) return "";
    try {
      const aUrl = new URL(url);
      if (aUrl.protocol === "data:") {
        // data: URLの場合はクエリパラメータを追加しない
        return url;
      }
      //フォロイーアイコンだけキャッシュ
      if (pubkey && pubkey in followList) {
        aUrl.hash = "cache"; // ハッシュを "cache" に設定
        //  aUrl.searchParams.set("type", "avatar"); // クエリパラメータを追加
      }
      return aUrl.toString(); // 修正した URL を設定
    } catch (e) {
      // URLのパースに失敗した場合は元のURLを返す
      return url;
    }
  });
  export const handleState: CreateAvatarProps["onLoadingStatusChange"] = ({
    curr,
    next,
  }) => {
    if (next === "error") {
      handleStateError();
    }
    return next;
  };

  const {
    elements: { image, fallback },
    options: { src },
  } = createAvatar({
    // svelte-ignore state_referenced_locally
    src: avatarUrl ?? "",
    onLoadingStatusChange: handleState,
  });

  $effect(() => {
    if (avatarUrl) {
      untrack(() => {
        src.set(avatarUrl);
      });
    }
  });
</script>

<div
  {title}
  class="relative flex items-center justify-center {!square
    ? 'rounded-full'
    : ''} bg-neutral-800 overflow-hidden"
  style="height: {size}px; width: {size}px;"
>
  <img
    use:melt={$image}
    alt="Avatar"
    class=" object-cover {!square ? 'rounded-full' : ''}"
    style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
  />
  <span use:melt={$fallback} class="absolute t-0 l-0 overflow-hidden"
    ><Avatar
      {size}
      {name}
      variant="beam"
      colors={pubkey ? splitHexColorString(pubkey) : undefined}
      {square}
    /></span
  >
</div>
