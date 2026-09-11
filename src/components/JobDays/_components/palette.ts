// Colors for the three-state model this page paints throughout: the Sankey at the
// top and the 4-hour bars below it share one vocabulary.
//
// Deliberately the same hex values as app/sankey/_components/palette.ts and
// app/stacked-bar/_components/palette.ts (which the dataviz checker validated as
// a set) so a cluster reads identically across all three pages -- but copied
// rather than imported: this route is self-contained.
//
// Active takes the Sankey's running indigo. There is no Placed state here: a job
// is Active from the moment it is placed, so the old Placed amber has nothing to
// represent and is gone from the page entirely.

import type { BarState } from "../types";

/**
 * The charts draw one more distinction than the three baked states carry: the
 * Active share splits into work that arrived in this very bin ("Became Active")
 * and work carried in from earlier ("Active"). Display-only -- the waffle and the
 * cohort rows stay three-state.
 */
export type SegmentState = BarState | "becameActive";

export interface BarStateStyle {
  key: SegmentState;
  label: string;
  color: string;
  /** Phrasing for tooltips and captions. */
  description: string;
}

export const BAR_STATE_ORDER: BarState[] = ["active", "completed", "removed"];

/**
 * Bottom-up stacking order for the bar segments: the carried base first, new
 * arrivals directly on top of it, then the terminations.
 */
export const BAR_SEGMENT_ORDER: SegmentState[] = [
  "active",
  "becameActive",
  "completed",
  "removed",
];

/**
 * The three-state styles the bars, rows, and labels use. Here "Active" means every
 * active job -- queued or running -- so it keeps the strong indigo.
 */
export const BAR_STATE_STYLES: Record<BarState, BarStateStyle> = {
  active: {
    key: "active",
    label: "Active",
    color: "#3b5bdb",
    description: "placed and not yet finished",
  },
  completed: {
    key: "completed",
    label: "Completed",
    color: "#2a9d8f",
    description: "finished successfully",
  },
  removed: {
    key: "removed",
    label: "Removed",
    color: "#ae2012",
    description: "removed from the queue",
  },
};

/**
 * Carried-active light indigo: work that was already in play before the bin (or
 * the period) opened.
 *
 * Validated in the Sankey page's palette against the other five at --pairs all:
 * all gates PASS, worst CVD 11.6. Darkening the indigo instead was tried first
 * and failed -- #5a6ba8 measures only 10.2 against #3b5bdb for normal vision,
 * and #7d84c4 collides with the teal. Lightening had the room in it.
 */
export const CARRIED_ACTIVE_COLOR = "#8ea3e8";

/**
 * The chart-segment styles. New placements are the signal ("work arrived = strong
 * blue"), so Became Active keeps the saturated indigo and the carried base takes
 * the lighter one.
 */
export const SEGMENT_STYLES: Record<SegmentState, BarStateStyle> = {
  ...BAR_STATE_STYLES,
  active: {
    ...BAR_STATE_STYLES.active,
    color: CARRIED_ACTIVE_COLOR,
    description: "active since an earlier bin",
  },
  becameActive: {
    key: "becameActive",
    label: "Became Active",
    color: "#3b5bdb",
    description: "placed in this 4-hour bin",
  },
};

/**
 * Calendar v2's stacking order, bottom-up: today's placements at the base, then
 * completed, then removed, with the still-active carried work on top. Read top
 * down that is active, removed, completed, placed -- the standing work sits
 * where the eye lands first and the new arrivals form the floor.
 */
export const SHARE_SEGMENT_ORDER: SegmentState[] = [
  "becameActive",
  "completed",
  "removed",
  "active",
];

/** The same order read top-down, for legends and readouts that list the stack. */
export const SHARE_SEGMENT_ORDER_TOP_DOWN: SegmentState[] = [...SHARE_SEGMENT_ORDER].reverse();

/**
 * Calendar v2's segment styles. Same four colours, worded for a bar whose
 * population is one 4-hour window's: the jobs open when it started plus the
 * jobs placed during it. See CensusMode "window" in binModel.
 */
export const SHARE_SEGMENT_STYLES: Record<SegmentState, BarStateStyle> = {
  ...BAR_STATE_STYLES,
  active: {
    key: "active",
    label: "Still active",
    color: CARRIED_ACTIVE_COLOR,
    description: "active when the window opened and still active at its close",
  },
  becameActive: {
    key: "becameActive",
    label: "Placed, active",
    color: "#3b5bdb",
    description: "placed during this window and still active at its close",
  },
  completed: {
    ...BAR_STATE_STYLES.completed,
    description: "completed during this window",
  },
  removed: {
    ...BAR_STATE_STYLES.removed,
    description: "removed during this window",
  },
};

/**
 * The queue level trace on the v1 calendar: a grey, not one of the four state
 * colours, and drawn behind the bars.
 *
 * It replaced a hatched indigo column astride each midnight, which read as one
 * more bar. Grey takes it out of the state vocabulary altogether -- it is the
 * ground the day's changes happen against, not another kind of change -- and
 * sitting behind the bars keeps it from competing with them. The grey leans
 * toward the page's indigo so it reads as chosen rather than as unstyled.
 */
export const LEVEL_LINE_COLOR = "#a3a6b8";

/** The midnight dot on the trace; a step darker so it survives on the boundary. */
export const LEVEL_DOT_COLOR = "#7e829a";

/**
 * The magnitude chart's segments: state CHANGES per bin, so "placed" here is the
 * event (a job entered Active), not a standing state.
 */
export type ActivityState = "placed" | "completed" | "removed";

export const ACTIVITY_ORDER: ActivityState[] = ["placed", "completed", "removed"];

export const ACTIVITY_STYLES: Record<ActivityState, { label: string; color: string }> = {
  placed: { label: "Placed", color: BAR_STATE_STYLES.active.color },
  completed: { label: "Completed", color: BAR_STATE_STYLES.completed.color },
  removed: { label: "Removed", color: BAR_STATE_STYLES.removed.color },
};
