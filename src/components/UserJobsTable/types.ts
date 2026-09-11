// Shape of GET /jobs/users, the admin-only range table behind /users/jobs.
//
// Unlike the two per-owner payloads next door, this one is about everybody: one
// row per user who finished a job in the range, busiest first. It is the index
// the calendar hangs off -- a row's calendar icon opens that user at
// /users/jobs/calendar/?user=<owner>.
//
// Every figure is a sum or a count, which is what lets the API assemble a range
// out of its individual days and cache each one. A job counts on the day it
// finished, so consecutive ranges tile without counting anything twice.

/**
 * One user's totals over the range.
 *
 * The three nullable fields have no denominator behind them -- no slot time
 * recorded, nothing requested, no jobs -- and are null rather than zero, because
 * a zero here would read as "perfectly inefficient" when the truth is "not
 * known". The table prints them as an em dash.
 */
export interface UserRangeRow {
  /** HTCondor's Owner, which is the netid. */
  owner: string;
  jobs: number;
  /** Slot time (wall clock x cores provisioned) over the range, in hours. */
  coreHours: number;
  removed: number;
  removedPct: number;
  held: number;
  failed: number;
  failedPct: number;
  retried: number;
  retriedPct: number;
  /** Mean wall-clock seconds per job. Null when there were no jobs to divide by. */
  avgRuntimeSeconds: number | null;

  /**
   * Requested against used, per resource. The gap between the two totals is the
   * over-request story: a user who asked the pool for 6,000 GB of memory and
   * touched 60 of it was holding a hundred times what they needed.
   *
   * Totals rather than per-job typical values, because a sum merges across days
   * exactly and a median does not -- that is what lets the API assemble a range
   * out of cached days. Each percentage is one total over the other, so a busy
   * day weighs more than a quiet one.
   *
   * Both are GB *summed over jobs*, not GB held at any one moment, and they run
   * into the millions over a month, so the table prints them with a scaled unit.
   */
  memoryRequestedGb: number;
  memoryUsedGb: number;
  memoryPct: number | null;
  diskRequestedGb: number;
  diskUsedGb: number;
  diskPct: number | null;
  /** Cores summed over jobs. Not core-hours -- `coreHours` weights by duration. */
  cpusRequested: number;
}

export interface UserRangeSummary {
  /** First day counted, "YYYY-MM-DD". */
  start: string;
  /** Exclusive: the first day *not* counted, "YYYY-MM-DD". */
  end: string;
  /** Number of days between them, which is what the API actually queried. */
  days: number;
  timezone: string;
  generatedAt: string;
  users: UserRangeRow[];
  totalUsers: number;
  /** More distinct owners existed than the aggregation returned, so this is a prefix. */
  truncated: boolean;
  source: { host: string; index: string };
}
