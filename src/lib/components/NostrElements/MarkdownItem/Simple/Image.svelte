<script lang="ts">
  import type { Token } from "markdown-it/index.js";

  export let part: Token;

  // console.log("[image]", part);
</script>

<img
  loading="lazy"
  width="288"
  height="288"
  class=" max-w-[min(18rem,100%)] max-h-[18rem] object-contain"
  src={part?.attrs?.find((attr) => attr[0] === "src")?.[1] ?? ""}
  alt={part?.attrs?.find((attr) => attr[0] === "alt")?.[1] ?? ""}
  title={part?.attrs?.find((attr) => attr[0] === "title")?.[1] ?? ""}
/>
