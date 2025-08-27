<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    title?: string;
  }

  let {
    value = $bindable(),
    placeholder = $bindable("YYYY-MM-DD"),
    title,
  }: Props = $props();
</script>

<div class="flex flex-col items-start justify-center">
  {#if title}
    <div class="font-medium text-magnum-400">{title}</div>
  {/if}
  <input
    type="date"
    class="h-10 px-3 py-2 rounded-md border border-magnum-400/60"
    {placeholder}
    bind:value
  />
</div>
