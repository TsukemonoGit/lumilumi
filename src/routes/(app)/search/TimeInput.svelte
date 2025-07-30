<script lang="ts">
  interface Props {
    value: string;
    placeholder?: string;
    title?: string;
  }

  let { value = $bindable(), placeholder = "HH:MM", title }: Props = $props();
</script>

<div class="flex flex-col items-start justify-center">
  {#if title}
    <div class="font-medium text-magnum-400">{title}</div>
  {/if}
  <input
    type="time"
    class="h-10 px-3 py-2 rounded-md border border-magnum-400/60 time-input"
    {placeholder}
    bind:value
  />
</div>

<style>
  .time-input {
    color-scheme: light;
  }

  .time-input::-webkit-calendar-picker-indicator {
    filter: brightness(0) saturate(100%) invert(94%) sepia(8%) saturate(275%)
      hue-rotate(216deg) brightness(103%) contrast(103%);
    cursor: pointer;
  }
</style>
