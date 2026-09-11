"use client";

// The range table at /users/jobs: who ran jobs over a chosen span of days, and
// which of them is worth a closer look.
//
// This is the index in front of the per-user calendar. A row's calendar icon
// opens that user at /users/jobs/calendar/?user=<owner>, which is the page this
// route used to be.
//
// Sorting, filtering and paging are all client-side, deliberately. The payload
// is one aggregation of a few hundred rows -- the whole range arrives at once
// and costs a few seconds to build -- so re-sorting in the browser is instant,
// while a server round-trip per sort would make the page feel broken and would
// re-read Elasticsearch for numbers already in hand.

import { apiFetch } from "@/src/components/AuthProvider";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import {
  Alert,
  AlertTitle,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import EmptyTableMessage from "../EmptyTableMessage/EmptyTableMessage";
import type { UserRangeRow, UserRangeSummary } from "./types";

const START_PARAM = "start";
const END_PARAM = "end";
const ROWS_PER_PAGE = 50;
/** Matches the API's own cap, so an over-long range is refused before it is sent. */
const MAX_RANGE_DAYS = 366;

/** An error carrying the status that produced it, so the page can explain it. */
class UsersApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UsersApiError";
    this.status = status;
  }
}

// --- Ranges -------------------------------------------------------------------
//
// Dates are handled as plain "YYYY-MM-DD" strings throughout rather than as Date
// objects. They are what the API takes and returns, they compare and sort
// correctly as strings, and keeping them out of Date avoids the timezone shift
// that `new Date("2026-07-01")` introduces by parsing as UTC.

const DAY_MS = 86_400_000;

/** "YYYY-MM-DD" for a Date, read in local time. */
function toIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Parse "YYYY-MM-DD" as a local date, not the UTC one `new Date(iso)` gives. */
function parseDay(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function shiftDays(iso: string, delta: number): string {
  const date = parseDay(iso);
  date.setDate(date.getDate() + delta);
  return toIso(date);
}

function daysBetween(start: string, end: string): number {
  return Math.round((parseDay(end).getTime() - parseDay(start).getTime()) / DAY_MS);
}

function isIsoDay(value: string | null): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDay(value).getTime());
}

interface Range {
  start: string;
  /** Exclusive, matching the API. */
  end: string;
}

/**
 * The presets worth a click.
 *
 * `end` is exclusive and tomorrow-dated for the "last N days" entries, so today's
 * partial day is included -- a facilitator looking at the last week means up to
 * and including now, not up to last midnight.
 */
const PRESETS: { label: string; range: () => Range }[] = [
  { label: "Last 7 days", range: () => ({ start: toIso(new Date(Date.now() - 6 * DAY_MS)), end: toIso(new Date(Date.now() + DAY_MS)) }) },
  { label: "Last 30 days", range: () => ({ start: toIso(new Date(Date.now() - 29 * DAY_MS)), end: toIso(new Date(Date.now() + DAY_MS)) }) },
  {
    label: "This month",
    range: () => {
      const now = new Date();
      return { start: toIso(new Date(now.getFullYear(), now.getMonth(), 1)), end: toIso(new Date(Date.now() + DAY_MS)) };
    },
  },
  {
    label: "Last month",
    range: () => {
      const now = new Date();
      return {
        start: toIso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end: toIso(new Date(now.getFullYear(), now.getMonth(), 1)),
      };
    },
  },
];

function defaultRange(): Range {
  return PRESETS[1].range();
}

/**
 * Read on mount rather than through useSearchParams(): the site is a static
 * export, and useSearchParams() forces a Suspense boundary the rest of this
 * route does not want. The job viewer next door reads its params the same way.
 */
function readRangeParams(): Range {
  const params = new URLSearchParams(window.location.search);
  const start = params.get(START_PARAM);
  const end = params.get(END_PARAM);
  if (isIsoDay(start) && isIsoDay(end) && start < end) return { start, end };
  return defaultRange();
}

function writeRangeParams(range: Range): void {
  const url = new URL(window.location.href);
  url.searchParams.set(START_PARAM, range.start);
  url.searchParams.set(END_PARAM, range.end);
  window.history.replaceState(null, "", url);
}

/**
 * Why a range cannot be asked for, or null when it can.
 *
 * Checked here as well as in the API so a mistyped date says so immediately
 * instead of after a round trip that was always going to be a 422.
 */
function rangeProblem(range: Range): string | null {
  if (!isIsoDay(range.start) || !isIsoDay(range.end)) return "Both dates are needed.";
  if (range.end <= range.start) return "The end date must be after the start date.";
  if (daysBetween(range.start, range.end) > MAX_RANGE_DAYS) {
    return `That is more than ${MAX_RANGE_DAYS} days; ask for a shorter span.`;
  }
  if (range.start > toIso(new Date())) return "The start date is in the future.";
  return null;
}

/** The range as prose, with the exclusive end shown as the last day counted. */
function rangeLabel(range: Range): string {
  const format = (iso: string) =>
    parseDay(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `${format(range.start)} – ${format(shiftDays(range.end, -1))}`;
}

// --- Formatting ---------------------------------------------------------------

const DASH = "—";

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatHours(value: number): string {
  return Math.round(value).toLocaleString();
}

/**
 * One decimal below ten, none above. A 2.3% failure rate and a 25% one are both
 * worth reading precisely, but "18.3%" and "18%" say the same thing while the
 * difference between 0.1% and 0% is the whole point.
 */
function formatPct(value: number | null): string {
  if (value === null || Number.isNaN(value)) return DASH;
  return value < 10 ? `${value.toFixed(1)}%` : `${Math.round(value)}%`;
}

/**
 * A GB total, scaled to a unit a person can read.
 *
 * These are sums over every job in the range, so they run from a fraction of a
 * gigabyte to tens of millions of them. Printing all of that in GB gives an
 * eight-digit number in most rows and nobody can compare those at a glance, so
 * each cell carries its own unit and the group heading carries none.
 */
function formatGb(gb: number | null): string {
  if (gb === null || Number.isNaN(gb)) return DASH;
  const [value, unit] =
    gb >= 1024 * 1024 ? [gb / (1024 * 1024), "PB"] : gb >= 1024 ? [gb / 1024, "TB"] : [gb, "GB"];
  // Three significant figures below ten, none above: "9.41 TB" and "412 TB" are
  // both as precise as the reader needs, and the same width.
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: value < 10 ? 2 : 0,
    maximumFractionDigits: value < 10 ? 2 : 0,
  })} ${unit}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return DASH;
  const total = Math.round(seconds);
  if (total < 60) return `${total}s`;
  if (total < 3600) return `${Math.floor(total / 60)}m`;
  if (total < 86400) return `${Math.floor(total / 3600)}h${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}m`;
  return `${Math.floor(total / 86400)}d${String(Math.floor((total % 86400) / 3600)).padStart(2, "0")}h`;
}

/**
 * Colour for a figure that can be bad, or undefined to leave it alone.
 *
 * Restrained on purpose: the point is that an eye scanning the column lands on
 * the two or three rows worth opening, which stops being true if half the table
 * is coloured.
 */
function severity(
  value: number | null,
  warn: number,
  bad: number,
  /** True for a figure where a *low* number is the bad one, like efficiency. */
  lowIsBad = false,
): string | undefined {
  if (value === null || Number.isNaN(value)) return undefined;
  const reached = (threshold: number) => (lowIsBad ? value <= threshold : value >= threshold);
  if (reached(bad)) return "error.main";
  if (reached(warn)) return "warning.main";
  return undefined;
}

// --- Columns ------------------------------------------------------------------

type SortKey = keyof Pick<
  UserRangeRow,
  | "owner"
  | "jobs"
  | "coreHours"
  | "removedPct"
  | "held"
  | "failedPct"
  | "retriedPct"
  | "avgRuntimeSeconds"
  | "memoryRequestedGb"
  | "memoryUsedGb"
  | "memoryPct"
  | "diskRequestedGb"
  | "diskUsedGb"
  | "diskPct"
  | "cpusRequested"
>;

interface Column {
  key: SortKey;
  label: string;
  help: string;
  numeric: boolean;
  /**
   * Header this column sits under. Contiguous columns sharing one are spanned by
   * a single grouping cell, which is what keeps fifteen columns readable.
   */
  group?: string;
  /**
   * Tints the whole column. Applied to alternate groups so the three resource
   * blocks separate visually -- with Memory and CPU shaded, Disk between them
   * reads as its own block without needing a third colour or a rule.
   */
  shaded?: boolean;
  render: (row: UserRangeRow) => React.ReactNode;
  color?: (row: UserRangeRow) => string | undefined;
}

const COLUMNS: Column[] = [
  {
    key: "owner",
    label: "User",
    help: "HTCondor's Owner, which is the netid.",
    numeric: false,
    render: (row) => row.owner,
  },
  {
    key: "jobs",
    label: "Jobs",
    help: "Jobs that reached a terminal state in this window.",
    numeric: true,
    render: (row) => formatCount(row.jobs),
  },
  {
    key: "coreHours",
    label: "Core-hours",
    help: "Wall-clock time multiplied by the cores each job provisioned. What the user actually cost the pool.",
    numeric: true,
    render: (row) => formatHours(row.coreHours),
  },
  {
    key: "removedPct",
    label: "Removed",
    help: "Share of jobs that left the queue by being removed rather than completing.",
    numeric: true,
    render: (row) => formatPct(row.removedPct),
    color: (row) => severity(row.removedPct, 20, 50),
  },
  {
    key: "held",
    label: "Held",
    help: "Jobs that went on hold at least once.",
    numeric: true,
    render: (row) => formatCount(row.held),
  },
  {
    key: "failedPct",
    label: "Failed",
    help: "Share of jobs that exited with a non-zero exit code.",
    numeric: true,
    render: (row) => formatPct(row.failedPct),
    color: (row) => severity(row.failedPct, 10, 25),
  },
  {
    key: "retriedPct",
    label: "Retried",
    help: "Share of jobs that started more than once — evicted and restarted.",
    numeric: true,
    render: (row) => formatPct(row.retriedPct),
    color: (row) => severity(row.retriedPct, 10, 25),
  },
  {
    key: "avgRuntimeSeconds",
    label: "Avg runtime",
    help: "Mean wall-clock time per job. Very short averages over very many jobs are worth a conversation.",
    numeric: true,
    render: (row) => formatDuration(row.avgRuntimeSeconds),
  },
  {
    key: "memoryRequestedGb",
    label: "Requested",
    group: "Memory",
    shaded: true,
    help: "Memory requested, summed over every job in the range.",
    numeric: true,
    render: (row) => formatGb(row.memoryRequestedGb),
  },
  {
    key: "memoryUsedGb",
    label: "Used",
    group: "Memory",
    shaded: true,
    help: "Memory actually used, summed over the same jobs.",
    numeric: true,
    render: (row) => formatGb(row.memoryUsedGb),
  },
  {
    key: "memoryPct",
    label: "Used %",
    group: "Memory",
    shaded: true,
    help:
      "Total used over total requested. Low means the pool was holding memory nobody " +
      "touched; near or above 100% means jobs are outgrowing what they ask for.",
    numeric: true,
    render: (row) => formatPct(row.memoryPct),
    color: (row) => severity(row.memoryPct, 25, 10, true),
  },
  {
    key: "diskRequestedGb",
    label: "Requested",
    group: "Disk",
    help: "Disk requested, summed over every job in the range.",
    numeric: true,
    render: (row) => formatGb(row.diskRequestedGb),
  },
  {
    key: "diskUsedGb",
    label: "Used",
    group: "Disk",
    help: "Disk actually used, summed over the same jobs.",
    numeric: true,
    render: (row) => formatGb(row.diskUsedGb),
  },
  {
    key: "diskPct",
    label: "Used %",
    group: "Disk",
    help: "Total used over total requested, read the same way as memory.",
    numeric: true,
    render: (row) => formatPct(row.diskPct),
    color: (row) => severity(row.diskPct, 25, 10, true),
  },
  {
    key: "cpusRequested",
    label: "Requested",
    group: "CPU",
    shaded: true,
    help:
      "Cores requested, summed over every job in the range. Not core-hours \u2014 that is " +
      "its own column and weights each job by how long it held them.",
    numeric: true,
    render: (row) => formatCount(row.cpusRequested),
  },
];

/**
 * Contiguous runs of columns sharing a group, for the spanning header row.
 * Computed once: COLUMNS never changes.
 */
const COLUMN_GROUPS: { label: string | null; span: number; shaded: boolean }[] = COLUMNS.reduce(
  (groups, column) => {
    const label = column.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.label === label && label !== null) last.span += 1;
    else groups.push({ label, span: 1, shaded: !!column.shaded });
    return groups;
  },
  [] as { label: string | null; span: number; shaded: boolean }[],
);

/** Nulls sort last in both directions: "not known" is not a small number. */
function compare(a: UserRangeRow, b: UserRangeRow, key: SortKey, descending: boolean): number {
  const left = a[key];
  const right = b[key];
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === "string" || typeof right === "string") {
    const result = String(left).localeCompare(String(right));
    return descending ? -result : result;
  }
  const result = (left as number) - (right as number);
  return descending ? -result : result;
}

// --- Page ---------------------------------------------------------------------

function TableSkeleton() {
  return (
    <Stack spacing={1}>
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} variant="rectangular" height={36} />
      ))}
      <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center", pt: 1 }}>
        Aggregating the range a day at a time. The first look takes a few seconds; days you have
        already loaded are reused, so overlapping ranges come back instantly.
      </Typography>
    </Stack>
  );
}

function UsersError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = error instanceof UsersApiError ? error.status : 0;
  const detail = error instanceof Error ? error.message : String(error);

  if (status === 403) {
    return (
      <Alert severity="warning">
        <AlertTitle>Admins only</AlertTitle>
        This table covers every user, so it is restricted to admins. Your own jobs are at{" "}
        <Link href="/users/me/jobs/">My Jobs</Link>.
      </Alert>
    );
  }

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
    >
      <AlertTitle>{status === 502 ? "The job history service did not answer" : "Could not load the range"}</AlertTitle>
      {detail}
    </Alert>
  );
}

export default function UserJobsTable() {
  // Null until the URL has been read, so the table does not fetch the default
  // range and then immediately refetch whichever range a shared link named.
  const [range, setRange] = useState<Range | null>(null);
  // What the two date fields hold, which is not the same thing: a half-typed
  // date must not fire a request, so the committed range above only follows
  // this once it is valid.
  const [draft, setDraft] = useState<Range | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("jobs");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const initial = readRangeParams();
    setRange(initial);
    setDraft(initial);
  }, []);

  const { data, error, isLoading, mutate } = useSWR<UserRangeSummary, unknown>(
    range ? ["/jobs/users", range.start, range.end] : null,
    async ([endpoint, start, end]) => {
      const query = new URLSearchParams({ start: start as string, end: end as string });
      const response = await apiFetch(`${endpoint}?${query}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const message = typeof body?.detail === "string" ? body.detail : response.statusText;
        throw new UsersApiError(message, response.status);
      }
      return response.json() as Promise<UserRangeSummary>;
    },
    // Mostly settled history, and the API caches its days for hours; refetching
    // on every window focus would buy nothing.
    { revalidateOnFocus: false },
  );

  /** Commit a range: only a usable one is sent, and it becomes the shareable URL. */
  const commit = (next: Range) => {
    setDraft(next);
    if (rangeProblem(next)) return;
    setRange(next);
    writeRangeParams(next);
    setPage(0);
  };

  const problem = draft ? rangeProblem(draft) : null;

  const sortBy = (key: SortKey) => {
    if (key === sortKey) {
      setDescending(!descending);
    } else {
      setSortKey(key);
      // Numbers are interesting from the top down; a netid is not.
      setDescending(key !== "owner");
    }
    setPage(0);
  };

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = search.trim().toLowerCase();
    const filtered = needle ? data.users.filter((row) => row.owner.toLowerCase().includes(needle)) : data.users;
    return [...filtered].sort((a, b) => compare(a, b, sortKey, descending));
  }, [data, search, sortKey, descending]);

  const visible = rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "flex-start" }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            size="small"
            type="date"
            label="From"
            value={draft?.start ?? ""}
            onChange={(event) => draft && commit({ ...draft, start: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!problem}
            sx={{ width: 168 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            // The API's end is exclusive; the reader picks the last day they
            // want counted, so a day is added on the way in and taken off on
            // the way out.
            value={draft ? shiftDays(draft.end, -1) : ""}
            onChange={(event) =>
              draft &&
              isIsoDay(event.target.value) &&
              commit({ ...draft, end: shiftDays(event.target.value, 1) })
            }
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!problem}
            sx={{ width: 168 }}
          />
        </Stack>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {PRESETS.map((preset) => (
            <Button key={preset.label} size="small" onClick={() => commit(preset.range())}>
              {preset.label}
            </Button>
          ))}
        </Stack>

        <TextField
          size="small"
          label="Filter by netid"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          sx={{ maxWidth: 220 }}
        />
      </Stack>

      {problem ? (
        <Alert severity="warning">{problem}</Alert>
      ) : data ? (
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {formatCount(data.totalUsers)} users · {rangeLabel(data)} · {data.days}{" "}
          {data.days === 1 ? "day" : "days"} — a job counts on the day it finished.
        </Typography>
      ) : null}

      {data?.truncated && (
        <Alert severity="warning">
          <AlertTitle>More users than this table can show</AlertTitle>
          The month had more distinct users than one aggregation returns, so these are the busiest
          rather than all of them.
        </Alert>
      )}

      {error ? (
        <UsersError error={error} onRetry={() => void mutate()} />
      ) : isLoading || !data ? (
        <TableSkeleton />
      ) : (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                {/* Spanning row: says each unit once instead of in every heading. */}
                <TableRow>
                  <TableCell padding="checkbox" sx={{ borderBottom: "none" }} />
                  {COLUMN_GROUPS.map((group, index) => (
                    <TableCell
                      key={group.label ?? `ungrouped-${index}`}
                      colSpan={group.span}
                      align="center"
                      sx={{
                        borderBottom: group.label ? 1 : "none",
                        borderColor: "divider",
                        color: "text.secondary",
                        fontWeight: 500,
                        py: 0.5,
                        whiteSpace: "nowrap",
                        // A theme token rather than a fixed grey, so the tint
                        // stays subtle in both the light and the dark palette.
                        bgcolor: group.shaded ? "action.hover" : undefined,
                      }}
                    >
                      {group.label}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell padding="checkbox" />
                  {COLUMNS.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.numeric ? "right" : "left"}
                      sx={{ bgcolor: column.shaded ? "action.hover" : undefined }}
                    >
                      <Tooltip title={column.help} enterDelay={400}>
                        <TableSortLabel
                          active={sortKey === column.key}
                          direction={sortKey === column.key && descending ? "desc" : "asc"}
                          onClick={() => sortBy(column.key)}
                        >
                          {column.label}
                        </TableSortLabel>
                      </Tooltip>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.length === 0 ? (
                  <EmptyTableMessage
                    message={search ? `No user matching "${search}"` : "No jobs finished in this range"}
                  />
                ) : (
                  visible.map((row) => (
                    <TableRow key={row.owner} hover>
                      <TableCell padding="checkbox">
                        <IconButton
                          component={Link}
                          // The range goes with the netid. Without it the
                          // calendar falls back to the days leading up to today,
                          // which for a range in the past is a different question
                          // than the one the reader just asked.
                          href={`/users/jobs/calendar/?user=${encodeURIComponent(row.owner)}&start=${data.start}&end=${data.end}`}
                          size="small"
                          aria-label={`Open ${row.owner}'s job calendar`}
                        >
                          <CalendarMonthIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                      {COLUMNS.map((column) => (
                        <TableCell
                          key={column.key}
                          align={column.numeric ? "right" : "left"}
                          sx={{
                            color: column.color?.(row),
                            fontWeight: column.key === "owner" ? 500 : undefined,
                            whiteSpace: "nowrap",
                            bgcolor: column.shaded ? "action.hover" : undefined,
                          }}
                        >
                          {column.render(row)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {rows.length > ROWS_PER_PAGE && (
            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
            />
          )}
        </>
      )}
    </Stack>
  );
}
