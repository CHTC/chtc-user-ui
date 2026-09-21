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
 * by its own steepness on a weather-radar ramp: light blue where the queue is
 * flat, through blue and green as it starts to move, yellow and orange as it
 * speeds up, red for steep, and bright purple where it drops or climbs the
 * whole slot within one 4-hour window. A dual encoding of the slope the line
 * already draws, so the fast-moving windows can be picked out across a month
 * without reading each tile's shape -- and a ramp most readers already know
 * how to read from rain maps: cool is calm, hot is intense, purple is extreme.
 * Direction is deliberately not encoded -- a batch landing and a batch
 * finishing are both "the queue is moving fast", and the line's shape already
 * says which.
 *
 * It replaced a hatched indigo column astride each midnight, which read as one
 * more bar; then a flat grey (#a3a6b8), which took the trace out of the state
 * vocabulary but made a busy day and a quiet one look alike; then a three-stop
 * blue-purple-red ramp, which had too little range to tell "moving" from
 * "moving fast". None of the stops is a state colour: the greens and blues are
 * lighter than the active indigo, the red is more orange than removed.
 *
 * Calendar v2's "still active" grey keeps the old neutral.
 */
export const LEVEL_SLOPE_STOPS: string[] = [
  "#9ecae9", // light blue: flat
  "#2b6cd9", // blue
  "#2fa84f", // green
  "#f2d02c", // yellow
  "#f28c28", // orange
  "#d62828", // red
  "#b44bff", // bright purple: the whole slot in one window
];

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
 * slot in one window -- a couple of pixels on a real tile -- is already into
 * the yellow, and half the slot is red. Light blue is reserved for a line that
 * is genuinely flat: the point is to tell "nothing moved" from "something
 * moved" at a glance, and the eye can see how much.
 */
export const LEVEL_SLOPE_LOG_GAIN = 1000;

/**
 * The trace colour for a segment of the given steepness, 0 (flat) to 1 (the
 * whole slot's height in one window). Log-scaled (see LEVEL_SLOPE_LOG_GAIN),
 * then piecewise linear through the stops, evenly spaced along the ramp.
 * Clamped, since a segment cannot move more than the slot.
 */
export function levelSlopeColor(steepness: number): string {
  const clamped = Math.min(1, Math.max(0, steepness));
  const t = Math.log1p(LEVEL_SLOPE_LOG_GAIN * clamped) / Math.log1p(LEVEL_SLOPE_LOG_GAIN);
  const last = LEVEL_SLOPE_STOPS.length - 1;
  const position = t * last;
  const index = Math.min(last - 1, Math.floor(position));
  const local = position - index;
  const a = hexChannels(LEVEL_SLOPE_STOPS[index]);
  const b = hexChannels(LEVEL_SLOPE_STOPS[index + 1]);
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

/**
 * Every state the bars can stack, bottom up: arrivals at the base, then the
 * two ways out. The reader picks which of these the bars show (see
 * DEFAULT_BARS); this is the order they stack in whatever the pick.
 */
export const ACTIVITY_STACK: ActivityState[] = ["placed", "completed", "removed"];

/**
 * What the bars show until the reader says otherwise: completions only. The
 * bars then answer "how much work got done in this window", and the other two
 * are already visible on the queue line -- a placement as a jump up, a removal
 * as a drop with no bar under it. The toggle above the calendar adds either
 * back, and the readouts quote the hidden counts regardless.
 */
export const DEFAULT_BARS: ActivityState[] = ["completed"];

/** The chosen states in stacking order, whatever order they were picked in. */
export function stackOrder(shown: ActivityState[]): ActivityState[] {
  return ACTIVITY_STACK.filter((state) => shown.includes(state));
}

/** "completed", "completed or removed", "placed, completed or removed" -- for prose. */
export function describeActivity(shown: ActivityState[]): string {
  const labels = stackOrder(shown).map((state) => ACTIVITY_STYLES[state].label.toLowerCase());
  // Nothing picked: the bars are off and only the line draws. "Jobs shown",
  // "nothing shown in this window" still read as sentences.
  if (labels.length === 0) return "shown";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

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
