<script lang="ts">
  import { Tally1, Tally2, Tally3, Tally4 } from "lucide-svelte";

  interface Props {
    amount: number;
  }
  let { amount }: Props = $props();
</script>

<div class="relative h-5 w-5">
  <Tally4 class="absolute inset-0 opacity-10" />
  {#if amount >= 4}
    <Tally4 class="absolute inset-0 text-magnum-600" />
  {:else if amount === 3}
    <Tally3 class="absolute inset-0 text-magnum-600" />
  {:else if amount === 2}
    <Tally2 class="absolute inset-0 text-magnum-600" />
  {:else if amount === 1}
    <Tally1 class="absolute inset-0 text-magnum-600" />
  {/if}
</div>
