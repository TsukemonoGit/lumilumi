<script lang="ts">
  interface Props {
    dateValue: string;
    timeValue: string;
    title?: string;
  }

  let {
    dateValue = $bindable(),
    timeValue = $bindable(),
    title = "Until",
  }: Props = $props();
</script>

<div class="flex flex-col items-start justify-center">
  <div class="font-medium text-magnum-400">{title}</div>
  <div class="flex gap-2 items-center">
    <input
      type="date"
      class="h-10 px-3 py-2 rounded-md border border-magnum-400/60"
      placeholder="YYYY-MM-DD"
      bind:value={dateValue}
    />
    <input
      type="time"
      class="h-10 px-3 py-2 rounded-md border border-magnum-400/60"
      placeholder="HH:MM"
      bind:value={timeValue}
    />
  </div>
</div>
