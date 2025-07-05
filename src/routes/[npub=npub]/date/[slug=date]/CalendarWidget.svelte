<script lang="ts">
  import { goto } from "$app/navigation";
  import { CalendarDate } from "@internationalized/date";
  import { createCalendar, melt } from "@melt-ui/svelte";
  import type { DateValue } from "@internationalized/date";

  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { locale as l } from "@konemono/svelte5-i18n";
  import { page } from "$app/state";
  import { onMount, tick } from "svelte";
  import { formatDate } from "$lib/func/util";
  interface Props {
    currentDate?: Date | null;
    pubkey?: string;
  }

  let { currentDate, pubkey }: Props = $props();

  function toCalendarDate(date: Date): CalendarDate {
    return new CalendarDate(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
  }

  function updateDateInPath(currentPath: string, newDateString: string) {
    const segments = currentPath.split("/").filter(Boolean);

    const dateSegmentIndex = segments.findIndex(
      (segment: string, index: number) => {
        return (
          segment === "date" &&
          index < segments.length - 1 &&
          /^\d{4}-\d{2}-\d{2}$/.test(segments[index + 1])
        );
      }
    );

    if (dateSegmentIndex !== -1) {
      segments[dateSegmentIndex + 1] = newDateString;
    } else {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment === "date") {
        segments.push(newDateString);
      } else {
        segments.push("date", newDateString);
      }
    }

    return "/" + segments.join("/");
  }

  // Melt UIのカレンダーを作成
  let {
    elements: { calendar, heading, grid, cell, prevButton, nextButton },
    states: { months, headingValue, weekdays },
    helpers: { isDateDisabled, isDateUnavailable },
    options: { locale },
  } = createCalendar({
    defaultValue: currentDate ? toCalendarDate(currentDate) : undefined,
    locale: $l,
    isDateDisabled: (date) => {
      const now = new Date();
      now.setHours(0, 0, 0, 0); // 当日 0:00 にリセット
      const d = date.toDate(localTimezone);

      return d.getTime() > now.getTime(); // 今日より後なら true（無効化）
    },

    onValueChange: ({ curr, next }) => {
      if (!next) return curr;

      const dateString = formatDate(next.toDate(localTimezone));
      const newPath = updateDateInPath(page.url.pathname, dateString);

      goto(newPath);
      return next;
    },
  });

  // 日付クリック処理
  const handleDateClick = (date: Date) => {
    const dateString = formatDate(date);
    const currentPath = page.url.pathname;
    const pathParts = currentPath.split("/");

    // 最後の部分が日付なら置き換え、それ以外なら追加
    const lastPart = pathParts[pathParts.length - 1];
    if (/^\d{4}-\d{2}-\d{2}$/.test(lastPart)) {
      pathParts[pathParts.length - 1] = dateString;
    } else {
      pathParts.push(dateString);
    }
    goto(pathParts.join("/"));
  };

  // 曜日のスタイル
  const getDayStyle = (dayIndex: number): string => {
    if (dayIndex === 0) return "text-red-500"; // 日曜日
    if (dayIndex === 6) return "text-blue-500"; // 土曜日
    return "text-neutral-100";
  };
  let localTimezone: string = $state("");
  onMount(() => {
    localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  });
</script>

<div class="w-full flex justify-center">
  {#if localTimezone}
    <div use:melt={$calendar}>
      <header>
        <button use:melt={$prevButton}>
          <ChevronLeft size={24} />
        </button>
        <div use:melt={$heading}>
          {$headingValue}
        </div>
        <button use:melt={$nextButton}>
          <ChevronRight size={24} />
        </button>
      </header>

      <!-- カレンダー本体 -->
      {#each $months as month}
        <table use:melt={$grid} class="w-full">
          <thead>
            <tr>
              {#each $weekdays as day, index}
                <th
                  class="text-center text-sm font-medium py-2 {getDayStyle(
                    index
                  )}"
                >
                  {day}
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each month.weeks as weekDates}
              <tr>
                {#each weekDates as date}
                  <td
                    role="gridcell"
                    aria-disabled={$isDateDisabled(date) ||
                      $isDateUnavailable(date)}
                  >
                    <div use:melt={$cell(date, month.value)}>
                      {date.day}
                    </div>
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      {/each}
    </div>
  {/if}
</div>

<style lang="postcss">
  [data-melt-calendar] {
    @apply w-fit rounded-lg bg-neutral-950 p-3 text-magnum-200 shadow-sm;
  }

  header {
    @apply flex items-center justify-between pb-2;
  }

  header + div {
    @apply flex items-center gap-8;
  }

  [data-melt-calendar-prevbutton] {
    @apply rounded-lg p-1 transition-all hover:bg-magnum-900;
  }

  [data-melt-calendar-nextbutton] {
    @apply rounded-lg p-1 transition-all hover:bg-magnum-900;
  }

  [data-melt-calendar-heading] {
    @apply font-semibold text-magnum-200;
  }

  th {
    @apply text-sm font-semibold text-magnum-200;

    & div {
      @apply flex h-6 w-6 items-center justify-center p-4;
    }
  }

  [data-melt-calendar-grid] {
    @apply w-full;
  }

  [data-melt-calendar-cell] {
    @apply flex h-6 w-6 cursor-pointer select-none items-center justify-center rounded-lg p-4 hover:bg-magnum-900 focus:ring focus:ring-magnum-600 data-[outside-visible-months]:pointer-events-none data-[outside-visible-months]:cursor-default data-[range-highlighted]:bg-magnum-200 data-[selected]:bg-magnum-700 data-[selected]:text-magnum-100 data-[disabled]:opacity-40 data-[outside-visible-months]:opacity-40 data-[outside-visible-months]:hover:bg-transparent;
  }

  [data-melt-calendar-cell][data-outside-month="true"][data-outside-visible-months="true"] {
    @apply opacity-0;
  }
</style>
