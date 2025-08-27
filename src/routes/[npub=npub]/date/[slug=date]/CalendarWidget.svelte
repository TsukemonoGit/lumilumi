<script lang="ts">
  import { goto } from "$app/navigation";
  import { CalendarDate } from "@internationalized/date";
  import { createCalendar, melt } from "@melt-ui/svelte";
  import "./calendar.css";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { locale as l } from "@konemono/svelte5-i18n";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import { formatDate } from "$lib/func/util";
  interface Props {
    currentDate?: Date | null;
    pubkey?: string;
  }

  const { currentDate, pubkey }: Props = $props();

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
  const {
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
