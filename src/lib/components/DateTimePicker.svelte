<script lang="ts">
  interface Props {
    onChange?: (date: Date) => void;
  }

  let { onChange }: Props = $props();

  let selectedDate: string = $state("");
  let selectedTime: string = $state("");

  let combinedDateTime = $derived(
    selectedDate && selectedTime
      ? new Date(`${selectedDate}T${selectedTime}`)
      : null
  );

  function handleChange() {
    if (combinedDateTime && onChange) {
      onChange(combinedDateTime);
    }
  }
</script>

<div class="flex flex-col gap-2">
  <label class="flex flex-col">
    日付
    <input
      type="date"
      bind:value={selectedDate}
      class="rounded-md border px-2 py-1"
      onchange={handleChange}
    />
  </label>

  <label class="flex flex-col">
    時間
    <input
      type="time"
      bind:value={selectedTime}
      class="rounded-md border px-2 py-1"
      onchange={handleChange}
    />
  </label>
</div>
