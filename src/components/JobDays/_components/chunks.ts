// Fetching a long window as a run of weekly windows, and stitching the answers
// back into one.
//
// The API answers for any window of days, but a long window costs a long query
// and every page of the calendar re-asked for the whole thing. So the viewer
// asks for Sunday-to-Saturday weeks instead: a month view is five or six of
// them, each small enough to answer quickly and each cached on its own, so
// paging to the next month fetches only the weeks not already in hand.
//
// That only works because the API selects, for a window, every job open at any
// point inside it (see the module note in the API's _util.py). Each week's
// answer is then complete for its own days, and merging is mostly concatenation.
// The few figures that are not per-day -- opening balances, window-wide totals,
// the live queue -- are taken from the one week that owns them, as noted at
// each step below.

import type { ClusterSeries, StackedBarData } from "../types";
import type { ActivityRow, CarryRow, ClusterInfo, Cohort, DayData, StateCounts } from "./dayCards";
import { WINDOW_START_DAY, dayKeyOf, parseDayKey } from "./dayCards";
import type { BatchInfo } from "./grouping";

/** A [start, end) pair of "YYYY-MM-DD" days, `end` exclusive, as the API takes them. */
export interface DayRange {
  start: string;
  end: string;
}

/** The API's default window: this many days back from today, both ends inclusive. */
export const DEFAULT_DAYS_BACK = 34;

/** How far back the calendar may be paged. Matches the API's longest range. */
export const MAX_HISTORY_DAYS = 366;

/** `day` shifted by whole calendar days, DST-safe. */
export function addDays(day: string, delta: number): string {
  const date = parseDayKey(day);
  return dayKeyOf(new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta));
}

/** The local calendar date, "YYYY-MM-DD". */
export function todayKey(): string {
  return dayKeyOf(new Date());
}

/** The window the viewer opens with when nothing names one: the API's default. */
export function defaultRange(today = todayKey()): DayRange {
  return { start: addDays(today, -DEFAULT_DAYS_BACK), end: addDays(today, 1) };
}

/**
 * The Sunday on or before `day`. Weeks are cut Sunday to Saturday, so a week's
 * window is [Sunday, next Sunday) in the API's half-open terms.
 */
export function weekStart(day: string): string {
  return addDays(day, -parseDayKey(day).getDay());
}

/**
 * The weekly windows that cover a range, clipped at today.
 *
 * Each is a whole Sunday-to-Saturday week, so the same week is the same request
 * whichever range asked for it and the browser's cache can answer it again. The
 * last week is cut off at the end of today: the API refuses a window that starts
 * in the future, and a window that ran past today would give the calendar days
 * that have not happened yet. A range entirely in the future yields nothing.
 */
export function weekChunks(range: DayRange, today = todayKey()): DayRange[] {
  const limit = addDays(today, 1);
  const end = range.end < limit ? range.end : limit;
  const chunks: DayRange[] = [];
  for (let start = weekStart(range.start); start < end; start = addDays(start, 7)) {
    const weekEnd = addDays(start, 7);
    chunks.push({ start, end: weekEnd < end ? weekEnd : end });
  }
  return chunks;
}

/**
 * The range the calendar needs loaded to draw the month containing `monthStart`:
 * the whole month, which weekChunks then widens to whole weeks. Clipped at today,
 * and never earlier than the calendar may be paged.
 */
export function monthRange(monthStart: Date, today = todayKey()): DayRange | null {
  const first = dayKeyOf(new Date(monthStart.getFullYear(), monthStart.getMonth(), 1));
  const next = dayKeyOf(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1));
  const floor = addDays(today, -MAX_HISTORY_DAYS);
  const start = first < floor ? floor : first;
  const end = next < addDays(today, 1) ? next : addDays(today, 1);
  return start < end ? { start, end } : null;
}

/** The smallest range covering both, or the one that exists. */
export function unionRange(a: DayRange | null, b: DayRange | null): DayRange | null {
  if (!a) return b;
  if (!b) return a;
  return { start: a.start < b.start ? a.start : b.start, end: a.end > b.end ? a.end : b.end };
}

function byFirstDay<T extends { days: string[] }>(parts: T[]): T[] {
  return [...parts].filter((part) => part.days.length > 0).sort((a, b) => (a.days[0] < b.days[0] ? -1 : 1));
}

function latest(a: string, b: string): string {
  return a > b ? a : b;
}

function mergeBatches(parts: BatchInfo[][]): BatchInfo[] {
  const byId = new Map<string, BatchInfo & { members: Set<number> }>();
  for (const batches of parts) {
    for (const batch of batches) {
      const entry = byId.get(batch.id);
      if (entry) {
        entry.total += batch.total;
        batch.clusters.forEach((cluster) => entry.members.add(cluster));
      } else {
        byId.set(batch.id, { ...batch, members: new Set(batch.clusters) });
      }
    }
  }
  return [...byId.values()]
    .map(({ members, ...batch }) => ({ ...batch, clusters: [...members].sort((a, b) => a - b) }))
    .sort((a, b) => b.total - a.total || a.id.localeCompare(b.id));
}

/**
 * Stitch consecutive weekly series into one window-long series.
 *
 * The bins are positional -- bin 0 is the first window of the first day -- so
 * each week's bins are shifted by where its first day falls in the merged run of
 * days. The opening balance is the first week's alone: every later week's
 * opening balance is already implied by the placements before it.
 */
export function mergeSeries(parts: StackedBarData[]): StackedBarData {
  const sorted = byFirstDay(parts);
  if (sorted.length === 0) throw new Error("mergeSeries needs at least one non-empty part");
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const binsPerDay = first.binsPerDay;

  const days: string[] = [];
  const offsets: number[] = [];
  for (const part of sorted) {
    offsets.push(days.length * binsPerDay);
    days.push(...part.days);
  }

  const clusters = new Map<number, ClusterSeries & { placedBins: Map<number, number>; completedBins: Map<number, number>; removedBins: Map<number, number> }>();
  sorted.forEach((part, index) => {
    const offset = offsets[index];
    for (const series of part.series) {
      let entry = clusters.get(series.cluster);
      if (!entry) {
        entry = {
          cluster: series.cluster,
          batch: series.batch,
          total: 0,
          // Only the first week's opening balance counts; see above.
          openingActive: index === 0 ? series.openingActive : 0,
          placed: [],
          completed: [],
          removed: [],
          placedBins: new Map(),
          completedBins: new Map(),
          removedBins: new Map(),
        };
        clusters.set(series.cluster, entry);
      }
      const shift = (into: Map<number, number>, bins: [number, number][]) => {
        for (const [bin, count] of bins) into.set(bin + offset, (into.get(bin + offset) ?? 0) + count);
      };
      shift(entry.placedBins, series.placed);
      shift(entry.completedBins, series.completed);
      shift(entry.removedBins, series.removed);
    }
  });

  const toSparse = (bins: Map<number, number>): [number, number][] =>
    [...bins.entries()].sort((a, b) => a[0] - b[0]);
  const series: ClusterSeries[] = [...clusters.values()]
    .map(({ placedBins, completedBins, removedBins, ...entry }) => {
      const placed = toSparse(placedBins);
      return {
        ...entry,
        placed,
        completed: toSparse(completedBins),
        removed: toSparse(removedBins),
        total: entry.openingActive + placed.reduce((sum, [, count]) => sum + count, 0),
      };
    })
    .sort((a, b) => a.cluster - b.cluster);

  return {
    owner: first.owner,
    anonymized: false,
    generatedAt: sorted.reduce((acc, part) => latest(acc, part.generatedAt), first.generatedAt),
    timezone: first.timezone,
    days,
    binHours: first.binHours,
    binsPerDay,
    series,
    batches: mergeBatches(sorted.map((part) => part.batches ?? [])),
    sources: {
      adstash: first.sources.adstash,
      // The live queue is one queue however many weeks were asked about; the
      // last week saw the most of it. Errors from any week are worth reporting.
      condorQ: {
        ...last.sources.condorQ,
        errors: [...new Set(sorted.flatMap((part) => part.sources.condorQ.errors ?? []))],
      },
    },
  };
}

function addStates(a: StateCounts, b: StateCounts): StateCounts {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

/**
 * Stitch consecutive weekly day summaries into one.
 *
 * Per-day rows -- activity and the end-of-day census -- concatenate. Cohorts need
 * care: a week reports a cohort placed before it opened under its real day, but
 * counting only the jobs still open when the week began. Walking the weeks in
 * order, the jobs that had already finished by then are exactly the terminal
 * counts in the previous week's last reading of that cohort, so they are added
 * back; the week that contains the placement day is authoritative for the
 * cohort's size. Window-wide scalars come from the weeks that own them.
 */
export function mergeDaySummaries(parts: DayData[]): DayData {
  const sorted = byFirstDay(parts);
  if (sorted.length === 0) throw new Error("mergeDaySummaries needs at least one non-empty part");
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const days = sorted.flatMap((part) => part.days);

  const clusters = new Map<number, ClusterInfo>();
  const cohorts = new Map<string, Cohort>();
  const activity: ActivityRow[] = [];
  const carry: CarryRow[] = [];
  const cohortKey = (row: { cluster: number; day: string }) => `${row.cluster}|${row.day}`;
  // Terminal counts per cohort as of the end of the weeks merged so far.
  const settled = new Map<string, [number, number]>();

  sorted.forEach((part, index) => {
    const weekDays = new Set(part.days);
    const lastDay = part.days[part.days.length - 1];

    for (const info of part.clusters) {
      const entry = clusters.get(info.id);
      if (entry) {
        entry.total += info.total;
        if (info.firstQueued && (!entry.firstQueued || info.firstQueued < entry.firstQueued)) {
          entry.firstQueued = info.firstQueued;
        }
      } else {
        clusters.set(info.id, { ...info });
      }
    }

    for (const row of part.cohorts) {
      const key = cohortKey(row);
      const existing = cohorts.get(key);
      if (weekDays.has(row.day)) {
        // This week placed the cohort: it has the whole of it.
        cohorts.set(key, { ...row, asOf: { ...row.asOf } });
        continue;
      }
      const [doneCompleted, doneRemoved] = settled.get(key) ?? [0, 0];
      const asOf: Record<string, StateCounts> = {};
      for (const [day, states] of Object.entries(row.asOf)) {
        asOf[day] = addStates(states, [0, 0, doneCompleted, doneRemoved]);
      }
      if (existing) {
        Object.assign(existing.asOf, asOf);
      } else {
        // Placed before anything loaded: only its survivors are known.
        cohorts.set(key, { ...row, queued: row.queued + doneCompleted + doneRemoved, asOf });
      }
    }

    // What each cohort had finished by the end of this week, for the next one.
    for (const cohort of cohorts.values()) {
      const reading = cohort.asOf[lastDay];
      if (reading) settled.set(cohortKey(cohort), [reading[2], reading[3]]);
    }

    activity.push(...part.activity);
    for (const row of part.carry ?? []) {
      // Only the first week's opening census is the window's opening census;
      // every later one repeats the previous week's last day.
      if (row.day === WINDOW_START_DAY && index > 0) continue;
      carry.push(row);
    }
  });

  return {
    owner: first.owner,
    anonymized: false,
    generatedAt: sorted.reduce((acc, part) => latest(acc, part.generatedAt), first.generatedAt),
    timezone: first.timezone,
    days,
    clusters: [...clusters.values()].sort((a, b) => b.total - a.total || a.id - b.id),
    batches: mergeBatches(sorted.map((part) => part.batches ?? [])),
    cohorts: [...cohorts.values()],
    activity,
    carry,
    sources: {
      adstash: {
        ...first.sources.adstash,
        // Records read across the weeks. A job that outlived a week boundary
        // was read on both sides of it, so this is reads, not distinct jobs.
        terminalRecords: sorted.reduce((sum, part) => sum + part.sources.adstash.terminalRecords, 0),
      },
      condorQ: {
        ...last.sources.condorQ,
        errors: [...new Set(sorted.flatMap((part) => part.sources.condorQ.errors ?? []))],
      },
    },
    // Placements add up across weeks: a job is placed on exactly one day.
    counted: sorted.reduce((sum, part) => sum + part.counted, 0),
    queries: sorted.length,
  };
}
