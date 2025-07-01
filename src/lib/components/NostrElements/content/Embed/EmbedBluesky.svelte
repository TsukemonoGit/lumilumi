<script lang="ts">
  import OgpLoad from "../OgpLoad.svelte";

  interface Props {
    url: string;
    onError: () => void;
  }
  let { url, onError }: Props = $props();

  async function resolveHandleToDid(handle: string) {
    try {
      const response = await fetch(
        `https://api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${handle}`
      );
      if (!response.ok) throw new Error("Failed to resolve handle");
      const data = await response.json();
      return data.did;
    } catch (error) {
      console.error("Error resolving handle:", error);
      throw error;
    }
  }

  async function extractAtProtoInfo(url: string): Promise<string> {
    // Match profile post URLs like https://*/profile/username.bsky.social/post/postid
    const profileMatch = url.match(/\/profile\/([^\/]+)\/post\/([^\/]+)$/);
    if (profileMatch) {
      try {
        const handle = profileMatch[1];
        const postId = profileMatch[2];

        // ハンドルからDIDを解決
        const did = await resolveHandleToDid(handle);
        if (!did) throw new Error("Could not resolve handle to DID");

        // 正確なAT URIフォーマットを使用
        const uri = `at://${did}/app.bsky.feed.post/${postId}`;

        return uri;
      } catch (error) {
        console.error("Error processing AT Protocol URL:", error);
        throw error;
      }
    }

    throw new Error("Invalid AT Protocol URL format");
  }
</script>

{#await extractAtProtoInfo(url)}
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
