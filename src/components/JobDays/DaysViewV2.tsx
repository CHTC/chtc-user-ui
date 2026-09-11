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
  Typography,
} from "@mui/material";
import HelpOutline from "@mui/icons-material/HelpOutline";

import type { StackedBarData } from "./types";
import CellGuideV2Dialog from "./_components/CellGuideV2";
import DayDialog from "./_components/DayDialog";
import JobCalendarV2 from "./_components/JobCalendarV2";
import PeriodCard from "./_components/PeriodCard";
import VersionSwitch from "./_components/VersionSwitch";
import { buildDayCensus, expandSeries, type DayCensus } from "./_components/binModel";
import {
  asOfDay,
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
import { SHARE_SEGMENT_ORDER_TOP_DOWN, SHARE_SEGMENT_STYLES } from "./_components/palette";
import {
  CELL_GUIDE_V2_KEY,
  readGroupParams,
  readGuideDismissed,
  writeGroupParams,
  writeGuideDismissed,
} from "./_components/urlState";

interface DaysViewV2Props {
  /** 4-hour transition series, for the calendar's bars. */
  data: StackedBarData;
  /** The day bake: cohorts, flow edges, and the carry-over census. */
  dayData: DayData;
}

/**
 * Calendar v2 of the job viewer.
 *
 * Same page as DaysView -- the flow summary at the top, a month grid below, a
 * group filter -- with a different cell. Each day is six full-height percentage
 * bars, one per 4-hour window. Each bar is that window's own population -- the
 * jobs open when it started plus the jobs placed during it -- split by where
 * they stood when it closed. There is no queue marker and no count scale; the
 * population itself is in the hover readout and the day dialog.
 *
 * Because the bars are a share of their own window whichever group is
 * selected, there is one model here instead of v1's two, and the bar-scale
 * toggle has nothing to do and is gone.
 */
export default function DaysViewV2({ data, dayData }: DaysViewV2Props) {
  const asOf = asOfDay(dayData);

  const [groupBy, setGroupBy] = useState<GroupBy>("cluster");
  const [selection, setSelection] = useState<string>(ALL_GROUPS);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodKey>("yesterday");
  // Open on the month containing the as-of day: the freshest part of the window.
  const [activeStartDate, setActiveStartDate] = useState<Date>(() => {
    const d = parseDayKey(asOf);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Deep links, read once on mount; see DaysView for why not useSearchParams.
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
    if (!readGuideDismissed(CELL_GUIDE_V2_KEY)) setGuideOpen(true);
  }, [data]);

  const closeGuide = () => {
    setGuideOpen(false);
    writeGuideDismissed(true, CELL_GUIDE_V2_KEY);
  };

  const selectGroup = (next: string) => {
    setSelection(next);
    writeGroupParams(groupBy, next);
  };
  const selectGroupBy = (next: GroupBy | null) => {
    if (!next || next === groupBy) return;
    setGroupBy(next);
    setSelection(ALL_GROUPS);
    writeGroupParams(next, ALL_GROUPS);
  };

  const batchGrouping = canGroupByBatch(data.batches);
  const options = useMemo(
    () => groupOptions(data.series, data.batches, groupBy),
    [data.series, data.batches, groupBy],
  );
  const filter = useMemo(
    () => clusterFilterFor(data.series, data.batches, groupBy, selection),
    [data.series, data.batches, groupBy, selection],
  );

  const dense = useMemo(() => expandSeries(data, filter), [data, filter]);

  const slices = useMemo(() => buildSliceMap(dayData, filter), [dayData, filter]);
  const summary = useMemo(
    () => buildPeriodSummary(dayData, slices, period),
    [dayData, slices, period],
  );

  // One derivation for every day and every selection: the window census.
  const shares = useMemo(() => {
    const out = new Map<string, DayCensus>();
    data.days.forEach((day, index) => out.set(day, buildDayCensus(data, dense, index, "window")));
    return out;
  }, [data, dense]);

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
          <VersionSwitch current="v2" />
        </Stack>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          {dayData.counted.toLocaleString()} jobs across {data.series.length} clusters
          {batchGrouping && ` in ${data.batches?.length} batches`}, {scopeLabel}. The diagram
          shows how work flowed through the last day, week, or month. The calendar below
          shows each day as six percentage bars, one per 4-hour window: of the jobs open when
          the window started plus those placed during it, what share were still active,
          completed, or removed by its close. Hover a bar for its numbers, or click a day for
          its full breakdown.
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
              htmlFor="days-v2-group-select"
              sx={{ color: "text.secondary", display: "block", lineHeight: 1.6 }}
            >
              {GROUP_BY_LABELS[groupBy]}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Select
                id="days-v2-group-select"
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

          {/* The legend, in the space the v1 scale toggle used. Four colours
              with no room to label themselves on the tiles. */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ ml: { sm: "auto" }, flexWrap: "wrap", rowGap: 0.5 }}
            aria-label="Bar colours"
          >
            {SHARE_SEGMENT_ORDER_TOP_DOWN.map((state) => (
              <Stack key={state} direction="row" spacing={0.6} alignItems="center">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "2px",
                    backgroundColor: SHARE_SEGMENT_STYLES[state].color,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                  {SHARE_SEGMENT_STYLES[state].label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <JobCalendarV2
          slices={slices}
          shares={shares}
          firstDay={dayData.days[0]}
          lastDay={asOf}
          asOf={asOf}
          activeStartDate={activeStartDate}
          onActiveStartDateChange={setActiveStartDate}
          onSelectDay={setOpenDay}
        />

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

      <CellGuideV2Dialog open={guideOpen} onClose={closeGuide} />

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
        variant="v2"
      />

      <Stack spacing={2} sx={{ mt: 4 }}>
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
            Each bar is one 4-hour window, read as it closes — at 04:00, 08:00 and so on to
            midnight. Its population is the jobs that were open when the window started plus
            the jobs placed during it, and the bar splits that population by where it stood at
            the close. From the top down: light blue was open at the start and is still
            active; red was removed during the window; teal completed during it; dark blue
            at the base was placed during the window and is still active. Nothing carries
            over except the jobs themselves — the
            two blues together are exactly what the next window opens with, so 200 jobs open
            at 08:00 with 100 completing by noon draws a 50/50 bar, and the noon window starts
            with 100. A window in which nothing moved is all light blue. A blank window had
            nothing open and nothing placed.
          </Typography>
        </Box>

        <Typography variant="caption" component="p" sx={{ color: "text.secondary" }}>
          Baked {new Date(data.generatedAt).toLocaleString()} ({data.timezone}) from{" "}
          {dayData.sources.adstash.terminalRecords.toLocaleString()} Adstash terminal records
          and {dayData.sources.condorQ.stillQueued.toLocaleString()} live condor_q ads on{" "}
          {dayData.sources.condorQ.schedd}. &ldquo;Today&rdquo; is {formatDayShort(asOf)}, the
          last day in the baked window; the summary period ends on the day before it, since
          the as-of day is still in progress and would understate every count. Hold is not
          shown: the history records carry no hold data for these jobs.
        </Typography>
      </Stack>
    </Box>
  );
}
