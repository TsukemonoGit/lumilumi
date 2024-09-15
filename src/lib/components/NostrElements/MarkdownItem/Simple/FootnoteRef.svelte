<script lang="ts">
  import type { Token } from "markdown-it/index.js";

  export let part: Token;

  // $: console.log(part);
</script>

<a
  href="#footnote-def-{part.meta.id}"
  id="footnote-ref-{part.meta.id}"
  class="footnote-ref"
>
  <sup>[{part.meta.id}]</sup>
</a>

<style lang="postcss">
  .footnote-ref {
    font-size: 0.9em;
    color: theme(colors.magnum.400);
  }
</style>
