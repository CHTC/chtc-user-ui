"use client";

import { Box, Button, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";

import type { BucketUnit, DayActivity, DayLevel } from "./binModel";
import DayActivityBars from "./DayActivityBars";
import { describeActivity, type ActivityState } from "./palette";
import {
  PERIOD_OPTIONS,
  formatDayLong,
  formatDayShort,
  type PeriodKey,
  type PeriodSummary,
} from "./dayCards";
import { ActivityRows } from "./StateRows";

/** How tall the summary chart draws: the day dialog's chart, with more room. */
const CHART_HEIGHT = 300;

interface PeriodCardProps {
  summary: PeriodSummary | null;
  period: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  onOpenDetail: () => void;
  /** Change counts per bar, for whatever is selected. */
  activity: DayActivity | null;
  /** Which states the bars stack. */
  bars: ActivityState[];
  /** The open-jobs level at the close of each bar, drawn as a line over the bars. */
  level: DayLevel | null;
  /** What one bar spans: 4 hours for a day, a day for a week, a week for a month. */
  unit: BucketUnit;
}

function rangeLabel(summary: PeriodSummary): string {
  if (summary.days.length === 1) return formatDayLong(summary.days[0]);
  return `${formatDayShort(summary.days[0])} – ${formatDayShort(summary.days[summary.days.length - 1])}`;
}

/** "4-hour window", "day", "week": what one bar is, in prose. */
const BAR_NOUN: Record<BucketUnit, string> = {
  hours: "4-hour window",
  days: "day",
  weeks: "week",
};

/**
 * The landing summary: what moved over a trailing period, as the calendar's
 * own stacked bars drawn large, with the queue level over them. First thing a
 * user wants on opening the page, before going hunting through the month.
 *
 * The bars widen with the period so there are always a handful of them: six
 * 4-hour windows for yesterday, a bar per day for the week, a bar per week for
 * the month. One picture whatever is selected -- a single cluster or batch is
 * the same chart filtered down -- so what the reader learns to read here is
 * exactly what the calendar below is saying in miniature.
 *
 * The period ends on the last complete day rather than the as-of day, since the
 * as-of day is still in progress and would understate every count.
 */
export default function PeriodCard({
  summary,
  period,
  onPeriodChange,
  onOpenDetail,
  activity,
  bars,
  level,
  unit,
}: PeriodCardProps) {
  const moved = summary ? summary.transitions : 0;
  const chartVisible = !!summary && (activity?.hasData ?? false);

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, sm: 2.5 }, borderColor: "primary.main", borderWidth: 2 }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
            What happened
          </Typography>
          <Select
            size="small"
            value={period}
            onChange={(event) => onPeriodChange(event.target.value as PeriodKey)}
            aria-label="Summary period"
            sx={{ fontWeight: 700 }}
          >
            {PERIOD_OPTIONS.map((option) => (
              <MenuItem key={option.key} value={option.key}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {summary && (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {rangeLabel(summary)}
              {summary.truncated && " · limited by the baked window"}
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          {summary && summary.days.length === 1 && (
            <Button variant="outlined" size="small" onClick={onOpenDetail}>
              See the full day
            </Button>
          )}
        </Stack>

        {!summary || (moved === 0 && !chartVisible) ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            No jobs changed state.
          </Typography>
        ) : (
          <>
            {activity?.hasData && (
              <DayActivityBars
                bins={activity.bins}
                height={CHART_HEIGHT}
                unit={unit}
                level={level}
                shown={bars}
                label={`Jobs ${describeActivity(bars)} per ${BAR_NOUN[unit]} over ${rangeLabel(summary)}, with the number of open jobs at the close of each`}
              />
            )}

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 1.5, md: 4 }}
              alignItems={{ md: "flex-start" }}
            >
              <Box sx={{ flexShrink: 0 }}>
                <Typography variant="body2" sx={{ mb: 0.75 }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {moved.toLocaleString()}
                  </Box>{" "}
                  <Box component="span" sx={{ color: "text.secondary" }}>
                    state changes, broken down as:
                  </Box>
                </Typography>
                <ActivityRows
                  placed={summary.placed}
                  completed={summary.completed}
                  removed={summary.removed}
                />
              </Box>
              <Typography
                variant="caption"
                component="p"
                sx={{ color: "text.secondary", fontStyle: "italic", alignSelf: { md: "flex-end" } }}
              >
                Counts transitions, not jobs: a job placed and finished inside the period counts
                on two lines.
                {summary.distinctChanged !== null &&
                  ` ${summary.distinctChanged.toLocaleString()} distinct ${
                    summary.distinctChanged === 1 ? "job" : "jobs"
                  } moved.`}
              </Typography>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
