// The slice of public/data/day-cards.json this page needs, plus the derivation
// from four baked states down to the three this page paints.
//
// Two bakes feed this route. stacked-bars.json (see ../types.ts) carries the
// 4-hour transition series the calendar draws; day-cards.json carries the
// per-day cohort censuses, the Sankey flow edges, and the end-of-day carry-over
// census. Types and model are copied (and trimmed) from app/sankey and
// app/stacked-bar rather than imported: this route is self-contained.
//
// The one substantive difference from the Sankey page: Placed and Running are
// merged into a single Active state everywhere, so a job is Active from the
// moment it is placed and leaves only by completing or being removed. That is
// the same grouping the 4-hour bars use, so the diagram at the top of the page
// and the calendar below it speak about the same three states.

/** Counts in the day bake's order: [queued, running, completed, removed]. */
export type StateCounts = readonly [number, number, number, number];

import { inFilter, type BatchInfo, type ClusterFilter, type ClusterStanding } from "./grouping";
import type { CondorQSource } from "../types";

/**
 * Sankey edge weights for one day, as the day bake writes them. The four-state
 * vocabulary is the bake's; this page collapses it (see mergedFlows) so the
 * placed -> running transitions, which are internal to Active here, drop out.
 */
export interface DayFlows {
  placedTodayToActive: number;
  placedBeforeToActive: number;
  activeToCompleted: number;
  activeToRemoved: number;
  placedTodayToRemoved: number;
  placedBeforeToRemoved: number;
  placedTodayToCompleted: number;
  placedBeforeToCompleted: number;
}

/** Non-terminal jobs held at the end of one day, for one cluster. */
export interface CarryRow {
  cluster: number;
  day: string;
  /** Still waiting in the queue at midnight. */
  placed: number;
  /** Still executing at midnight. */
  active: number;
}

/**
 * The carry-over context the Sankey needs to conserve flow: what the day (or
 * period) inherited and what it hands on. Still split placed/active because that
 * is how the bake measured it; this page sums the two into one Active figure.
 */
export interface DayCarry {
  placedIn: number;
  activeIn: number;
  placedOut: number;
  activeOut: number;
  /** Jobs placed during the day or period. */
  placedNew: number;
}

export interface Cohort {
  cluster: number;
  day: string;
  queued: number;
  asOf: Record<string, StateCounts>;
}

export interface ActivityRow {
  cluster: number;
  day: string;
  started: number;
  completed: number;
  removed: number;
  /** Distinct jobs with at least one transition this day. */
  changed: number;
  /** Optional: absent on data baked before the Sankey fields existed. */
  flows?: DayFlows;
}

export interface ClusterInfo {
  id: number;
  total: number;
  firstQueued: string | null;
  /** Batch this cluster belongs to. Absent on data baked before batches existed. */
  batch?: string;
}

export interface DayData {
  owner: string;
  anonymized?: boolean;
  generatedAt: string;
  timezone: string;
  days: string[];
  clusters: ClusterInfo[];
  /** Batch groups. Absent on data baked before batch grouping existed. */
  batches?: BatchInfo[];
  cohorts: Cohort[];
  activity: ActivityRow[];
  /** Optional: absent on data baked before the carry-over census existed. */
  carry?: CarryRow[];
  sources: {
    adstash: { host: string; index: string; terminalRecords: number };
    condorQ: CondorQSource & { stillQueued: number };
  };
  /** Jobs placed inside the window. Adds up across tiled windows. */
  counted: number;
  /**
   * Jobs placed before the window that were still open when it started. Absent
   * on payloads from before windows tiled.
   */
  placedBeforeWindow?: number;
  /**
   * How many weekly windows were stitched into this payload. Set by the client
   * merge (see chunks.ts), never by the API.
   */
  queries?: number;
}

/**
 * The queue at the instant one day ends and the next begins.
 *
 * A stock, not a flow -- the one thing the rest of the calendar cannot show.
 * Every other bar counts transitions inside a window; this counts jobs standing
 * in the queue when the window closed, so a day on which nothing at all moved can
 * still be holding a million jobs.
 *
 * Both halves are measured, from two different censuses that agree: the total is
 * the end-of-day carry census (waiting plus running), and `fromToday` is the
 * day's own cohort read at the end of that same day. Nothing here is inferred
 * from transitions, which could not separate the two -- a job placed and finished
 * inside the day is invisible to both.
 */
export interface DayQueue {
  /** Jobs still in flight when the day closed: waiting plus running. */
  total: number;
  /** Of those, the ones placed during this very day. */
  fromToday: number;
  /** The rest: already in flight when the day opened. */
  carried: number;
}

/** One day's worth, after cluster filtering and cross-cluster summing. */
export interface DaySlice {
  day: string;
  /** Jobs placed on this day. */
  queued: number;
  /** Transitions on this day (all jobs, whenever they were placed). */
  completed: number;
  removed: number;
  /** Distinct jobs that moved this day. Not the sum of the lines above. */
  changed: number;
  /** Null when the baked data predates the Sankey fields. */
  flows: DayFlows | null;
  /** Null when the baked data predates the carry-over census. */
  carry: DayCarry | null;
  /** The queue at this day's close. Null when the bake carries no census. */
  queue: DayQueue | null;
}

/**
 * Sentinel day key the bake uses for the census taken as the window opens, so
 * the first real day has a measured carry-in rather than a guess. Must match
 * WINDOW_START_DAY in scripts/build-day-data.mjs.
 */
export const WINDOW_START_DAY = "window-start";

export const FLOW_KEYS = [
  "placedTodayToActive",
  "placedBeforeToActive",
  "activeToCompleted",
  "activeToRemoved",
  "placedTodayToRemoved",
  "placedBeforeToRemoved",
  "placedTodayToCompleted",
  "placedBeforeToCompleted",
] as const;

function addFlows(a: DayFlows | null, b: DayFlows): DayFlows {
  if (!a) return { ...b };
  const out = {} as DayFlows;
  for (const key of FLOW_KEYS) out[key] = a[key] + b[key];
  return out;
}

/** True when any edge carries weight; an all-zero day has nothing to draw. */
export function hasFlow(flows: DayFlows | null): flows is DayFlows {
  return !!flows && FLOW_KEYS.some((key) => flows[key] > 0);
}

/**
 * The three-state edge weights, summed out of the bake's four-state vocabulary.
 *
 * Placed -> Running disappears: with the two states merged it is not a state
 * change at all. Everything that ends Completed is one edge, everything that
 * ends Removed is another, whether or not the job ever ran.
 */
export function mergedFlows(flows: DayFlows): { completed: number; removed: number } {
  return {
    completed:
      flows.activeToCompleted + flows.placedTodayToCompleted + flows.placedBeforeToCompleted,
    removed: flows.activeToRemoved + flows.placedTodayToRemoved + flows.placedBeforeToRemoved,
  };
}

/** Local "YYYY-MM-DD" for a Date. Never toISOString -- it shifts to UTC. */
export function dayKeyOf(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local midnight Date for a "YYYY-MM-DD" key. */
export function parseDayKey(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The day the whole page is viewed as of: the last day in the baked window,
 * taken from the data rather than the wall clock -- the demo data is a snapshot,
 * and a page that asked the browser for today's date would start showing empty
 * days the morning after it was baked.
 */
export function asOfDay(data: DayData): string {
  return data.days[data.days.length - 1];
}

/** One slice per day for the chosen cluster, keyed by day. */
export function buildSliceMap(data: DayData, filter: ClusterFilter): Map<string, DaySlice> {
  const slices = new Map<string, DaySlice>();
  for (const day of data.days) {
    slices.set(day, {
      day,
      queued: 0,
      completed: 0,
      removed: 0,
      changed: 0,
      flows: null,
      carry: null,
      queue: null,
    });
  }

  for (const cohort of data.cohorts) {
    if (!inFilter(filter, cohort.cluster)) continue;
    const slice = slices.get(cohort.day);
    if (!slice) continue;
    slice.queued += cohort.queued;
  }

  for (const row of data.activity) {
    if (!inFilter(filter, row.cluster)) continue;
    const slice = slices.get(row.day);
    if (!slice) continue;
    slice.completed += row.completed;
    slice.removed += row.removed;
    // Summing distinct-job counts across clusters stays a distinct-job count: a
    // job belongs to exactly one cluster.
    slice.changed += row.changed;
    if (row.flows) slice.flows = addFlows(slice.flows, row.flows);
  }

  // End-of-day census, summed over the selected clusters.
  const endOfDay = new Map<string, { placed: number; active: number }>();
  for (const row of data.carry ?? []) {
    if (!inFilter(filter, row.cluster)) continue;
    const entry = endOfDay.get(row.day) ?? { placed: 0, active: 0 };
    entry.placed += row.placed;
    entry.active += row.active;
    endOfDay.set(row.day, entry);
  }

  // Jobs placed on a day that were still in flight when that same day closed.
  // Read from the cohort's own end-of-day census, which is the only source that
  // can attribute standing work to the day it arrived: transitions cannot, since
  // a job placed and finished inside one day leaves no trace in either.
  const placedStillActive = new Map<string, number>();
  for (const cohort of data.cohorts) {
    if (!inFilter(filter, cohort.cluster)) continue;
    const sameDay = cohort.asOf[cohort.day];
    // Queued plus running: both are Active in this page's three-state model.
    if (sameDay) {
      placedStillActive.set(
        cohort.day,
        (placedStillActive.get(cohort.day) ?? 0) + sameDay[0] + sameDay[1],
      );
    }
  }

  // Turn the census into per-day carry-in/carry-out. Day 0 reads its carry-in
  // from the window-start census -- the state measured at the instant the window
  // opened. Inferring it from the day's own flows instead understated the
  // opening backlog badly, which then propagated into every period starting on
  // day 0.
  if (data.carry) {
    const beforeWindow = endOfDay.get(WINDOW_START_DAY) ?? { placed: 0, active: 0 };
    data.days.forEach((day, index) => {
      const slice = slices.get(day);
      if (!slice) return;
      const today = endOfDay.get(day) ?? { placed: 0, active: 0 };
      const yesterday = index > 0 ? (endOfDay.get(data.days[index - 1]) ?? today) : beforeWindow;
      slice.carry = {
        placedIn: yesterday.placed,
        activeIn: yesterday.active,
        placedOut: today.placed,
        activeOut: today.active,
        placedNew: slice.queued,
      };

      // The queue at midnight, split into what arrived today and what was
      // already here. Clamped to the total: the two censuses are measured
      // separately, so counting noise must not be allowed to produce a negative
      // carried figure.
      const total = today.placed + today.active;
      const fromToday = Math.min(placedStillActive.get(day) ?? 0, total);
      slice.queue = { total, fromToday, carried: total - fromToday };
    });
  }

  return slices;
}

/**
 * What became, by the end of one day, of every job the day had in hand.
 *
 * The calendar's completion ratio -- v1's cell ground, v2's column astride
 * midnight -- and the day dialog's section of the same name. The population is
 * everything that could have finished during the day: the jobs already open
 * when it began, plus the jobs placed into it during the day itself. A day that
 * inherited 200 jobs, took on 200 more and finished 100 of the 400 is a 25% day;
 * work that arrived in the morning and finished by the evening counts, because
 * it was there to be finished.
 */
export interface DayOutcome {
  /**
   * Jobs the day could have finished: open -- queued or running -- when it
   * began, plus everything placed during it.
   */
  inPlay: number;
  /** Of those, still open at the day's end. */
  active: number;
  /** Of those, completed during the day. */
  completed: number;
  /** Of those, removed during the day. */
  removed: number;
  /**
   * True when the day had anything in hand at all. False means there was no job
   * that could have been completed or removed, and the ratio is not drawn: an
   * empty day has no share to report, and a bar standing for nothing reads as a
   * day that finished nothing.
   */
  hasData: boolean;
}

/**
 * The day outcomes for every day, from the cohort censuses.
 *
 * A cohort placed before day D is part of D's population; reading it at the end
 * of D-1 gives how many were still open, and the growth of its terminal counts
 * from D-1 to D gives how many finished during D. D's own cohort joins it with
 * no prior reading at all: everything it holds at the end of D was placed and
 * settled (or not) inside the day. Exact, not inferred: the cohort rows
 * attribute every transition to the day its job was placed.
 *
 * On the first loaded day there is no D-1 reading for the earlier cohorts
 * either. A cohort placed before the window counts only its survivors at the
 * window's start, and its terminal counts on that first day are the day's own,
 * so the day-one reading stands in for both.
 */
export function buildDayOutcomes(data: DayData, filter: ClusterFilter): Map<string, DayOutcome> {
  const out = new Map<string, DayOutcome>();
  data.days.forEach((day, index) => {
    const previous = index > 0 ? data.days[index - 1] : null;
    let inPlay = 0;
    let active = 0;
    let completed = 0;
    let removed = 0;
    for (const cohort of data.cohorts) {
      if (!inFilter(filter, cohort.cluster) || cohort.day > day) continue;
      const today = cohort.asOf[day];
      if (!today) continue;
      // The day's own cohort never has a reading for the day before -- it did
      // not exist yet -- so it takes the same branch as a cohort whose history
      // starts here, and its whole census counts as placed into this day.
      const before = cohort.day < day && previous ? cohort.asOf[previous] : undefined;
      if (before) {
        inPlay += before[0] + before[1];
        completed += Math.max(0, today[2] - before[2]);
        removed += Math.max(0, today[3] - before[3]);
      } else {
        inPlay += today[0] + today[1] + today[2] + today[3];
        completed += today[2];
        removed += today[3];
      }
      active += today[0] + today[1];
    }
    out.set(day, { inPlay, active, completed, removed, hasData: inPlay > 0 });
  });
  return out;
}

/** "YYYY-MM-DD", the shape every day key in this module takes. */
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The last reading a cohort has at or before the given day. Normally the day
 * itself; the walk back covers a cohort whose census stops short, which a
 * partially baked window can produce.
 */
function readingAt(cohort: Cohort, days: string[], day: string): StateCounts | undefined {
  const direct = cohort.asOf[day];
  if (direct) return direct;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i] > day) continue;
    const reading = cohort.asOf[days[i]];
    if (reading) return reading;
  }
  return undefined;
}

/**
 * Where every cluster stands as of the window's last day: what is still in
 * flight, what has left the queue, and when it was first submitted.
 *
 * Summed over the cluster's cohorts, since a cluster submitted across several
 * days has one cohort per day and its standing is all of them together. This
 * is a running total, not a per-day figure -- the picker it feeds is asking
 * "what is the state of this cluster now", which is a different question from
 * anything the calendar's tiles answer.
 *
 * The submission day comes from the cluster record where the bake has one,
 * since that is authoritative and can predate the window; the earliest cohort
 * in the window is the fallback.
 */
export function buildClusterStandings(data: DayData): Map<number, ClusterStanding> {
  const asOf = asOfDay(data);
  const out = new Map<number, ClusterStanding>();
  const at = (cluster: number): ClusterStanding => {
    let standing = out.get(cluster);
    if (!standing) out.set(cluster, (standing = { open: 0, settled: 0, firstQueued: null }));
    return standing;
  };

  for (const cohort of data.cohorts) {
    const reading = readingAt(cohort, data.days, asOf);
    if (!reading) continue;
    const standing = at(cohort.cluster);
    standing.open += reading[0] + reading[1];
    standing.settled += reading[2] + reading[3];
    if (!standing.firstQueued || cohort.day < standing.firstQueued) {
      standing.firstQueued = cohort.day;
    }
  }

  for (const cluster of data.clusters) {
    const standing = out.get(cluster.id);
    if (!standing || !cluster.firstQueued) continue;
    // Normalised to a day key here rather than at every reader: the bake has
    // written this field as a plain day and as a full timestamp at different
    // times, and parseDayKey makes an Invalid Date of the second form.
    const day = cluster.firstQueued.slice(0, 10);
    if (DAY_KEY.test(day)) standing.firstQueued = day;
  }

  return out;
}

/**
 * What one cluster did on one day, and -- just as much the point -- what it did
 * not do.
 */
export interface DayClusterRole {
  cluster: number;
  /** Jobs placed into this cluster on the day itself. */
  placed: number;
  /** Jobs of this cluster that were already open when the day began. */
  opening: number;
  /** Still open at the day's end, whenever they were placed. */
  open: number;
  completed: number;
  removed: number;
  /** Distinct jobs of this cluster that moved at all. */
  changed: number;
}

/**
 * Every cluster that was part of one day, with what it placed, what it was
 * already carrying, and what finished or was removed.
 *
 * Two different ways of belonging to a day, which is why both are counted
 * separately rather than summed into one "took part" number: a cluster can be
 * placed on the day, or it can have arrived earlier and still be holding open
 * jobs through it. A cluster in the second group with no completions and no
 * removals is the case this exists for -- it is genuinely part of the day,
 * contributes nothing to any of the day's counts, and is invisible in a list
 * ordered by activity.
 *
 * `opening` and `open` are read from the cohort censuses the same way
 * buildDayOutcomes reads them, so a cluster's figures here and the day's
 * totals there are the same arithmetic. `completed` and `removed` come from
 * the activity rows, which count transitions on the day whenever the jobs were
 * placed.
 *
 * Unfiltered on purpose: this is what feeds the picker a reader chooses a
 * filter from, so filtering it first would hide everything they might pick.
 */
export function buildDayClusterRoles(data: DayData, day: string): DayClusterRole[] {
  const index = data.days.indexOf(day);
  const previous = index > 0 ? data.days[index - 1] : null;
  const byCluster = new Map<number, DayClusterRole>();
  const at = (cluster: number): DayClusterRole => {
    let role = byCluster.get(cluster);
    if (!role) {
      byCluster.set(
        cluster,
        (role = { cluster, placed: 0, opening: 0, open: 0, completed: 0, removed: 0, changed: 0 }),
      );
    }
    return role;
  };

  for (const cohort of data.cohorts) {
    if (cohort.day > day) continue;
    const today = cohort.asOf[day];
    if (cohort.day === day) {
      if (cohort.queued > 0) at(cohort.cluster).placed += cohort.queued;
      if (today) at(cohort.cluster).open += today[0] + today[1];
      continue;
    }
    if (!today) continue;
    const role = at(cohort.cluster);
    const before = previous ? cohort.asOf[previous] : undefined;
    // No reading for the day before means the window starts here, and the
    // whole cohort counts as inherited -- as the earlier cohorts do in
    // buildDayOutcomes. Unlike that function, this column stays inherited-only:
    // what the cluster placed on the day has a column of its own beside it.
    role.opening += before
      ? before[0] + before[1]
      : today[0] + today[1] + today[2] + today[3];
    role.open += today[0] + today[1];
  }

  for (const row of data.activity) {
    if (row.day !== day) continue;
    const role = at(row.cluster);
    role.completed += row.completed;
    role.removed += row.removed;
    role.changed += row.changed;
  }

  return [...byCluster.values()];
}

/** True when the day carries nothing at all -- no cohort and no transitions. */
export function isEmptySlice(slice: DaySlice | undefined): boolean {
  if (!slice) return true;
  return slice.queued === 0 && slice.changed === 0;
}

/** "Tue, Jul 21" */
export function formatDayShort(day: string): string {
  return parseDayKey(day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "Tue, Jul 21", for a Date rather than a day key -- a projected day, say. */
export function formatDateShort(at: Date): string {
  return at.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** "Tuesday, July 21" */
export function formatDayLong(day: string): string {
  return parseDayKey(day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Compact counts for tiles: 1.5M, 272k, 940. */
export function compactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}k`;
  if (n >= 1_000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
