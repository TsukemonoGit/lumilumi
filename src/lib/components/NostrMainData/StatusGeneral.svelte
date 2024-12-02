<script lang="ts">
  import type Nostr from "nostr-typedef";

  import { userStatusStore } from "$lib/stores/stores";

  interface Props {
    pubkey: string;
    loading?: import("svelte").Snippet;
    children?: import("svelte").Snippet<[any]>;
  }

  let { pubkey, loading, children }: Props = $props();
  let data: Nostr.Event | undefined = $state();

  userStatusStore.subscribe((value) => {
    if (value) {
      data = value.get(pubkey)?.get("general");
    }
  });
  //$: if ($slicedEvent) {
  // const res: EventPacket | undefined = $queryClient.getQueryData([
  //   "userStatus",
  //   "general",
  //   pubkey,
  // ]);
  // if (res) {
  //   data = res;
  //   //console.log(data);
  //   //これだと一回TLに出てこないと設定変わらない
  //   createQuery({
  //     queryKey: ["userStatus", "general", pubkey],
  //     queryFn: () => res,
  //     //initialData: res,
  //     staleTime: Infinity,
  //     gcTime: Infinity,
  //   });
  // }
  //}

  interface $$Slots {
    default: { event: Nostr.Event };
    loading: Record<never, never>;
    error: { error: Error };
    nodata: Record<never, never>;
  }
</script>

{#if !data}
  {@render loading?.()}
{:else if data}
  {@render children?.({ event: data })}
{/if}
