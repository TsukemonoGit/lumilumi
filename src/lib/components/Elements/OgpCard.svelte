<script lang="ts">
  import { isvalidURL, type Ogp, getYoutubeVideoId } from "$lib/func/ogp";
  import { lumiSetting } from "$lib/stores/globalRunes.svelte";
  import Avatar from "svelte-boring-avatars";

  interface Props {
    contents: Ogp;
    url: string;
  }

  let { contents, url }: Props = $props();

  let imageURL = $state(contents.image);
  let hostname = $derived(isvalidURL(url) ? new URL(url).hostname : "");

  // YouTubeかどうかとビデオIDを取得
  let isYoutube = $derived(
    hostname.includes("youtube.com") || hostname === "youtu.be"
  );
  let youtubeVideoId = $derived(getYoutubeVideoId(url));

  // 表示するメディアの種類を判定
  let showImageOrVideo = $derived(lumiSetting.get().showImg);
  let showYoutubeEmbed = $derived(
    showImageOrVideo && isYoutube && youtubeVideoId
  );
  let showImage = $derived(
    showImageOrVideo && imageURL && imageURL !== "" && !showYoutubeEmbed
  );

  // ホスト名と追加情報の表示用
  function getHostInfo() {
    const memoText = contents.memo ? `${contents.memo} / ` : "";
    return `${memoText}${hostname}`;
  }
</script>

<a
  class="rounded-lg m-1 hover:opacity-80 z-20 break-all border border-magnum-400 overflow-hidden flex w-auto"
  href={url}
  title={url}
  target="_blank"
  rel="noopener noreferrer"
>
  {#if showYoutubeEmbed}
    <!-- YouTube埋め込み -->
    <blockquote class="w-full">
      <div class="aspect-video w-full max-h-64">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeVideoId}`}
          title="YouTube video player"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
          class="max-h-64"
        ></iframe>
      </div>
      <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
        <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
          {contents.title}
        </h2>
        <p
          class="line-clamp-3 text-xs text-magnum-400 max-w-full"
          style="white-space: pre-wrap; word-break: break-word;"
        >
          {contents.description}
        </p>
        <div class="flex flex-row-reverse">
          <img
            width="20"
            height="20"
            loading="lazy"
            class="object-contain w-5 pl-0.5 pr-0.5"
            src={contents.favicon}
            alt=""
          />
          <p class="text-xs text-magnum-300">{getHostInfo()}</p>
        </div>
      </div>
    </blockquote>
  {:else if showImage}
    <!-- 画像付きOGP -->
    <blockquote
      class="grid grid-cols-[0.5fr_1.5fr] divide-x divide-magnum-400 w-full"
    >
      <figure class="overflow-hidden flex items-center justify-center">
        <img
          loading="lazy"
          height="128"
          width="128"
          class="object-contain max-h-[8rem] max-w-full overflow-hidden"
          src={imageURL}
          alt=""
          onerror={() => (imageURL = "")}
        />
      </figure>

      <div class="p-0.5 pl-1 grid grid-rows-[auto_1fr] w-full">
        <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
          {contents.title}
        </h2>
        <p
          class="line-clamp-6 text-xs text-magnum-400 max-w-full"
          style="white-space: pre-wrap; word-break: break-word;"
        >
          {contents.description}
        </p>
        <div class="flex flex-row-reverse">
          <img
            width="20"
            height="20"
            loading="lazy"
            class="object-contain w-5 pl-0.5 pr-0.5"
            src={contents.favicon}
            alt=""
          />
          <p class="text-xs text-magnum-300">{getHostInfo()}</p>
        </div>
      </div>
    </blockquote>
  {:else}
    <!-- テキストのみのOGP -->
    <blockquote class="p-0.5 grid grid-rows-[auto_1fr] w-full">
      <h2 class="line-clamp-2 text-sm font-bold text-magnum-200">
        {contents.title}
      </h2>
      <p
        class="line-clamp-6 text-xs text-magnum-400 max-w-full"
        style="white-space: pre-wrap; word-break: break-word;"
      >
        {contents.description}
      </p>
      <div class="flex flex-row-reverse">
        <Avatar size={20} name={contents.favicon} variant="beam" />
        <p class="text-xs text-magnum-300">{getHostInfo()}</p>
      </div>
    </blockquote>
  {/if}
</a>
