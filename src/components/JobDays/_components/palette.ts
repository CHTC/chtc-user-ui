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
 * The queue level trace on the v1 calendar: a grey, not one of the four state
 * colours, and drawn behind the bars.
 *
 * It replaced a hatched indigo column astride each midnight, which read as one
 * more bar. Grey takes it out of the state vocabulary altogether -- it is the
 * ground the day's changes happen against, not another kind of change -- and
 * sitting behind the bars keeps it from competing with them. The grey leans
 * toward the page's indigo so it reads as chosen rather than as unstyled.
 *
 * Calendar v2 borrows the same grey for "still active" in its boundary bar, for
 * the same reason: nothing happened to those jobs.
 */
export const LEVEL_LINE_COLOR = "#a3a6b8";

/** The midnight dot on the trace; a step darker so it survives on the boundary. */
export const LEVEL_DOT_COLOR = "#7e829a";

/**
 * Calendar v2's boundary bar: what became of the jobs open when the day began.
 * Three states, since placements are not part of it: the two terminal colours,
 * and grey for what is still open -- grey because nothing happened to those
 * jobs, and the bar is about what happened.
 */
export type OutcomeState = "active" | "completed" | "removed";

/**
 * Bottom-up stacking order: completed at the base, removed above it, and the
 * still-open work on top -- so read top down it is active, removed, completed,
 * the order chosen for v2.
 */
export const OUTCOME_ORDER: OutcomeState[] = ["completed", "removed", "active"];

/** The same order read top-down, for legends and readouts that list the stack. */
export const OUTCOME_ORDER_TOP_DOWN: OutcomeState[] = [...OUTCOME_ORDER].reverse();

/**
 * "Still active" in the boundary bar: a lighter grey than the level trace, so
 * the part of the bar where nothing happened recedes and the teal and red --
 * the part where something did -- carry the bar. The border keeps it legible
 * against the paper.
 */
export const OUTCOME_ACTIVE_COLOR = "#d0d3dd";

export const OUTCOME_STYLES: Record<OutcomeState, { label: string; color: string; description: string }> = {
  active: {
    label: "Still active",
    color: OUTCOME_ACTIVE_COLOR,
    description: "open when the day began and still open at its end; nothing happened to these",
  },
  completed: {
    label: "Completed",
    color: BAR_STATE_STYLES.completed.color,
    description: "open when the day began and completed during it",
  },
  removed: {
    label: "Removed",
    color: BAR_STATE_STYLES.removed.color,
    description: "open when the day began and removed during it",
  },
};


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
