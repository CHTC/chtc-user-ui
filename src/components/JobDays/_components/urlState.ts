// URL-linkable view state for this page: which cluster, which bar scale, and
// which days the bars are scaled to.
//
// replaceState rather than a router push -- the site is a static export and the
// selection is a view preference, not navigation, so it should not stack history
// entries the back button has to walk through. Defaults clear their param so a
// shared link carries only what was actually changed.

import type { BarScale } from "../types";
import { ALL_GROUPS, type GroupBy } from "./grouping";
import type { DayRange } from "./JobCalendar";

/** Which grouping is in force, and which group within it is selected. */
export const GROUP_BY_PARAM = "groupBy";
export const GROUP_PARAM = "group";
export const SCALE_PARAM = "scale";
/** The days the bars are scaled to, as "YYYY-MM-DD..YYYY-MM-DD". */
export const RANGE_PARAM = "range";

export const DEFAULT_GROUP_BY: GroupBy = "cluster";

/**
 * Linear is the default because it is the honest one: heights are proportional,
 * so a reader who never touches the toggle is not being shown a distorted
 * picture. When linear turns out to flatten the month into slivers the page says
 * so and points at the Log button (see buildScaleAdvice) rather than quietly
 * switching scales on the reader's behalf.
 */
export const DEFAULT_SCALE: BarScale = "linear";

function write(param: string, value: string | null): void {
  const url = new URL(window.location.href);
  if (value === null) url.searchParams.delete(param);
  else url.searchParams.set(param, value);
  window.history.replaceState(null, "", url);
}

/**
 * Both grouping params move together: the selected id only means anything
 * alongside the grouping it belongs to, so writing one without the other would
 * produce links that resolve to the wrong group.
 */
export function writeGroupParams(groupBy: GroupBy, selection: string): void {
  const url = new URL(window.location.href);
  if (groupBy === DEFAULT_GROUP_BY) url.searchParams.delete(GROUP_BY_PARAM);
  else url.searchParams.set(GROUP_BY_PARAM, groupBy);
  if (selection === ALL_GROUPS) url.searchParams.delete(GROUP_PARAM);
  else url.searchParams.set(GROUP_PARAM, selection);
  window.history.replaceState(null, "", url);
}

/** What a URL asks for, before the data has had a chance to reject it. */
export function readGroupParams(search: string): { groupBy: GroupBy; selection: string } {
  const params = new URLSearchParams(search);
  const groupBy = params.get(GROUP_BY_PARAM);
  return {
    groupBy: groupBy === "batch" ? "batch" : DEFAULT_GROUP_BY,
    selection: params.get(GROUP_PARAM) ?? ALL_GROUPS,
  };
}

export function writeScaleParam(next: BarScale): void {
  write(SCALE_PARAM, next === DEFAULT_SCALE ? null : next);
}

/** The scale a URL asks for, or null when it says nothing usable. */
export function readScaleParam(search: string): BarScale | null {
  const value = new URLSearchParams(search).get(SCALE_PARAM);
  return value === "linear" || value === "log" ? value : null;
}

/**
 * One param for both ends, since either alone means nothing. No range clears
 * it, so a link carries the range only when the reader has dragged one out.
 */
export function writeRangeParam(range: DayRange | null): void {
  write(RANGE_PARAM, range ? `${range.start}..${range.end}` : null);
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The range a URL asks for, or null when it is missing or malformed. Ends in
 * either order are accepted and put the right way round; whether the days
 * exist in the data is not checked here -- a range with no data in it just
 * greys the grid, which is what the link said to do.
 */
export function readRangeParam(search: string): DayRange | null {
  const value = new URLSearchParams(search).get(RANGE_PARAM);
  if (!value) return null;
  const [a, b] = value.split("..");
  if (!a || !b || !DAY_KEY.test(a) || !DAY_KEY.test(b)) return null;
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/**
 * localStorage key recording that the reader has closed the cell guide, which is
 * all it takes: closing it is what dismisses it, and it never opens by itself
 * again afterwards. The button under the calendar reopens it on demand.
 *
 * Read in an effect rather than during render -- the page is statically
 * exported, so touching storage while rendering would not match the server's
 * HTML.
 */
export const CELL_GUIDE_KEY = "days.cellGuideDismissed";

/**
 * Calendar v2 has its own guide, and its own dismissal: a reader who has learnt
 * the v1 cell has not learnt the v2 one.
 */
export const CELL_GUIDE_V2_KEY = "days.cellGuideV2Dismissed";

export function readGuideDismissed(key: string = CELL_GUIDE_KEY): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Private-browsing modes throw on access; showing the guide again is the
    // harmless failure.
    return false;
  }
}

export function writeGuideDismissed(dismissed: boolean, key: string = CELL_GUIDE_KEY): void {
  try {
    if (dismissed) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
  } catch {
    // Nothing to do: the guide simply reappears next time.
  }
}
