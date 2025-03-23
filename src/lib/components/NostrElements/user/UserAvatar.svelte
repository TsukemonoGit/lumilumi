<script lang="ts">
  import { splitHexColorString } from "$lib/func/util";
  import { followList } from "$lib/stores/globalRunes.svelte";

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
      if (pubkey && followList.get().has(pubkey)) {
        aUrl.hash = "cache"; // ハッシュを "cache" に設定
        //  aUrl.searchParams.set("type", "avatar"); // クエリパラメータを追加
      }
      return aUrl.toString(); // 修正した URL を設定
    } catch (e) {
      // URLのパースに失敗した場合は元のURLを返す
      return url;
    }
  });

  let loadingStatus: "loading" | "error" | "loaded" = $state("loading");

  $effect(() => {
    if (loadingStatus === "error") {
      handleStateError();
    }
  });
</script>

{#if avatarUrl && avatarUrl !== ""}
  <div
    {title}
    class="relative flex items-center justify-center {!square
      ? 'rounded-full'
      : ''} bg-neutral-800 overflow-hidden"
    style="height: {size}px; width: {size}px;"
  >
    <img
      src={avatarUrl}
      onload={() => (loadingStatus = "loaded")}
      onerror={() => (loadingStatus = "error")}
      alt={name}
      class=" object-cover {!square ? 'rounded-full' : ''}"
      style="height: 100%; width: 100%; object-fit: cover; object-position: center;"
      loading="lazy"
    />
    {#if loadingStatus === "error" || loadingStatus === "loading"}
      <span class="absolute t-0 l-0 overflow-hidden"
        ><Avatar
          {size}
          {name}
          variant="beam"
          colors={pubkey ? splitHexColorString(pubkey) : undefined}
          {square}
        /></span
      >{/if}
  </div>
{:else}
  <Avatar
    {size}
    {name}
    variant="beam"
    colors={pubkey ? splitHexColorString(pubkey) : undefined}
    {square}
  />
{/if}
