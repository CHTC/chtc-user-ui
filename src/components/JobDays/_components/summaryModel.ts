// The numbers behind the summary panel beside the calendar: yesterday, the
// days the bars are scaled to, the standing queue now, and when it might clear.
//
// Everything here is arithmetic over the same filtered per-day models the
// calendar draws from -- slices, levels, outcomes -- so the panel always agrees
// with the grid: pick a cluster and both narrow; drag a range and both follow.
// Nothing is fetched and nothing is inferred that the bake does not measure,
// with the one exception of the projection, which is a trailing average and
// says so.

import type { DayLevel } from "./binModel";
import { addDays } from "./chunks";
import type { DayData, DayOutcome, DayQueue, DaySlice } from "./dayCards";
import { isEmptySlice } from "./dayCards";
import { inFilter, type ClusterFilter } from "./grouping";

/** Transitions over some days: placed, completed, removed. */
export interface Totals {
  placed: number;
  completed: number;
  removed: number;
}

export function sumTotals(slices: Map<string, DaySlice>, days: string[]): Totals {
  const out: Totals = { placed: 0, completed: 0, removed: 0 };
  for (const day of days) {
    const slice = slices.get(day);
    if (!slice) continue;
    out.placed += slice.queued;
    out.completed += slice.completed;
    out.removed += slice.removed;
  }
  return out;
}

/**
 * The latest loaded day before the as-of day. The as-of day is still in
 * progress and would understate every count, so "yesterday" is the last day
 * whose numbers are final.
 */
export function lastCompleteDay(days: string[], asOf: string): string | null {
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] < asOf) return days[i];
  }
  return null;
}

export interface YesterdaySummary {
  day: string;
  totals: Totals;
  /** Distinct jobs that moved; not the sum of the totals. */
  changed: number;
  /** The queue at the day's close, split into arrived-today and carried. */
  queue: DayQueue | null;
  /** How the jobs open at the day's start fared by its end. */
  outcome: DayOutcome | null;
}

export function buildYesterday(
  slices: Map<string, DaySlice>,
  fills: Map<string, DayOutcome> | null,
  day: string | null,
): YesterdaySummary | null {
  if (!day) return null;
  const slice = slices.get(day);
  if (!slice) return null;
  const outcome = fills?.get(day) ?? null;
  return {
    day,
    totals: sumTotals(slices, [day]),
    changed: slice.changed,
    queue: slice.queue,
    outcome: outcome?.hasData ? outcome : null,
  };
}

export interface ScopeSummary {
  /** The loaded days in scope, ascending. */
  days: string[];
  totals: Totals;
  /**
   * The same totals over the run of days of the same length ending just before
   * the scope, for the comparison; null when those days are not all loaded.
   */
  previous: Totals | null;
  /** Open jobs as the scope opened and as it closed. */
  queueOpen: number | null;
  queueClose: number | null;
  /** The highest the queue stood in the scope, and on which day. */
  peakQueue: { day: string; value: number } | null;
  /** The day with the most completions. */
  busiest: { day: string; completed: number } | null;
  /** Days on which anything at all happened. */
  activeDays: number;
  /** Completions per day, for the sparkline. */
  dailyCompleted: { day: string; value: number }[];
}

/** The highest level a day's trace reaches. */
function dayPeak(level: DayLevel): number {
  return Math.max(level.start, ...level.ends);
}

export function buildScopeSummary(
  slices: Map<string, DaySlice>,
  levels: Map<string, DayLevel> | null,
  loadedDays: string[],
  inScope: (day: string) => boolean,
): ScopeSummary {
  const days = loadedDays.filter(inScope);
  const totals = sumTotals(slices, days);

  // The comparison window: as many days again, ending the day before the
  // scope began. Only when every one of them is loaded, or the comparison
  // would be against a partial window and read as a drop.
  let previous: Totals | null = null;
  if (days.length > 0) {
    const loaded = new Set(loadedDays);
    const before: string[] = [];
    for (let i = 1; i <= days.length; i++) before.push(addDays(days[0], -i));
    if (before.every((day) => loaded.has(day))) previous = sumTotals(slices, before);
  }

  let queueOpen: number | null = null;
  let queueClose: number | null = null;
  let peakQueue: ScopeSummary["peakQueue"] = null;
  if (levels && days.length > 0) {
    const first = levels.get(days[0]);
    const last = levels.get(days[days.length - 1]);
    queueOpen = first ? first.start : null;
    queueClose = last && last.ends.length > 0 ? last.ends[last.ends.length - 1] : null;
    for (const day of days) {
      const level = levels.get(day);
      if (!level) continue;
      const value = dayPeak(level);
      if (!peakQueue || value > peakQueue.value) peakQueue = { day, value };
    }
  }

  let busiest: ScopeSummary["busiest"] = null;
  let activeDays = 0;
  const dailyCompleted: ScopeSummary["dailyCompleted"] = [];
  for (const day of days) {
    const slice = slices.get(day);
    const completed = slice?.completed ?? 0;
    dailyCompleted.push({ day, value: completed });
    if (!isEmptySlice(slice)) activeDays++;
    if (completed > 0 && (!busiest || completed > busiest.completed)) busiest = { day, completed };
  }

  return { days, totals, previous, queueOpen, queueClose, peakQueue, busiest, activeDays, dailyCompleted };
}

export interface LiveNow {
  /**
   * Jobs condor_q is holding right now, for the whole account. Null when a
   * cluster or batch is selected: the live count cannot be filtered, and a
   * whole-account figure under a one-cluster heading would be a lie.
   */
  liveTotal: number | null;
  /** The last end-of-day census, split waiting and running, under the filter. */
  census: { day: string; waiting: number; running: number } | null;
  /** The longest-standing cluster with jobs still open at the last census. */
  oldestOpen: { cluster: number; since: string } | null;
}

export function buildLiveNow(dayData: DayData, filter: ClusterFilter): LiveNow {
  const liveTotal = filter === null ? dayData.sources.condorQ.stillQueued : null;

  let census: LiveNow["census"] = null;
  if (dayData.carry && dayData.carry.length > 0) {
    let day = "";
    for (const row of dayData.carry) if (row.day > day) day = row.day;
    let waiting = 0;
    let running = 0;
    for (const row of dayData.carry) {
      if (row.day !== day || !inFilter(filter, row.cluster)) continue;
      waiting += row.placed;
      running += row.active;
    }
    census = { day, waiting, running };
  }

  // A cluster is open if any of its cohorts still has jobs queued or running
  // at the last day the bake read. Its age is from its first placement.
  let oldestOpen: LiveNow["oldestOpen"] = null;
  const lastDay = dayData.days[dayData.days.length - 1];
  if (lastDay) {
    const firstQueued = new Map(dayData.clusters.map((c) => [c.id, c.firstQueued]));
    for (const cohort of dayData.cohorts) {
      if (!inFilter(filter, cohort.cluster)) continue;
      const counts = cohort.asOf[lastDay];
      if (!counts || counts[0] + counts[1] === 0) continue;
      const since = firstQueued.get(cohort.cluster) ?? cohort.day;
      if (!oldestOpen || since < oldestOpen.since) oldestOpen = { cluster: cohort.cluster, since };
    }
  }

  return { liveTotal, census, oldestOpen };
}

export interface Pace {
  /** Days the pace is averaged over; fewer than asked when fewer are loaded. */
  window: number;
  /** Jobs leaving the queue per day, completed and removed together. */
  perDay: number;
  /** The day the open queue reaches zero at this pace; null when the pace is zero. */
  clearsOn: string | null;
}

export interface Projection {
  /** The last complete day: what "now" means for the open count and the paces. */
  asOfDay: string;
  /** Jobs open at that day's close. */
  open: number;
  paces: Pace[];
}

/** The pace windows offered, in days. */
export const PACE_WINDOWS = [3, 7, 14];

/**
 * When the standing queue would be gone if nothing new arrived: open jobs at
 * the last complete midnight divided by how many left per day lately.
 * Removals count as leaving, since they empty the queue too, even though they
 * are not the finish the reader hopes for. Several trailing windows rather
 * than one, because the pace swings and a single date reads as a promise.
 */
export function buildProjection(
  slices: Map<string, DaySlice>,
  levels: Map<string, DayLevel> | null,
  loadedDays: string[],
  asOfDay: string | null,
): Projection | null {
  if (!asOfDay) return null;
  const index = loadedDays.indexOf(asOfDay);
  if (index < 0) return null;
  const level = levels?.get(asOfDay);
  const open =
    slices.get(asOfDay)?.queue?.total ??
    (level && level.ends.length > 0 ? level.ends[level.ends.length - 1] : null);
  if (open === null || open === undefined) return null;

  const paces = PACE_WINDOWS.map((wanted): Pace => {
    const from = Math.max(0, index - wanted + 1);
    const days = loadedDays.slice(from, index + 1);
    let left = 0;
    for (const day of days) {
      const slice = slices.get(day);
      if (slice) left += slice.completed + slice.removed;
    }
    const perDay = days.length > 0 ? left / days.length : 0;
    const clearsOn = perDay > 0 ? addDays(asOfDay, Math.ceil(open / perDay)) : null;
    return { window: days.length, perDay, clearsOn };
  });

  return { asOfDay, open, paces };
}
