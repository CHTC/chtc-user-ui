"use client";

import { useMemo } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  ListSubheader,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import Close from "@mui/icons-material/Close";

import type { StackedBarData } from "../types";
import { buildDayActivity, buildDayLevels, expandSeries } from "./binModel";
import {
  buildDayClusterRoles,
  buildDayOutcomes,
  buildSliceMap,
  formatDayLong,
  formatDayShort,
  type DayClusterRole,
  type DayData,
} from "./dayCards";
import {
  activeLabel,
  placedLabel,
  rollUpDayGroups,
  splitDayGroups,
  type DayGroupEntry,
} from "./dayGroups";
import {
  ALL_GROUPS,
  GROUP_BY_LABELS,
  clusterFilterFor,
  type BatchInfo,
  type GroupBy,
} from "./grouping";
import DayActivityBars from "./DayActivityBars";
import { OUTCOME_ORDER_TOP_DOWN, OUTCOME_STYLES, describeActivity, type ActivityState } from "./palette";
import { ActivityRows } from "./StateRows";
import type { CalendarVersion } from "./VersionSwitch";

interface DayDialogProps {
  /** Cohort/activity source (day-cards bake). */
  dayData: DayData;
  /** 4-hour bin source (stacked-bars bake). */
  barData: StackedBarData;
  /** The day being inspected, or null when the dialog is closed. */
  day: string | null;
  /** Which grouping the page is using; the dialog offers the same one. */
  groupBy: GroupBy;
  /** The page-level selection; the dialog is scoped to it. */
  selection: string;
  /** Change the page-level selection, so the two selects can never disagree. */
  onSelectionChange: (selection: string) => void;
  /** Batch membership, for grouping this day's clusters into batches. */
  batches?: BatchInfo[];
  /** The day everything is read as of. */
  asOf: string;
  /** Which states the page's bars stack; the dialog's chart matches. */
  bars: ActivityState[];
  open: boolean;
  onClose: () => void;
  /**
   * Which calendar opened the dialog. Accepted for the callers' sake but not
   * currently read: both calendars draw the same six-bin chart and the day's
   * outcome for the jobs it inherited, which is where the completion fill's
   * numbers are printed.
   */
  variant?: CalendarVersion;
}

/** The two bin headings in the picker's menu. */
const SUBHEADER = {
  lineHeight: "32px",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
} as const;

/**
 * Centred per-day breakdown: where that day's cohort stands, and how the day's
 * work resolved bin by bin.
 */
export default function DayDialog({
  dayData,
  barData,
  day,
  groupBy,
  selection,
  onSelectionChange,
  batches,
  asOf,
  bars,
  open,
  onClose,
}: DayDialogProps) {
  // Every cluster that was part of this day, with what it placed, what it was
  // already carrying, and what left the queue.
  const dayClusters = useMemo<DayClusterRole[]>(
    () => (day ? buildDayClusterRoles(dayData, day) : []),
    [dayData, day],
  );

  // The same day's clusters under the page's grouping, split into the picker's
  // two bins; see dayGroups.
  const dayGroups = useMemo<DayGroupEntry[]>(
    () => rollUpDayGroups(dayClusters, groupBy, batches),
    [dayClusters, groupBy, batches],
  );

  const { placed: placedGroups, active: activeGroups } = useMemo(
    () => splitDayGroups(dayGroups),
    [dayGroups],
  );

  const listed = placedGroups.length + activeGroups.length;

  // A page-level selection that plays no part in this day falls back to everything
  // rather than presenting an empty breakdown.
  const effective =
    selection !== ALL_GROUPS &&
    !placedGroups.some((g) => g.id === selection) &&
    !activeGroups.some((g) => g.id === selection)
      ? ALL_GROUPS
      : selection;

  const filter = useMemo(
    () => clusterFilterFor(barData.series, batches, groupBy, effective),
    [barData.series, batches, groupBy, effective],
  );

  const slice = useMemo(
    () => (day ? (buildSliceMap(dayData, filter).get(day) ?? null) : null),
    [dayData, filter, day],
  );

  // The day's six-bin derivation for the same scope: per-bin change counts,
  // with the queue level over them, as on the tile and the summary.
  const { activity, level } = useMemo(() => {
    if (!day) return { activity: null, level: null };
    const dayIndex = barData.days.indexOf(day);
    if (dayIndex < 0) return { activity: null, level: null };
    const dense = expandSeries(barData, filter);
    return {
      activity: buildDayActivity(barData, dense, dayIndex, bars),
      level: buildDayLevels(barData, dense).get(day) ?? null,
    };
  }, [barData, filter, day, bars]);

  // What became of the jobs open when this day began, for the same scope as the
  // tile that was clicked. The tile draws this as the completion fill, and has
  // no room for
  // the numbers, so this is where they are.
  const outcome = useMemo(
    () => (day ? (buildDayOutcomes(dayData, filter).get(day) ?? null) : null),
    [dayData, filter, day],
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="body">
      {slice && (
        <>
          <DialogTitle sx={{ pr: 6, pb: 1 }}>
            <Typography component="span" variant="h6" sx={{ fontWeight: 700, display: "block" }}>
              {formatDayLong(slice.day)}
            </Typography>
            <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
              status shown as of {formatDayShort(asOf)}
            </Typography>
            <IconButton
              onClick={onClose}
              aria-label="Close"
              size="small"
              sx={{ position: "absolute", right: 12, top: 12 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="overline"
                  component="label"
                  htmlFor="days-day-group-select"
                  sx={{ color: "text.secondary", display: "block", lineHeight: 1.6 }}
                >
                  {GROUP_BY_LABELS[groupBy]}
                </Typography>
                {/* The bins are flattened into one list of children rather
                    than wrapped per section: a Select resolves its value by
                    looking through its own children, and anything nested in a
                    fragment is invisible to that lookup. */}
                <Select
                  id="days-day-group-select"
                  size="small"
                  value={effective}
                  onChange={(event) => onSelectionChange(String(event.target.value))}
                  sx={{ mt: 0.5, minWidth: 260 }}
                  MenuProps={{ sx: { maxHeight: 420 } }}
                >
                  <MenuItem value={ALL_GROUPS}>
                    {groupBy === "batch"
                      ? `All batches on this day (${listed})`
                      : `All clusters on this day (${listed})`}
                  </MenuItem>
                  {placedGroups.length > 0 && (
                    <ListSubheader key="placed-header" sx={SUBHEADER}>
                      Placed this day ({placedGroups.length})
                    </ListSubheader>
                  )}
                  {placedGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {placedLabel(group)}
                    </MenuItem>
                  ))}
                  {activeGroups.length > 0 && (
                    <ListSubheader key="active-header" sx={SUBHEADER}>
                      Already open this day ({activeGroups.length})
                    </ListSubheader>
                  )}
                  {activeGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {activeLabel(group)}
                    </MenuItem>
                  ))}
                </Select>
                <Typography
                  variant="caption"
                  component="p"
                  sx={{ color: "text.secondary", mt: 0.75 }}
                >
                  Two bins: what arrived this day, then what was already open through it.
                  The second bin is labelled by what left the queue, and the ones where
                  nothing did are at its top.
                </Typography>
              </Box>

              <Box component="section">
                <Typography
                  variant="overline"
                  component="h3"
                  sx={{ color: "text.secondary", lineHeight: 1.6, display: "block" }}
                >
                  Changed state this day
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  all jobs, whenever they were placed
                </Typography>

                {slice.changed === 0 && !(activity?.hasData ?? false) ? (
                  <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
                    No jobs changed state.
                  </Typography>
                ) : (
                  <>
                    {activity?.hasData && (
                      <Box sx={{ mt: 1 }}>
                        <DayActivityBars
                          bins={activity.bins}
                          height={260}
                          level={level}
                          shown={bars}
                          label={`Jobs ${describeActivity(bars)} per 4-hour bin on ${formatDayLong(slice.day)}, with the number of open jobs at the close of each`}
                        />
                      </Box>
                    )}
                    <Box sx={{ mt: 1.5 }}>
                      <ActivityRows
                        placed={slice.queued}
                        completed={slice.completed}
                        removed={slice.removed}
                      />
                    </Box>
                    <Typography
                      variant="caption"
                      component="p"
                      sx={{ color: "text.secondary", mt: 1, fontStyle: "italic" }}
                    >
                      Counts every transition, so a job that did more than one thing this day
                      appears on more than one line. The calendar counts jobs instead:{" "}
                      {slice.changed.toLocaleString()} distinct{" "}
                      {slice.changed === 1 ? "job" : "jobs"} moved this day.
                    </Typography>
                  </>
                )}
              </Box>

              {/* The day's inheritance, drawn large, with its numbers: the
                  population the tile's completion fill is a
                  share of. */}
              {outcome && (
                <Box component="section">
                  <Typography
                    variant="overline"
                    component="h3"
                    sx={{ color: "text.secondary", lineHeight: 1.6, display: "block" }}
                  >
                    Jobs open when the day began
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {outcome.opening.toLocaleString()} jobs, whenever they were placed; nothing
                    placed during the day is counted here
                  </Typography>
                  {outcome.hasData ? (
                    <>
                      <Box
                        role="img"
                        aria-label={`Of ${outcome.opening.toLocaleString()} jobs open when the day began: ${outcome.active.toLocaleString()} still active, ${outcome.completed.toLocaleString()} completed, ${outcome.removed.toLocaleString()} removed`}
                        sx={{
                          mt: 1,
                          height: 22,
                          display: "flex",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        {OUTCOME_ORDER_TOP_DOWN.map((state) => (
                          <Box
                            key={state}
                            sx={{
                              flexGrow: outcome[state],
                              flexBasis: 0,
                              backgroundColor: OUTCOME_STYLES[state].color,
                            }}
                          />
                        ))}
                      </Box>
                      <Stack spacing={0.25} sx={{ mt: 1.25 }}>
                        {OUTCOME_ORDER_TOP_DOWN.map((state) => {
                          const share = (outcome[state] / outcome.opening) * 100;
                          return (
                            <Stack key={state} direction="row" spacing={1} alignItems="baseline">
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "2px",
                                  backgroundColor: OUTCOME_STYLES[state].color,
                                  flexShrink: 0,
                                  transform: "translateY(1px)",
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {share < 0.1 && outcome[state] > 0 ? "<0.1%" : `${share.toFixed(share < 10 ? 1 : 0)}%`}
                              </Typography>
                              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                {OUTCOME_STYLES[state].label.toLowerCase()} ·{" "}
                                {outcome[state].toLocaleString()}
                              </Typography>
                            </Stack>
                          );
                        })}
                      </Stack>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.75 }}>
                      Nothing was open when the day began.
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
