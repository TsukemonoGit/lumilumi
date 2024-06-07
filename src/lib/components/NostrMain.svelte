<script lang="ts">
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

  import { queryClient } from "$lib/stores/stores";
  import NostrElements from "./NostrElements.svelte";
</script>

<QueryClientProvider client={$queryClient}
  ><NostrElements /></QueryClientProvider
>
