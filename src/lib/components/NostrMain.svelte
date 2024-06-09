<script lang="ts">
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

  import { queryClient } from "$lib/stores/stores";
  import NostrElements from "./NostrElements.svelte";
  import OpenPostWindow from "./OpenPostWindow.svelte";
</script>

<QueryClientProvider client={$queryClient}
  ><NostrElements /></QueryClientProvider
>
<div class="fixed right-auto bottom-5 z-10">
  <OpenPostWindow />
</div>
