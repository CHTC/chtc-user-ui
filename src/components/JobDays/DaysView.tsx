"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
import { MAX_HISTORY_DAYS, addDays, visibleGrid } from "./_components/chunks";
import DayDialog from "./_components/DayDialog";
import JobCalendar, { inRange, type DayRange } from "./_components/JobCalendar";
import VersionSwitch, { type CalendarVersion } from "./_components/VersionSwitch";
import { ScaleHelpTooltip, ScaleNote, SCALE_LABELS } from "./_components/ScaleInfo";
import {
  buildDayActivity,
  buildDayLevels,
  expandSeries,
  peakBinTotal,
  type DayActivity,
} from "./_components/binModel";
import {
  asOfDay,
  buildDayOutcomes,
  buildSliceMap,
  formatDayShort,
  parseDayKey,
  type DayData,
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
  readBarsParam,
  readGroupParams,
  readGuideDismissed,
  readRangeParam,
  readScaleParam,
  writeBarsParam,
  writeGroupParams,
  writeGuideDismissed,
  writeRangeParam,
  writeScaleParam,
} from "./_components/urlState";
import {
  ACTIVITY_STACK,
  ACTIVITY_STYLES,
  DEFAULT_BARS,
  stackOrder,
  type ActivityState,
} from "./_components/palette";

interface DaysViewProps {
  /** 4-hour transition series, for the calendar's bars. */
  data: StackedBarData;
  /** The day bake: cohorts, flow edges, and the carry-over census. */
  dayData: DayData;
  /**
   * Which calendar to draw. The two are the same picture with one difference:
   * v1 scales every day's bars against the busiest window in the visible
   * month or the selected range, so heights compare across days; v2 scales
   * each day against its own busiest window, so every day's shape fills its
   * cell and heights compare only within the day.
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
 * One page for the whole question: a calendar of what moved -- placed,
 * completed, removed -- binned four hours at a time, with the queue level
 * behind the bars.
 *
 * It once opened with a "What happened Yesterday / Last Week / Last Month"
 * summary card above the calendar; that card was retired, so the calendar is
 * the page. The state model is the merged one that made the two halves agree:
 * a job is Active from the moment it is placed and leaves only by completing or
 * being removed.
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
  // The days the bars are scaled to, when the reader has dragged out a range on
  // the calendar. Null scales to the visible grid.
  const [range, setRange] = useState<DayRange | null>(null);
  // Which states the bars stack: completions by default, placements and
  // removals on request. Every chart on the page follows this one pick.
  const [bars, setBars] = useState<ActivityState[]>(DEFAULT_BARS);
  // The cell guide opens the page. Closed on the server and on first paint, then
  // opened from an effect: whether the reader has dismissed it lives in
  // localStorage, which cannot be read while rendering static HTML.
  const [guideOpen, setGuideOpen] = useState(false);
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
    const wantedBars = readBarsParam(window.location.search);
    if (wantedBars) setBars(wantedBars);

    // A linked range also opens the calendar on the month it starts in: the
    // as-of month would show a grid of grey with the range off screen.
    const wantedRange = readRangeParam(window.location.search);
    if (wantedRange) {
      setRange(wantedRange);
      const start = parseDayKey(wantedRange.start);
      showMonth(new Date(start.getFullYear(), start.getMonth(), 1));
    }
    if (!readGuideDismissed(guideKey)) setGuideOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- showMonth is stable for the page's purposes; this runs once per data load
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
  // The range too: a link should reproduce the exact grid the reader was
  // looking at, greyed days and rescaled bars included.
  const selectRange = (next: DayRange | null) => {
    setRange(next);
    writeRangeParam(next);
  };
  // ToggleButtonGroup hands back the picked values in click order; stored in
  // stacking order so the state, the URL, and the legend all agree.
  const selectBars = (next: ActivityState[]) => {
    const ordered = stackOrder(next);
    setBars(ordered);
    writeBarsParam(ordered);
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

  // One view whatever is selected: how many jobs completed per bin, with the
  // queue level over it. A single cluster or batch is the same picture
  // filtered down, so what the reader learns on everything carries over. (It
  // used to switch to a 100%-stacked census of the group's cohort; that view
  // was retired for reading differently from the one beside it.)
  const dense = useMemo(() => expandSeries(data, filter), [data, filter]);

  // Each day's counts come from the day bake, which is the only one carrying
  // the distinct-jobs figure and the end-of-day census.
  const slices = useMemo(() => buildSliceMap(dayData, filter), [dayData, filter]);

  // The calendar's inputs: each day's 4-hour change counts, totalled over the
  // states the bars are showing.
  const activities = useMemo(() => {
    const out = new Map<string, DayActivity>();
    data.days.forEach((day, index) => out.set(day, buildDayActivity(data, dense, index, bars)));
    return out;
  }, [data, dense, bars]);

  // The open-jobs level behind the bars.
  const levels = useMemo(() => buildDayLevels(data, dense), [data, dense]);

  // What became of each day's inherited jobs, for whichever group is in view,
  // drawn as the completed share filling the tile from the floor.
  const fills = useMemo(() => buildDayOutcomes(dayData, filter), [dayData, filter]);

  // Every tile on screen, not just the month's own days: the grid pads the
  // month out to whole weeks with its neighbours' days, and those carry bars
  // too. Scaling to the month alone left them on a scale of their own, so a
  // September day at the top of October's grid could tower over -- or vanish
  // beside -- the days around it.
  const grid = visibleGrid(activeStartDate);
  const inVisibleGrid = (day: string) => day >= grid.start && day < grid.end;
  // The days the peaks are measured over: the reader's range when there is
  // one, else the visible grid. One heavy day at the start of a month
  // flattens everything after it; selecting the rest lets the rest be seen.
  const inScope = (day: string) => (range ? inRange(day, range) : inVisibleGrid(day));

  // The peak every tile scales against. Recomputed per scope on purpose -- a
  // single window-wide peak would bury every ordinary month under the one
  // holding the 863,000-change day.
  const peak = useMemo(
    () => peakBinTotal([...activities].filter(([day]) => inScope(day))),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inScope closes over activeStartDate and range only
    [activities, activeStartDate, range],
  );

  // The level trace's own scale: the highest the queue reached in the scope.
  // Standing jobs and changes are different quantities and get different
  // axes, so this is measured separately from the activity peak.
  const levelPeak = useMemo(() => {
    if (!levels) return 0;
    let peak = 0;
    for (const [day, level] of levels) {
      if (!inScope(day)) continue;
      peak = Math.max(peak, level.start, ...level.ends);
    }
    return peak;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- inScope closes over activeStartDate and range only
  }, [levels, activeStartDate, range]);

  /** "Aug 3 – Aug 9 · 7 days", for the range chip. */
  const rangeLabel = (r: DayRange) => {
    const days = Math.round((parseDayKey(r.end).getTime() - parseDayKey(r.start).getTime()) / 86_400_000) + 1;
    return r.start === r.end
      ? formatDayShort(r.start)
      : `${formatDayShort(r.start)} – ${formatDayShort(r.end)} · ${days} days`;
  };

  const scopeLabel = selectionLabel(options, groupBy, selection);

  return (
    <Box component="main" sx={{py: {xs: 2, md: 4}}}>
      {/* The heading runs the full width of the page; only the calendar and
          its notes below are held to a reading width. */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ flexWrap: "wrap", mb: 3 }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          What happened to {data.owner}&apos;s jobs
        </Typography>
        <VersionSwitch current={variant} />
      </Stack>

      <Box sx={{ px: { xs: 2, md: 4 }, py: {xs: 1, md: 4}, maxWidth: 1000, mx: "auto" }}>
        <Stack spacing={3}>
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

            {/*
              Which states the bars stack. Multi-select: any mix is a sensible
              picture, including none, which leaves the queue line on its own.
              The swatch on each button is the segment colour, so the toggle
              doubles as the legend.
            */}
            <Box sx={{ ml: { sm: "auto" } }}>
              <Typography
                variant="overline"
                component="p"
                id="days-bars-label"
                sx={{ color: "text.secondary", lineHeight: 1.6 }}
              >
                Bars show
              </Typography>
              <ToggleButtonGroup
                size="small"
                value={bars}
                onChange={(_, next: ActivityState[]) => selectBars(next)}
                aria-labelledby="days-bars-label"
                sx={{ mt: 0.5 }}
              >
                {ACTIVITY_STACK.map((state) => (
                  <ToggleButton
                    key={state}
                    value={state}
                    aria-label={`Show ${ACTIVITY_STYLES[state].label.toLowerCase()} jobs in the bars`}
                    sx={{ gap: 0.75 }}
                  >
                    <Box
                      component="span"
                      aria-hidden
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: "2px",
                        backgroundColor: ACTIVITY_STYLES[state].color,
                        flexShrink: 0,
                      }}
                    />
                    {ACTIVITY_STYLES[state].label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box>
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
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                <Box sx={{ display: "inline-flex" }}>
                  <ToggleButtonGroup
                    size="small"
                    exclusive
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
              </Stack>

            </Box>
          </Stack>

          <JobCalendar
            slices={slices}
            activities={activities}
            bars={bars}
            onShowBars={(state) => selectBars([...bars, state])}
            levels={levels}
            fills={fills}
            scale={scale}
            perDayScale={variant === "v2"}
            peakBinTotal={peak}
            levelPeak={levelPeak}
            firstDay={pageFloor}
            lastDay={asOf}
            asOf={asOf}
            activeStartDate={activeStartDate}
            onActiveStartDateChange={showMonth}
            onSelectDay={setOpenDay}
            range={range}
            onRangeChange={selectRange}
          />

          {/*
            Under the calendar, not above it. The guide opens by itself on a first
            visit, so this is the way back to it -- and a reader who wants it again
            is one who has just been looking at the grid, not one on their way to it.
            The range chip sits beside it for the same reason: it describes the
            grid the reader has just been dragging on.
          */}
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="text"
              startIcon={<HelpOutline />}
              onClick={() => setGuideOpen(true)}
            >
              How to read a day
            </Button>
            {range ? (
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`Bars scaled to ${rangeLabel(range)}`}
                onDelete={() => selectRange(null)}
                deleteIcon={<span aria-hidden>×</span>}
                sx={{ fontWeight: 600, "& .MuiChip-deleteIcon": { fontSize: "1rem", px: 0.5 } }}
              />
            ) : (
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Drag across days, or shift-click, to scale the bars to just those days. Escape
                or a click elsewhere clears it.
              </Typography>
            )}
          </Stack>
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
          bars={bars}
          open={openDay !== null}
          onClose={() => setOpenDay(null)}
          variant={variant}
        />

        <Stack spacing={2} sx={{ mt: 4 }}>
          <ScaleNote scale={scale} perDay={variant === "v2"} />

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
              Each bar counts the jobs that completed inside its own 4-hour window, independent
              of its neighbours, so the bars keep their gaps and an idle window is simply
              empty. Placements and removals are not in the bars unless you add them, with the
              &ldquo;Bars show&rdquo; toggle or by clicking the small blue + or red − that sits
              above a bar when its window had some. On the line, a placement is where the queue
              jumps up, a removal where it drops with no bar under it. Hovering a bar gives every
              count, in the bar or not.
              Picking one cluster or batch filters the same picture down to that group rather
              than drawing a different one, so its heavy and quiet windows read the same way.
            </Typography>
            <Typography
              variant="caption"
              component="p"
              sx={{ color: "text.secondary", display: "block", mt: 0.75 }}
            >
              {(
                <>
                  A{" "}
                  <Box component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
                    line
                  </Box>{" "}
                  also runs behind the bars: how many jobs were open — queued or running — at
                  the close of each 4-hour window, joined from one day straight into the next.
                  It is the queue as a level rather than a count of changes, which is a
                  different quantity: a day whose six bars are all empty can still be holding a
                  million jobs. It steps down as work finishes and jumps when a batch lands, and
                  its colour says how fast, on the scale a rain map uses: light blue where it is
                  perfectly flat, blue and green as it starts to move, yellow and orange as it
                  speeds up, red where it drops or climbs steeply, and purple where it moves the
                  whole height of the cell in one window. The dot on each
                  midnight boundary gives its numbers on hover, including how
                  much of the queue arrived that day. Being a headcount it has its own scale,
                  down the right of the calendar under the stacked glyph
                  {variant === "v1"
                    ? "; the axis on the left belongs to the bars."
                    : ". There is no axis on the left: each day's bars are scaled to that day's own busiest window, so hover a bar for its count."}
                </>
              )}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
