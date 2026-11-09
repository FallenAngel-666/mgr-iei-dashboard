/**
 * ISO-8601 Weekly Reporting & Cycle Utilities for MGR IEI Student Chapter
 * Automatically handles year transitions (e.g., 2026 -> 2027), resets week numbering to Week 01,
 * and maintains continuous historical retention of all tasks and cloud records.
 */

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns ISO week number, ISO year, and official weekly tag (e.g. "2026-W45", "2027-W01")
 */
export function getISOWeekDetails(dateInput = new Date()) {
  const target = new Date(dateInput);
  target.setHours(0, 0, 0, 0);

  // ISO day: Mon = 1, Tue = 2, ..., Sun = 7
  const dayNr = (target.getDay() + 6) % 7;
  
  // Set target date to Thursday in the current week to determine the ISO year
  target.setDate(target.getDate() - dayNr + 3);
  const isoYear = target.getFullYear();

  // First Thursday of ISO year is always in Week 1
  const firstThursday = new Date(isoYear, 0, 4);
  const firstDayNr = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3);

  // Calculate week number
  const weekNumber = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000) / 7);
  const padWeek = String(weekNumber).padStart(2, '0');
  const tag = `${isoYear}-W${padWeek}`;

  return {
    year: isoYear,
    week: weekNumber,
    tag
  };
}

/**
 * Calculates Monday (start) and Sunday (end) for a given ISO year and week number
 */
export function getISOWeekDateRange(year, week) {
  // Jan 4th is always in week 1
  const simple = new Date(year, 0, 4);
  const day = (simple.getDay() + 6) % 7;
  const monday = new Date(year, 0, 4 - day + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startMonth = MONTH_NAMES[monday.getMonth()];
  const endMonth = MONTH_NAMES[sunday.getMonth()];
  const startDay = String(monday.getDate()).padStart(2, '0');
  const endDay = String(sunday.getDate()).padStart(2, '0');

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
}

/**
 * Generates options for the Weekly Status dropdown:
 * - Current Week (dynamically computed from today's real date)
 * - Recent weeks of current/previous year
 * - All historical weeks discovered in the cloud tasks register
 * - "All Recorded Weeks"
 */
export function generateWeekOptions(tasks = [], baseDate = new Date()) {
  const current = getISOWeekDetails(baseDate);
  const optionsMap = new Map();

  // 1. Current Week option
  const currentRange = getISOWeekDateRange(current.year, current.week);
  const currentLabel = `Current Week (Week ${current.week}) - ${currentRange}`;
  optionsMap.set(current.tag, {
    label: currentLabel,
    shortLabel: `Current Week (Week ${current.week})`,
    tag: current.tag,
    isCurrent: true
  });

  // 2. Next 2 upcoming weeks (for forward scheduling)
  for (let offset = 1; offset <= 2; offset++) {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + offset * 7);
    const details = getISOWeekDetails(nextDate);
    if (!optionsMap.has(details.tag)) {
      const range = getISOWeekDateRange(details.year, details.week);
      optionsMap.set(details.tag, {
        label: `Week ${details.week} (${range}) [Upcoming]`,
        shortLabel: `Week ${details.week} [Upcoming]`,
        tag: details.tag,
        isCurrent: false
      });
    }
  }

  // 3. Past 8 recent weeks
  for (let offset = 1; offset <= 8; offset++) {
    const pastDate = new Date(baseDate);
    pastDate.setDate(pastDate.getDate() - offset * 7);
    const details = getISOWeekDetails(pastDate);
    if (!optionsMap.has(details.tag)) {
      const range = getISOWeekDateRange(details.year, details.week);
      optionsMap.set(details.tag, {
        label: `Week ${details.week} (${range})`,
        shortLabel: `Week ${details.week}`,
        tag: details.tag,
        isCurrent: false
      });
    }
  }

  // 4. Any historical weekly tags recorded in existing tasks (e.g. from 2026 when in 2027)
  if (Array.isArray(tasks)) {
    tasks.forEach((t) => {
      if (t.weeklyTag && !optionsMap.has(t.weeklyTag) && t.weeklyTag !== 'all') {
        const match = t.weeklyTag.match(/^(\d{4})-W(\d{2})$/);
        if (match) {
          const yr = parseInt(match[1], 10);
          const wk = parseInt(match[2], 10);
          const range = getISOWeekDateRange(yr, wk);
          optionsMap.set(t.weeklyTag, {
            label: `Year ${yr} Week ${wk} (${range})`,
            shortLabel: `${yr}-W${match[2]}`,
            tag: t.weeklyTag,
            isCurrent: false
          });
        }
      }
    });
  }

  // Convert to sorted list (Current first, then chronologically descending)
  const list = Array.from(optionsMap.values());
  const currentItem = list.find((item) => item.isCurrent);
  const otherItems = list
    .filter((item) => !item.isCurrent)
    .sort((a, b) => b.tag.localeCompare(a.tag));

  return [
    currentItem,
    ...otherItems,
    { label: 'All Recorded Weeks (Cumulative)', shortLabel: 'All Weeks', tag: 'all', isCurrent: false }
  ];
}
