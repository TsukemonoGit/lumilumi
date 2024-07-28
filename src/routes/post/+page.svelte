<script lang="ts">
  import { page } from "$app/stores";
  import OpenPostWindow from "$lib/components/OpenPostWindow.svelte";
  import { additionalPostOptions, postWindowOpen } from "$lib/stores/stores";

  // Web Share Target API
  //https://developer.mozilla.org/ja/docs/Web/Manifest/share_target
  //マニフェストからのやつ

  const title = $page.url.searchParams.get("title");
  const text = $page.url.searchParams.get("text");
  const url = $page.url.searchParams.get("url");
  const sharedContent = [title, text, url]
    .filter((param) => param !== null)
    .join("\n");

  $additionalPostOptions = {
    tags: [],
    addableUserList: [],
    defaultUsers: [],
    warningText: undefined,
    content: sharedContent,
  };
  $postWindowOpen = true;
</script>

<div class="postWindow">
  <OpenPostWindow
    options={{
      tags: [],
      kind: 1,
    }}
  />
</div>
