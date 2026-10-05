// The query parameters the admin calendar is reached with, read in one place
// so the page and its breadcrumb agree on whose jobs these are.

/**
 * `user` is what the table links with.
 *
 * `owner` is read as well: it is the name the API's own query parameter uses and
 * what this page used before the table existed in front of it, so links already
 * sent around keep working.
 */
export const USER_PARAM = "user";
export const LEGACY_USER_PARAM = "owner";
export const START_PARAM = "start";
export const END_PARAM = "end";

/** A [start, end) pair of "YYYY-MM-DD" days, as the table and the API both use. */
export interface DayRange {
  start: string;
  end: string;
}

function isIsoDay(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * The window the table was showing when the reader clicked through, or null to
 * let the viewer use its own default of the days leading up to today.
 */
export function readRangeParams(): DayRange | null {
  const params = new URLSearchParams(window.location.search);
  const start = params.get(START_PARAM);
  const end = params.get(END_PARAM);
  return isIsoDay(start) && isIsoDay(end) && start < end ? { start, end } : null;
}

/**
 * Read on mount rather than through useSearchParams(): the site is a static
 * export, and useSearchParams() forces a Suspense boundary the rest of this
 * route does not want. The job viewer beneath reads its own deep-link params the
 * same way.
 */
export function readOwnerParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  const value = params.get(USER_PARAM) ?? params.get(LEGACY_USER_PARAM);
  return value?.trim() ? value.trim() : null;
}
