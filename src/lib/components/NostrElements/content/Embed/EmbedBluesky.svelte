<script lang="ts">
  import OgpLoad from "../OgpLoad.svelte";

  interface Props {
    url: string;
    onError: () => void;
  }
  let { url, onError }: Props = $props();

  async function resolveHandleToDid(handle: string): Promise<string> {
    const response = await fetch(
      `https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`
    );
    if (!response.ok) throw new Error("Failed to resolve handle");
    const data = await response.json();
    return data.did;
  }

  async function extractBskyUri(url: string): Promise<string> {
    const match = url.match(/bsky\.app\/profile\/([^\/]+)\/post\/([^\/]+)/);
    if (!match) {
      onError();
      throw new Error("Invalid bsky.app URL format");
    }

    const [, handle, postId] = match;
    const did = await resolveHandleToDid(handle);

    return `at://${did}/app.bsky.feed.post/${postId}`;
  }
</script>

{#await extractBskyUri(url)}
  <OgpLoad {url} />
{:then uri}
  <blockquote
    class="bluesky-embed"
    data-bluesky-uri={uri}
    data-bluesky-embed-color-mode="system"
  >
    <OgpLoad {url} />
    <script
      async
      src="https://embed.bsky.app/static/embed.js"
      charset="utf-8"
    ></script>
  </blockquote>
{:catch}
  <OgpLoad {url} />
{/await}
