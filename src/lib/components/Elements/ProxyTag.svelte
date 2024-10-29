<script lang="ts">
  import { MessageCircle } from "lucide-svelte";
  import Link from "./Link.svelte";

  export let proxyTag: string[];
</script>

<Link
  href={proxyTag[1]}
  className={"inline-flex  float-end flex-row  text-magnum-500/75 hover:underline hover:text-magnum-400/80 items-center text-sm font-semibold"}
>
  <MessageCircle size={16} />{proxyTag[2]}
</Link>
