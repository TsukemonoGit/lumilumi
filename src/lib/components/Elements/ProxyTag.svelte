<script lang="ts">
  import { MessagesSquare, AtSign, MessageCircle } from "lucide-svelte";
  import Link from "./Link.svelte";

  export let proxyTag: string[];
</script>

<Link href={proxyTag[1]} className={"inline-flex flex-row  text-magnum-300"}>
  <MessageCircle size={16} />{proxyTag[2]}
</Link>
