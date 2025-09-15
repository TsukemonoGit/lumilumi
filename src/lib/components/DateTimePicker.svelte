<script lang="ts">
  interface Props {
    onChange?: (date: Date) => void;
  }

  let { onChange }: Props = $props();

  let selectedDate: string = $state("");
  let selectedTime: string = $state("");

  let combinedDateTime = $derived(
    selectedDate ? new Date(`${selectedDate}T${selectedTime || "00:00"}`) : null
  );

  function handleChange() {
    if (selectedDate && selectedTime && combinedDateTime && onChange) {
      onChange(combinedDateTime);
    }
  }
</script>

<div class="flex flex-col gap-2">
  <label class="flex flex-col">
    DATE
    <input
      type="date"
      bind:value={selectedDate}
      class="rounded-md border px-2 py-1"
      onchange={handleChange}
    />
  </label>

  <label class="flex flex-col">
    TIME
    <input
      type="time"
      bind:value={selectedTime}
      class="rounded-md border px-2 py-1"
      onchange={handleChange}
    />
  </label>
</div>
