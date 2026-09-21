// Colors for the three-state model this page paints throughout: the summary
// chart at the top and the 4-hour bars below it share one vocabulary.
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

export interface BarStateStyle {
  key: BarState;
  label: string;
  color: string;
  /** Phrasing for tooltips and captions. */
  description: string;
}

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
 * Carried-active light indigo: work that was already in play before the day
 * opened, in the midnight dot's readout.
 *
 * Validated in the Sankey page's palette against the other five at --pairs all:
 * all gates PASS, worst CVD 11.6. Darkening the indigo instead was tried first
 * and failed -- #5a6ba8 measures only 10.2 against #3b5bdb for normal vision,
 * and #7d84c4 collides with the teal. Lightening had the room in it.
 */
export const CARRIED_ACTIVE_COLOR = "#8ea3e8";

/**
 * The queue level trace on the v1 calendar, drawn behind the bars and coloured
 * by its own steepness: blue where the queue is flat, through purple to red
 * where it drops or climbs the whole slot within one 4-hour window. A dual
 * encoding of the slope the line already draws, so the fast-moving windows can
 * be picked out across a month without reading each tile's shape. Direction is
 * deliberately not encoded -- a batch landing and a batch finishing are both
 * "the queue is moving fast", and the line's shape already says which.
 *
 * It replaced a hatched indigo column astride each midnight, which read as one
 * more bar, and then a flat grey (#a3a6b8), which took the trace out of the
 * state vocabulary but made a busy day and a quiet one look alike. The three
 * stops sit apart from the state colours on purpose: the blue is lighter and
 * greyer than the active indigo, the red is bluer than removed.
 *
 * Calendar v2's "still active" grey and the midnight dot keep the old neutral.
 */
export const LEVEL_SLOPE_STOPS: [string, string, string] = ["#5b8def", "#8b5cf6", "#d63b6e"];

/**
 * The neutral grey the midnight dot used to be, kept for v2's boundary-bar
 * border. The dot itself now takes the colour of the window closing into it,
 * so it reads as the end of that segment rather than a separate mark.
 */
export const LEVEL_DOT_COLOR = "#7e829a";

/** Parses "#rrggbb" into its three channels. */
function hexChannels(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/**
 * How hard the slope ramp leans toward its steep end. The ramp position is
 * log(1 + GAIN * steepness) / log(1 + GAIN), so with 1000 a move of 3% of the
 * slot in one window -- a couple of pixels on a real tile -- already reads as
 * the purple midpoint, and half the slot is most of the way to red. Blue is
 * reserved for a line that is genuinely flat: the point is to tell "nothing
 * moved" from "something moved" at a glance, and the eye can see how much.
 */
export const LEVEL_SLOPE_LOG_GAIN = 1000;

/**
 * The trace colour for a segment of the given steepness, 0 (flat) to 1 (the
 * whole slot's height in one window). Log-scaled (see LEVEL_SLOPE_LOG_GAIN),
 * then piecewise linear through the three stops with the purple at the
 * midpoint. Clamped, since a segment cannot move more than the slot.
 */
export function levelSlopeColor(steepness: number): string {
  const clamped = Math.min(1, Math.max(0, steepness));
  const t = Math.log1p(LEVEL_SLOPE_LOG_GAIN * clamped) / Math.log1p(LEVEL_SLOPE_LOG_GAIN);
  const [from, to, local] =
    t < 0.5
      ? [LEVEL_SLOPE_STOPS[0], LEVEL_SLOPE_STOPS[1], t * 2]
      : [LEVEL_SLOPE_STOPS[1], LEVEL_SLOPE_STOPS[2], (t - 0.5) * 2];
  const a = hexChannels(from);
  const b = hexChannels(to);
  const mix = a.map((channel, i) => Math.round(channel + (b[i] - channel) * local));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

/**
 * The trace segments between consecutive level readings, each with the colour
 * its steepness earns. `ys` are the drawn pixel heights from the top of a slot
 * of `height` px, so the steepness is what the eye sees after the page's
 * scale has been applied; one x unit per reading.
 */
export function levelSegments(
  ys: number[],
  height: number,
): { x1: number; y1: number; x2: number; y2: number; color: string }[] {
  const out = [];
  for (let i = 1; i < ys.length; i++) {
    const y1 = ys[i - 1];
    const y2 = ys[i];
    out.push({
      x1: i - 1,
      y1,
      x2: i,
      y2,
      color: levelSlopeColor(height > 0 ? Math.abs(y2 - y1) / height : 0),
    });
  }
  return out;
}

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

/**
 * Calendar v1's completion fill: the tile's background rises to the share of
 * the jobs open at the day's start that completed during it, in the completed
 * teal at low alpha. Translucent because it sits under everything else in the
 * tile -- the date, the six bars, the level trace, the caption -- and none of
 * them may lose contrast to it. Teal rather than a new hue so it reads as the
 * same "completed" the bars and the Sankey already use.
 */
export const COMPLETION_FILL_COLOR = "rgba(42, 157, 143, 0.22)";
