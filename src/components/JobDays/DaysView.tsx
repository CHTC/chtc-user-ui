"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutline from "@mui/icons-material/HelpOutline";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

import type { BarScale, StackedBarData } from "./types";
import CellGuideDialog from "./_components/CellGuide";
import { MAX_HISTORY_DAYS, addDays } from "./_components/chunks";
import DayDialog from "./_components/DayDialog";
import JobCalendar from "./_components/JobCalendar";
import PeriodCard from "./_components/PeriodCard";
import VersionSwitch, { type CalendarVersion } from "./_components/VersionSwitch";
import { ScaleHelpTooltip, ScaleHint, ScaleNote, SCALE_LABELS } from "./_components/ScaleInfo";
import {
  buildDayActivity,
  buildDayCensus,
  buildDayLevels,
  buildScaleAdvice,
  expandSeries,
  type DayActivity,
  type DayCensus,
} from "./_components/binModel";
import {
  asOfDay,
  buildDayOutcomes,
  buildPeriodSummary,
  buildSliceMap,
  formatDayShort,
  parseDayKey,
  type DayData,
  type PeriodKey,
} from "./_components/dayCards";
import {
  ALL_GROUPS,
  GROUP_BY_LABELS,
  canGroupByBatch,
  clusterFilterFor,
  groupOptions,
  selectionLabel,
  type GroupBy,
} from "./_components/grouping";
import {
  CELL_GUIDE_KEY,
  CELL_GUIDE_V2_KEY,
  DEFAULT_SCALE,
  readGroupParams,
  readGuideDismissed,
  readScaleParam,
  writeGroupParams,
  writeGuideDismissed,
  writeScaleParam,
} from "./_components/urlState";

interface DaysViewProps {
  /** 4-hour transition series, for the calendar's bars. */
  data: StackedBarData;
  /** The day bake: cohorts, flow edges, and the carry-over census. */
  dayData: DayData;
  /**
   * Which calendar to draw. The two differ only at the day boundary: v1 runs a
   * grey queue-level trace behind the bars, v2 stands a 100%-stacked bar astride
   * each midnight saying what became of the jobs that day inherited.
   */
  variant?: CalendarVersion;
  /**
   * The reader paged the calendar to the month starting here. The data is
   * loaded a week at a time, so whoever owns the fetch widens it to cover the
   * month; this view keeps drawing what it has meanwhile.
   */
  onVisibleMonthChange?: (monthStart: Date) => void;
}

/**
 * One page for the whole question: a flow diagram of what moved over the last
 * day, week, or month, over a calendar of the same three states binned four
 * hours at a time.
 *
 * The two halves used to be separate pages with different state models -- the
 * flow diagram carried a Placed state that the bars did not. Merging Placed into
 * Active is what lets them sit together: a job is Active from the moment it is
 * placed and leaves only by completing or being removed, top and bottom alike.
 */
export default function DaysView({
  data,
  dayData,
  variant = "v1",
  onVisibleMonthChange,
}: DaysViewProps) {
  const asOf = asOfDay(dayData);
  // Each version has its own guide, dismissed separately: a reader who has
  // learnt one cell has not learnt the other.
  const guideKey = variant === "v2" ? CELL_GUIDE_V2_KEY : CELL_GUIDE_KEY;
  // How far back the calendar may be paged: the data loads as the reader goes,
  // so this is the API's limit rather than the edge of what is loaded.
  const pageFloor = addDays(asOf, -MAX_HISTORY_DAYS);

  const [groupBy, setGroupBy] = useState<GroupBy>("cluster");
  const [selection, setSelection] = useState<string>(ALL_GROUPS);
  const [scale, setScale] = useState<BarScale>(DEFAULT_SCALE);
  const [openDay, setOpenDay] = useState<string | null>(null);
  // The cell guide opens the page. Closed on the server and on first paint, then
  // opened from an effect: whether the reader has dismissed it lives in
  // localStorage, which cannot be read while rendering static HTML.
  const [guideOpen, setGuideOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("yesterday");
  // Open on the month containing the as-of day: the freshest part of the window.
  const [activeStartDate, setActiveStartDate] = useState<Date>(() => {
    const d = parseDayKey(asOf);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const showMonth = (next: Date) => {
    setActiveStartDate(next);
    onVisibleMonthChange?.(next);
  };

  // Deep links: /days?groupBy=batch&group=3&scale=linear. Read once on mount rather
  // than via useSearchParams -- this page is statically exported, so an effect
  // avoids the Suspense boundary useSearchParams demands and any hydration
  // mismatch from reading window during render. A group the data does not know
  // (stale link, renumbered bake, a batch that aged out of the window) is ignored
  // and the page stays on everything.
  useEffect(() => {
    const wantedGroup = readGroupParams(window.location.search);
    const known =
      wantedGroup.groupBy === "batch"
        ? (data.batches ?? []).some((b) => b.id === wantedGroup.selection)
        : data.series.some((s) => String(s.cluster) === wantedGroup.selection);
    if (wantedGroup.groupBy === "batch" && canGroupByBatch(data.batches)) {
      setGroupBy("batch");
    }
    if (known) setSelection(wantedGroup.selection);

    const wanted = readScaleParam(window.location.search);
    if (wanted) setScale(wanted);
    if (!readGuideDismissed(guideKey)) setGuideOpen(true);
  }, [data, guideKey]);

  /**
   * Closing the guide is the whole of dismissing it.
   *
   * It used to persist only if the reader ticked "don't show this again", which
   * meant the guide reopened on every visit for anyone who just closed it -- the
   * ordinary way to dismiss a dialog. Reading it once is consent enough; the
   * button under the calendar is how it comes back.
   */
  const closeGuide = () => {
    setGuideOpen(false);
    writeGuideDismissed(true, guideKey);
  };

  // Every selection writes back to the URL, so the current view is always
  // linkable. See urlState.ts for the replaceState rationale.
  const selectGroup = (next: string) => {
    setSelection(next);
    writeGroupParams(groupBy, next);
  };
  // Changing the grouping resets the selection: a cluster id means nothing as a
  // batch id, and silently carrying it over would land the reader on an unrelated
  // group or on nothing at all.
  const selectGroupBy = (next: GroupBy | null) => {
    if (!next || next === groupBy) return;
    setGroupBy(next);
    setSelection(ALL_GROUPS);
    writeGroupParams(next, ALL_GROUPS);
  };
  const selectScale = (next: BarScale | null) => {
    // ToggleButtonGroup hands back null when the active button is clicked again;
    // this is a two-way switch, so ignore that rather than leaving no scale.
    if (!next) return;
    setScale(next);
    writeScaleParam(next);
  };

  const batchGrouping = canGroupByBatch(data.batches);
  const options = useMemo(
    () => groupOptions(data.series, data.batches, groupBy),
    [data.series, data.batches, groupBy],
  );
  // Every model below filters on cluster labels, whichever grouping is in force:
  // a batch is exactly the sum of its clusters. See grouping.ts.
  const filter = useMemo(
    () => clusterFilterFor(data.series, data.batches, groupBy, selection),
    [data.series, data.batches, groupBy, selection],
  );

  // Two views on purpose: everything shows the MAGNITUDE of state changes per bin
  // (counts), while one group shows its whole cohort as a RATIO that drifts to
  // completed over the days, never dropping a job from view.
  const journeyMode = filter !== null;

  const dense = useMemo(() => expandSeries(data, filter), [data, filter]);

  // The Sankey's inputs come from the day bake, which is the only one carrying
  // flow edges and the end-of-day census.
  const slices = useMemo(() => buildSliceMap(dayData, filter), [dayData, filter]);
  const summary = useMemo(
    () => buildPeriodSummary(dayData, slices, period),
    [dayData, slices, period],
  );

  // The calendar's inputs: one of the two per-day 4-hour derivations, depending
  // on the mode.
  const censuses = useMemo(() => {
    if (!journeyMode) return null;
    const out = new Map<string, DayCensus>();
    data.days.forEach((day, index) => out.set(day, buildDayCensus(data, dense, index, "journey")));
    return out;
  }, [data, dense, journeyMode]);
  const activities = useMemo(() => {
    if (journeyMode) return null;
    const out = new Map<string, DayActivity>();
    data.days.forEach((day, index) => out.set(day, buildDayActivity(data, dense, index)));
    return out;
  }, [data, dense, journeyMode]);

  // v1: the open-jobs level behind the bars, all-jobs mode only. Cluster mode's
  // ratio bars already show the standing state.
  const levels = useMemo(
    () => (variant === "v1" && !journeyMode ? buildDayLevels(data, dense) : null),
    [variant, data, dense, journeyMode],
  );

  // v2: what became of each day's inherited jobs, for whichever group is in
  // view. Shown in cluster mode too: the ratio bars say where the whole cohort
  // stands, this says how the day treated what it started with.
  const outcomes = useMemo(
    () => (variant === "v2" ? buildDayOutcomes(dayData, filter) : null),
    [variant, dayData, filter],
  );

  const inVisibleMonth = (day: string) => {
    const date = parseDayKey(day);
    return (
      date.getFullYear() === activeStartDate.getFullYear() &&
      date.getMonth() === activeStartDate.getMonth()
    );
  };

  // One measurement of the visible month serves two consumers: the peak every
  // tile scales against, and the hint that says what linear scaling costs today.
  // Recomputed per month on purpose -- a single window-wide peak would bury every
  // ordinary month under the one holding the 863,000-change day.
  const advice = useMemo(() => {
    if (!activities) return null;
    return buildScaleAdvice([...activities].filter(([day]) => inVisibleMonth(day)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inVisibleMonth closes over activeStartDate only
  }, [activities, activeStartDate]);

  // The level trace's own scale: the highest the queue reached on the visible
  // month. Standing jobs and changes are different quantities and get different
  // axes, so this is measured separately from the activity peak.
  const levelPeak = useMemo(() => {
    if (!levels) return 0;
    let peak = 0;
    for (const [day, level] of levels) {
      if (!inVisibleMonth(day)) continue;
      peak = Math.max(peak, level.start, ...level.ends);
    }
    return peak;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inVisibleMonth closes over activeStartDate only
  }, [levels, activeStartDate]);

  // Worth saying only when the flattening is widespread: a couple of quiet days
  // among many is just a quiet week, not a scale problem.
  const showScaleHint =
    scale === "linear" &&
    !!advice &&
    advice.squashedDays >= 3 &&
    advice.squashedDays >= advice.activeDays / 2;

  const scopeLabel = selectionLabel(options, groupBy, selection);

  return (
    <Box
      component="main"
      sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1100, mx: "auto" }}
    >
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
          sx={{ flexWrap: "wrap" }}
        >
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            What happened to {data.owner}&apos;s jobs
          </Typography>
          <VersionSwitch current={variant} />
        </Stack>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {dayData.counted.toLocaleString()} jobs across {data.series.length} clusters
          {batchGrouping && ` in ${data.batches?.length} batches`}, {scopeLabel}. The diagram
          shows how work flowed through the last day, week, or
          month; the calendar below breaks each day into 4-hour bins:{" "}
          {journeyMode
            ? `the whole of ${scopeLabel} as a ratio, with completed work staying in view so the bars drift toward teal as jobs finish`
            : "how many jobs were placed, completed, or removed in each bin, so a heavy bin towers and a quiet one stays empty"}
          .{" "}
          {variant === "v2" &&
            "The bar astride each midnight shows what became of the jobs the day started with: still open, completed, or removed, leaving out anything placed during it. "}
          Hover a bar for its numbers, or click a day for its full breakdown.
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <PeriodCard
          summary={summary}
          period={period}
          onPeriodChange={setPeriod}
          onOpenDetail={() => summary?.days.length === 1 && setOpenDay(summary.days[0])}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "flex-end" }}
        >
          <Box>
            <Typography
              variant="overline"
              component="label"
              htmlFor="days-group-select"
              sx={{ color: "text.secondary", display: "block", lineHeight: 1.6 }}
            >
              {GROUP_BY_LABELS[groupBy]}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Select
                id="days-group-select"
                size="small"
                value={selection}
                onChange={(event) => selectGroup(String(event.target.value))}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value={ALL_GROUPS}>
                  {groupBy === "batch"
                    ? `All batches (${options.length})`
                    : `All clusters (${options.length})`}
                </MenuItem>
                {options.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label} · {option.total.toLocaleString()} jobs
                  </MenuItem>
                ))}
              </Select>

              {/*
                Only offered where it does something: data baked before batch
                support carries no batches, and a single batch covering everything
                is not a grouping.
              */}
              {batchGrouping && (
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={groupBy}
                  onChange={(_, next: GroupBy | null) => selectGroupBy(next)}
                  aria-label="Group jobs by"
                >
                  {(["cluster", "batch"] as GroupBy[]).map((option) => (
                    <ToggleButton
                      key={option}
                      value={option}
                      aria-label={`Group by ${GROUP_BY_LABELS[option].toLowerCase()}`}
                    >
                      {GROUP_BY_LABELS[option]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              )}
            </Stack>
          </Box>

          <Box sx={{ ml: { sm: "auto" } }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography
                variant="overline"
                component="p"
                id="days-scale-label"
                sx={{ color: "text.secondary", lineHeight: 1.6 }}
              >
                Bar scale
              </Typography>
              <Tooltip title={<ScaleHelpTooltip />} placement="top" arrow>
                <InfoOutlined
                  fontSize="inherit"
                  aria-label="What the linear and log scales each cost"
                  tabIndex={0}
                  sx={{ color: "text.secondary", fontSize: "0.95rem", cursor: "help" }}
                />
              </Tooltip>
            </Stack>
            {/*
              The ratio bars a single cluster draws are 100%-stacked, so there is
              no height for a scale to change. Rather than hide the toggle when
              the reader picks a cluster, it is disabled and says why.
            */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
            <Tooltip
              title={
                journeyMode
                  ? `Picking one ${GROUP_BY_LABELS[groupBy].toLowerCase()} draws 100%-stacked ratio bars, which have no height to scale. Go back to everything for the magnitude view.`
                  : ""
              }
              placement="top"
            >
              <Box sx={{ display: "inline-flex" }}>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  disabled={journeyMode}
                  value={scale}
                  onChange={(_, next: BarScale | null) => selectScale(next)}
                  aria-labelledby="days-scale-label"
                >
                  {(["linear", "log"] as BarScale[]).map((option) => (
                    <ToggleButton
                      key={option}
                      value={option}
                      aria-label={`${SCALE_LABELS[option]} bar scale`}
                    >
                      {SCALE_LABELS[option]}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            </Tooltip>

              {/* Beside the buttons, in flow: see ScaleHint. */}
              {showScaleHint && advice && <ScaleHint advice={advice} />}
            </Stack>

          </Box>
        </Stack>

        <JobCalendar
          slices={slices}
          censuses={censuses}
          activities={activities}
          levels={levels}
          outcomes={outcomes}
          scale={scale}
          peakBinTotal={advice?.peak ?? 0}
          levelPeak={levelPeak}
          firstDay={pageFloor}
          lastDay={asOf}
          asOf={asOf}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={showMonth}
          onSelectDay={setOpenDay}
        />

        {/*
          Under the calendar, not above it. The guide opens by itself on a first
          visit, so this is the way back to it -- and a reader who wants it again
          is one who has just been looking at the grid, not one on their way to it.
        */}
        <Box>
          <Button
            size="small"
            variant="text"
            startIcon={<HelpOutline />}
            onClick={() => setGuideOpen(true)}
          >
            How to read a day
          </Button>
        </Box>
      </Stack>

      <CellGuideDialog variant={variant} open={guideOpen} onClose={closeGuide} />

      <DayDialog
        dayData={dayData}
        barData={data}
        day={openDay}
        groupBy={groupBy}
        selection={selection}
        onSelectionChange={selectGroup}
        batches={data.batches}
        asOf={asOf}
        open={openDay !== null}
        onClose={() => setOpenDay(null)}
        variant={variant}
      />

      <Stack spacing={2} sx={{ mt: 4 }}>
        <ScaleNote scale={scale} />

        <Box component="section">
          <Typography
            variant="overline"
            component="h3"
            sx={{ color: "text.secondary", lineHeight: 1.6 }}
          >
            How to read the bars
          </Typography>
          <Typography
            variant="caption"
            component="p"
            sx={{ color: "text.secondary", display: "block" }}
          >
            With one cluster or batch selected, each bar is not a window at all but a
            snapshot: a census of the whole group taken every four hours, at 04:00, 08:00 and
            so on to midnight. The darker sliver down the right of each bar marks the instant
            the reading was taken. They are cumulative, so Completed and Removed only ever
            grow, and because it is one continuous series the bars run edge to edge, straight
            into the next day&apos;s. Once every job has reached a final state the day draws
            that one all-finished reading and then stops: the blanks after it mean the group
            is done, not that the data ran out. With nothing filtered out the bars mean
            something different — each is a count of the transitions inside its own 4-hour
            window, independent of its neighbours, so those keep their gaps and an idle
            window is simply empty.
          </Typography>
          <Typography
            variant="caption"
            component="p"
            sx={{ color: "text.secondary", display: "block", mt: 0.75 }}
          >
            {variant === "v1" ? (
              <>
                With nothing filtered out, a{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                  grey line
                </Box>{" "}
                also runs behind the bars: how many jobs were open — queued or running — at
                the close of each 4-hour window, joined from one day straight into the next.
                It is the queue as a level rather than a count of changes, which is a
                different quantity: a day whose six bars are all empty can still be holding a
                million jobs. It steps down as work finishes and jumps when a batch lands, and
                the dot on each midnight boundary gives its numbers on hover, including how
                much of the queue arrived that day. Being a headcount it has its own scale,
                down the right of the calendar under the stacked glyph; the axis on the left
                belongs to the bars. Picking a single cluster or batch hides the line, because
                those tiles already show their standing state — the two blues in a ratio bar
                are the queue.
              </>
            ) : (
              <>
                Each day also ends with a{" "}
                <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                  bar astride midnight
                </Box>
                : of the jobs that were already open when the day began, what share are still
                open, completed, or removed by its end — grey, teal and red, with still open
                on top in grey because nothing happened to those jobs. Nothing placed during
                the day is part of it. That is the point:
                the six bars count every change, including the day&apos;s own arrivals, while
                this bar answers only for the work the day inherited, so a day that took on
                a fresh batch while finishing half of its backlog still reads as a 50/50 day.
                It is a share, read against the 0–100% scale down the right; the axis on the
                left belongs to the bars. A star on top marks a clean sweep, a day that
                completed every job it began with. Hover it for the counts.
              </>
            )}
          </Typography>
        </Box>

        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
          Baked {new Date(data.generatedAt).toLocaleString()} ({data.timezone}) from{" "}
          {dayData.sources.adstash.terminalRecords.toLocaleString()} Adstash terminal records
          {dayData.queries && dayData.queries > 1
            ? ` read across ${dayData.queries} weekly queries`
            : ""}{" "}
          and {dayData.sources.condorQ.stillQueued.toLocaleString()} live condor_q ads on{" "}
          {dayData.sources.condorQ.schedd}. &ldquo;Today&rdquo; is {formatDayShort(asOf)}, the
          last day in the loaded window; the summary period ends on the day before it, since
          the as-of day is still in progress and would understate every count. Paging the
          calendar to an earlier month loads that month&apos;s weeks. Hold is not shown: the
          history records carry no hold data for these jobs.
        </Typography>
      </Stack>
    </Box>
  );
}
