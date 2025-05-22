<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href: string;
    className?: string;
    props?: { [key: string]: any };
    children: Snippet;
  }

  let { href, className = "", props = {}, children }: Props = $props();

  //有効なリンクかのチェックもする
  const checkSafe = () => {
    try {
      const check = href.match(/^https?:\/\//);
      if (!check) {
        href = "https://" + href;
      }
      const url = new URL(href.toString());
      return (
        url.protocol === "https:" ||
        url.protocol === "http:" ||
        url.protocol === "mailto:"
      );
    } catch {
      return false;
    }
  };
  const isSafe = checkSafe();
</script>

{#if isSafe}
  <a
    class={className}
    {href}
    title={href}
    target="_blank"
    rel="noopener noreferrer"
    {...props}>{@render children?.()}</a
  >
{:else}{@render children?.()}{/if}
