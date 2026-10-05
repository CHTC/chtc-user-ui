// Deriving one day's 4-hour bars from the baked window-long series.
//
// The bake ships sparse per-cluster counts (placed / completed / removed per
// bin). Everything drawn is arithmetic over those: per-bin sums give each
// bar's change counts, and a running balance gives the open-jobs level.
//
// Copied from app/stacked-bar/_components/binModel.ts and trimmed: the
// 100%-stacked cohort census a single cluster used to draw is gone, so one
// derivation serves every selection, and the coarser day-per-bar and
// week-per-bar buckets that fed the retired period summary are gone with it.

import type { BarScale, StackedBarData } from "../types";
import { inFilter, type ClusterFilter } from "./grouping";
import { DEFAULT_BARS, type ActivityState } from "./palette";

/** The selected clusters' series, summed into dense window-long arrays. */
export interface DenseSeries {
  openingActive: number;
  placed: number[];
  completed: number[];
  removed: number[];
}

function addSparse(dense: number[], sparse: [number, number][]) {
  for (const [bin, count] of sparse) {
    if (bin >= 0 && bin < dense.length) dense[bin] += count;
  }
}

export function expandSeries(data: StackedBarData, filter: ClusterFilter): DenseSeries {
  const totalBins = data.days.length * data.binsPerDay;
  const out: DenseSeries = {
    openingActive: 0,
    placed: new Array(totalBins).fill(0),
    completed: new Array(totalBins).fill(0),
    removed: new Array(totalBins).fill(0),
  };
  for (const series of data.series) {
    if (!inFilter(filter, series.cluster)) continue;
    out.openingActive += series.openingActive;
    addSparse(out.placed, series.placed);
    addSparse(out.completed, series.completed);
    addSparse(out.removed, series.removed);
  }
  return out;
}

/** The state changes inside one 4-hour bin. */
export interface BinActivity {
  /** "00–04" .. "20–24". */
  label: string;
  placed: number;
  completed: number;
  removed: number;
  /**
   * The bar's height: the sum of whichever of the three the bars are set to
   * show (see DEFAULT_BARS). The readouts quote the hidden ones.
   */
  total: number;
}

export interface DayActivity {
  bins: BinActivity[];
  /** The shown states' sum across the day. */
  total: number;
  /** True when anything completed, was placed, or was removed in the day. */
  hasData: boolean;
}

/**
 * The magnitude view for one day: how many jobs did the shown thing in each
 * bin -- completed, by default. A busy bin is a tall bar, a quiet one is
 * empty. A bin with nothing in it draws nothing, so a day whose work all
 * completed by 04:00 has five empty bins of its own accord.
 */
export function buildDayActivity(
  data: StackedBarData,
  dense: DenseSeries,
  dayIndex: number,
  shown: ActivityState[] = DEFAULT_BARS,
): DayActivity {
  const startBin = dayIndex * data.binsPerDay;
  const bins: BinActivity[] = [];
  let total = 0;
  let anyChange = 0;
  for (let b = 0; b < data.binsPerDay; b++) {
    const bin = startBin + b;
    const counts = {
      placed: dense.placed[bin] ?? 0,
      completed: dense.completed[bin] ?? 0,
      removed: dense.removed[bin] ?? 0,
    };
    const binTotal = shown.reduce((sum, state) => sum + counts[state], 0);
    total += binTotal;
    anyChange += counts.placed + counts.completed + counts.removed;
    bins.push({ label: binLabel(b, data.binHours), ...counts, total: binTotal });
  }
  // A day where only hidden states moved still has data: its bars are empty
  // but its tile is alive, and the readouts say what happened.
  return { bins, total, hasData: anyChange > 0 };
}

/** What one bar of a chart spans, for its axis title and its tooltips. */
export type BucketUnit = "hours" | "days" | "weeks";

/**
 * How many jobs were open -- queued or running -- through one day, read at the
 * start of the day and at the close of each 4-hour window.
 *
 * This is the queue as a level, the thing the activity bars cannot show: a day
 * with six empty bars can still have a million jobs waiting. The calendar draws
 * it as a grey trace behind the bars, continuous from one day into the next.
 */
export interface DayLevel {
  /** Open when the day began; equals the previous day's last `ends` entry. */
  start: number;
  /** Open at the close of each window, one entry per bin. */
  ends: number[];
  /** True when anything was open at any point in the day. */
  hasData: boolean;
}

/**
 * The open-jobs level for every day in the window, in one pass.
 *
 * Derived from the 4-hour transitions rather than read from the midnight
 * census: opening balance plus placements, minus completions and removals, bin
 * by bin. Clamped at zero as it goes, since counting noise between the two
 * sources can push it a hair negative, and a negative queue would poison every
 * later reading. The midnight census (see DayQueue) is the measured figure and
 * the two can differ slightly; the hover readout says so.
 */
export function buildDayLevels(data: StackedBarData, dense: DenseSeries): Map<string, DayLevel> {
  const out = new Map<string, DayLevel>();
  let level = dense.openingActive;
  data.days.forEach((day, dayIndex) => {
    const start = level;
    const ends: number[] = [];
    for (let b = 0; b < data.binsPerDay; b++) {
      const bin = dayIndex * data.binsPerDay + b;
      level = Math.max(0, level + dense.placed[bin] - dense.completed[bin] - dense.removed[bin]);
      ends.push(level);
    }
    out.set(day, { start, ends, hasData: start > 0 || ends.some((v) => v > 0) });
  });
  return out;
}

/** "00–04" for bin 0 of a 4-hour bake. */
function binLabel(bin: number, binHours: number): string {
  const from = String(bin * binHours).padStart(2, "0");
  const to = String((bin + 1) * binHours).padStart(2, "0");
  return `${from}–${to}`;
}

/**
 * Height of a calendar tile's bar slot, in pixels. Shared with the calendar,
 * which positions the row axes against it.
 */
export const TILE_BARS_HEIGHT = 88;

/**
 * The tallest bin among the given days: what every bar in that scope is scaled
 * against. Takes the entries already filtered to the scope, so this stays pure
 * arithmetic over the bins and needs no notion of calendars or date keys.
 */
export function peakBinTotal(entries: [string, DayActivity][]): number {
  let peak = 0;
  for (const [, activity] of entries) {
    for (const bin of activity.bins) if (bin.total > peak) peak = bin.total;
  }
  return peak;
}

/**
 * Which of the calendar's two height scales a mark is drawn against.
 *
 * The activity bars count changes per 4-hour window; the grey level trace counts
 * standing jobs. They cannot share a scale, so each gets its own axis -- activity
 * down the left, the queue down the right -- and hovering a mark lights up the
 * one that governs it.
 */
export type ScaleKind = "activity" | "queue";

/** One labelled gridline on a tile's height axis. */
export interface ScaleTick {
  /** The count (or percentage) the line stands for. */
  value: number;
  /** Where it sits in the bar slot, 0 at the floor and 1 at the top. */
  fraction: number;
}

/**
 * Smallest gap between two ticks, as a fraction of the slot. An 88-pixel slot
 * leaves room for about four labels before they collide.
 */
const MIN_TICK_GAP = 0.22;

/**
 * Labelled heights for the calendar's magnitude bars, so a bar's height can
 * actually be read rather than only compared.
 *
 * The ticks suit the scale they annotate. Linear gets the peak and its half,
 * which is all a proportional axis needs. Log gets the powers of ten it spans --
 * and their uneven spacing is the point: a reader who sees 100, 10k and 181k
 * climbing at even intervals up the slot can see for themselves that the heights
 * are not proportional.
 *
 * The floor is always labelled, since it is what every short bar is sitting on,
 * and it takes part in the thinning like any other tick -- on a log scale the
 * bottom decade lands a few pixels above zero and would otherwise print on top
 * of it.
 */
export function buildScaleTicks(peak: number, scale: BarScale): ScaleTick[] {
  if (peak <= 0) return [];

  const at = (value: number) => ({ value, fraction: barFraction(value, peak, scale) });

  const floor: ScaleTick = { value: 0, fraction: 0 };
  const top: ScaleTick = { value: peak, fraction: 1 };

  // Everything between the peak and the floor, descending. Positioned with the
  // same function the bars use, so a label sits exactly where the value it names
  // is drawn, and the thinning below measures the gaps the reader will see.
  const middle: ScaleTick[] = [];
  if (scale === "linear") {
    const half = Math.round(peak / 2);
    if (half > 0) middle.push(at(half));
  } else {
    for (let exponent = Math.floor(Math.log10(peak)); exponent >= 0; exponent--) {
      middle.push(at(10 ** exponent));
    }
  }

  // Keep a tick only if it clears both the one above it and the floor below.
  const kept: ScaleTick[] = [top];
  for (const tick of middle) {
    const above = kept[kept.length - 1];
    if (above.fraction - tick.fraction >= MIN_TICK_GAP && tick.fraction >= MIN_TICK_GAP) {
      kept.push(tick);
    }
  }
  kept.push(floor);
  return kept;
}

/**
 * Bar height as a fraction of the tallest value on screen, under either scale.
 *
 * Every kind of mark fills the slot at its own maximum: the tallest bin reaches
 * the top of the activity scale, the highest queue level reaches the top of the
 * queue scale, and each is read against its own axis.
 *
 * Linear is the honest one -- twice as tall is twice as much work -- but with a
 * 900,000-change peak on the page a 66-change bin is a fraction of a pixel and
 * a whole quiet week reads as "nothing happened". Log keeps those bins visible
 * and preserves their order, at the cost of proportionality: heights become
 * ordinal, and the numbers live in the hover readout and the day detail instead.
 *
 * Either way the segments inside a column stay linear, so the composition of a
 * single bar never lies.
 */
export function barFraction(total: number, peak: number, scale: BarScale): number {
  if (total <= 0) return 0;
  const top = Math.max(peak, total, 1);
  if (scale === "linear") return Math.min(total / top, 1);
  const denom = Math.log10(top + 1);
  if (denom <= 0) return 1;
  return Math.min(Math.log10(total + 1) / denom, 1);
}
