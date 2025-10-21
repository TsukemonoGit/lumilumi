<script lang="ts">
  interface Props {
    value?: number;
    onChange?: (date: Date) => void;
    label?: string;
    required?: boolean;
  }

  let { value, onChange, label, required = false }: Props = $props();

  let dateTimeValue: string = $state(value ? formatDateTimeLocal(value) : "");

  function formatDateTimeLocal(unixTime: number): string {
    const date = new Date(unixTime * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  let dateObject = $derived.by(() => {
    if (!dateTimeValue) return null;
    return new Date(dateTimeValue);
  });

  let unixTime = $derived.by(() => {
    if (!dateObject) return null;
    return Math.floor(dateObject.getTime() / 1000);
  });

  function handleSubmit() {
    if (dateObject && onChange) {
      onChange(dateObject);
    }
  }
</script>

<div class="flex flex-col gap-2 mr-2">
  {#if label}
    <span class="text-sm font-medium">{label}</span>
  {/if}
  <div class="grid grid-cols-[1fr_auto] gap-1">
    <input
      type="datetime-local"
      bind:value={dateTimeValue}
      {required}
      class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
    <button
      type="button"
      onclick={handleSubmit}
      disabled={!dateTimeValue}
      class="rounded-lg bg-magnum-500 px-4 py-2 text-sm font-medium hover:bg-magnum-600 focus:outline-none focus:ring-2 text-magnum-900 focus:ring-magnum-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      OK
    </button>
  </div>

  {#if unixTime !== null}
    <div class="text-xs text-gray-500">
      UNIX: {unixTime}
    </div>
  {/if}
</div>
