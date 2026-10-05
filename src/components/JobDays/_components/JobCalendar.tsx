"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Typography } from "@mui/material";
import Calendar from "react-calendar";

import "react-calendar/dist/Calendar.css";

import type { BarScale } from "../types";
import {
  TILE_BARS_HEIGHT,
  buildScaleTicks,
  type DayActivity,
  type DayLevel,
  type ScaleKind,
  type ScaleTick,
} from "./binModel";
import {
  compactNumber,
  dayKeyOf,
  formatDayShort,
  isEmptySlice,
  parseDayKey,
  type DayOutcome,
  type DaySlice,
} from "./dayCards";
import TileAxis, { AXIS_WIDTH, QUEUE_OVERHANG } from "./TileAxis";
import { describeActivity, type ActivityState } from "./palette";
import TileActivityBars, { GLYPH_HEADROOM } from "./TileActivityBars";
import TileCompletionFill from "./TileCompletionFill";
import TileLevelLine from "./TileLevelLine";

/** A run of days, inclusive, as "YYYY-MM-DD" keys with start <= end. */
export interface DayRange {
  start: string;
  end: string;
}

/** The range between two days, whichever order they were picked in. */
function rangeOf(a: string, b: string): DayRange {
  return a <= b ? { start: a, end: b } : { start: b, end: a };
}

/** True when the day lies inside the range. Keys sort as dates. */
export function inRange(day: string, range: DayRange): boolean {
  return day >= range.start && day <= range.end;
}

/** The day a pointer event landed on, read off the tile's hidden marker. */
function dayAt(target: EventTarget | null): string | null {
  const element = target instanceof Element ? target : null;
  const tile = element?.closest(".react-calendar__tile");
  return tile?.querySelector("[data-day]")?.getAttribute("data-day") ?? null;
}

interface JobCalendarProps {
  slices: Map<string, DaySlice>;
  /**
   * Per-day per-bin state-change counts for whatever is selected, keyed like
   * `slices`. Tiles draw count-scaled bars against the scope's peak bin, so
   * magnitude is the signal.
   */
  activities: Map<string, DayActivity>;
  /** Which states the bars stack; the readouts quote the rest. */
  bars: ActivityState[];
  /** The reader clicked a hidden-state mark above a bar: add that state to the bars. */
  onShowBars: (state: ActivityState) => void;
  /**
   * The open-jobs level through each day, keyed like `slices`. Drawn as a
   * slope-coloured trace behind the bars.
   */
  levels: Map<string, DayLevel> | null;
  /**
   * What became of the jobs open when each day began, drawn as a translucent
   * teal ground rising from each tile's floor to the share of them that
   * completed.
   */
  fills: Map<string, DayOutcome> | null;
  /** Which scale the magnitude bars and the level trace use. */
  scale: BarScale;
  /**
   * Calendar v2: each tile's bars are scaled to that day's own busiest window
   * rather than the shared peak, so every day's shape fills its slot and the
   * shared left axis is dropped. Heights then compare within a day, not across
   * days; the hover readout carries the counts.
   */
  perDayScale: boolean;
  /**
   * Tallest 4-hour bin on the visible grid, neighbouring days included; every
   * tile scales against it so bar heights compare across days. Measured by the
   * page rather than here, because the scale hint beside the toggle reasons
   * about the same number.
   */
  peakBinTotal: number;
  /**
   * Highest open-jobs level on the visible grid: the level trace's own scale,
   * on the right. Standing jobs and changes are different quantities, so they
   * get different axes.
   */
  levelPeak: number;
  /**
   * Earliest and latest day the reader may page to, "YYYY-MM-DD". The data is
   * loaded a week at a time as the reader pages, so `firstDay` is how far back
   * paging is allowed rather than the edge of what is loaded.
   */
  firstDay: string;
  lastDay: string;
  /** The day everything is read as of; marked in the grid. */
  asOf: string;
  activeStartDate: Date;
  onActiveStartDateChange: (date: Date) => void;
  onSelectDay: (day: string) => void;
  /**
   * The days the bars are scaled to, when the reader has picked some. Every
   * other tile goes solid grey, so the scaled days are the only thing on the
   * grid. Null means the visible grid, the default scope.
   */
  range: DayRange | null;
  /**
   * The reader dragged across a run of days, shift-clicked to extend, or
   * cleared it -- with Escape, or by clicking anywhere off the calendar. The
   * page owns the range because the peaks are measured there.
   */
  onRangeChange: (range: DayRange | null) => void;
}

/**
 * Month grid where each day carries its six 4-hour stacked bars. No placed waffle
 * on the tiles: placements already appear as the bars' own segments, so the tile
 * is just the chart and its caption. Hovering any bar gives the numbers behind it.
 */
export default function JobCalendar({
  slices,
  activities,
  bars,
  onShowBars,
  levels,
  fills,
  scale,
  perDayScale,
  peakBinTotal,
  levelPeak,
  firstDay,
  lastDay,
  asOf,
  activeStartDate,
  onActiveStartDateChange,
  onSelectDay,
  range,
  onRangeChange,
}: JobCalendarProps) {
  const minDate = parseDayKey(firstDay);
  const maxDate = parseDayKey(lastDay);

  // Drag-to-select. A plain click still opens the day; a press that moves onto
  // another tile becomes a range instead, previewed live and committed on
  // release. Refs rather than state for the gesture itself, since nothing
  // needs to re-render until the preview changes.
  const dragStart = useRef<string | null>(null);
  const dragged = useRef(false);
  // Set when a drag ends on the tile it started on, where the browser still
  // fires a click; that click must not open the day.
  const suppressClick = useRef(false);
  // The range being dragged out, as state for the grid to grey against and as
  // a ref for the release handler to commit. The release can arrive before
  // React has re-rendered with the latest preview -- a fast flick, or a
  // synthetic drag -- so the handler must not read it from a closure.
  const [preview, setPreview] = useState<DayRange | null>(null);
  const previewRef = useRef<DayRange | null>(null);
  const onRangeChangeRef = useRef(onRangeChange);
  onRangeChangeRef.current = onRangeChange;

  const beginDrag = (event: React.MouseEvent) => {
    // A new press starts fresh. If the last drag's release produced no click
    // (it ended off its starting tile), the flag would otherwise swallow the
    // next genuine click on a day.
    suppressClick.current = false;
    if (event.button !== 0 || event.shiftKey) return;
    const day = dayAt(event.target);
    if (!day) return;
    dragStart.current = day;
    dragged.current = false;
  };
  const extendDrag = (event: React.MouseEvent) => {
    const start = dragStart.current;
    if (!start) return;
    const day = dayAt(event.target);
    if (!day) return;
    if (day !== start) dragged.current = true;
    if (dragged.current) {
      const next = rangeOf(start, day);
      previewRef.current = next;
      setPreview(next);
    }
  };
  // A release anywhere ends the gesture, including outside the grid. Registered
  // once: everything it needs is in refs.
  useEffect(() => {
    const endDrag = () => {
      const start = dragStart.current;
      if (!start) return;
      if (dragged.current) {
        if (previewRef.current) onRangeChangeRef.current(previewRef.current);
        suppressClick.current = true;
      }
      dragStart.current = null;
      dragged.current = false;
      previewRef.current = null;
      setPreview(null);
    };
    window.addEventListener("mouseup", endDrag);
    return () => window.removeEventListener("mouseup", endDrag);
  }, []);
  // Escape clears the selection, the way it dismisses anything else, and so
  // does a click on empty page off the calendar. Two kinds of press are not
  // "off the calendar": anything inside what MUI floats over the page -- the
  // day dialog, a select's menu, a tooltip -- and any control at all, such as
  // the bar toggles, the scale switch, or the period select. The reader is
  // adjusting the view the range belongs to, and losing it under them would be
  // a surprise. Only a press on nothing in particular means "done with that".
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!range) return;
    const FLOATING = ".MuiDialog-root, .MuiPopover-root, .MuiPopper-root, .MuiTooltip-popper";
    const CONTROL =
      "button, a, input, select, textarea, label, [role='button'], [role='tab'], [role='option'], [role='menuitem'], [role='combobox']";
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // With a dialog or menu open, Escape belongs to it; the range goes on
      // the next press, once the reader is back on the page.
      if (document.querySelector(".MuiDialog-root, .MuiPopover-root")) return;
      onRangeChange(null);
    };
    const onPress = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (wrapper.current?.contains(target)) return;
      if (target.closest(FLOATING) || target.closest(CONTROL)) return;
      onRangeChange(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPress);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPress);
    };
  }, [range, onRangeChange]);

  // What the grid greys against: the drag in progress, else the committed range.
  const shown = preview ?? range;

  // Which scale the pointer is currently over. The calendar draws against two
  // of them, so hovering a mark lights up the axis that governs it -- and, just
  // as usefully, leaves the other one alone.
  const [hoveredScale, setHoveredScale] = useState<ScaleKind | null>(null);

  // What the day bars' heights mean: counts against the scope's busiest bin
  // under the chosen scale.
  // Per-day scaling has no shared peak to label, so the row axis goes and each
  // tile prints its own.
  const axis = useMemo<{ ticks: ScaleTick[]; unit: "count" | "percent" }>(
    () => ({
      ticks: perDayScale ? [] : buildScaleTicks(peakBinTotal, scale),
      unit: "count",
    }),
    [peakBinTotal, scale, perDayScale],
  );

  // The right-hand scale: the level trace's own count scale, built the same way
  // as the activity scale so both put their top tick at the top of the slot.
  const rightAxis = useMemo<{ ticks: ScaleTick[]; unit: "count" | "percent"; glyph: boolean } | null>(
    () => (levels ? { ticks: buildScaleTicks(levelPeak, scale), unit: "count", glyph: true } : null),
    [levels, levelPeak, scale],
  );

  return (
    <Box
      ref={wrapper}
      onMouseDown={beginDrag}
      onMouseOver={extendDrag}
      sx={{
        // Dragging across tiles must not select their text.
        userSelect: "none",
        // The axis hangs off the left of the grid, so the wrapper reserves its
        // width. Padding rather than a negative margin on the labels themselves:
        // this way the numbers can never be pushed under the page's own edge, and
        // a narrow viewport shrinks the calendar instead of clipping the scale.
        pl: `${AXIS_WIDTH}px`,
        // Room for the queue scale, plus the half of the last column's midnight
        // dot that hangs past the grid's right edge and which that scale sits
        // clear of.
        pr: `${AXIS_WIDTH + QUEUE_OVERHANG}px`,
        "& .react-calendar": {
          width: "100%",
          maxWidth: "none",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          backgroundColor: "background.paper",
          fontFamily: "inherit",
          lineHeight: 1.4,
        },
        // --- navigation ---
        "& .react-calendar__navigation": {
          height: "auto",
          marginBottom: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
        },
        "& .react-calendar__navigation button": {
          minWidth: 44,
          padding: "10px 6px",
          background: "none",
          fontSize: "1rem",
          fontWeight: 600,
          color: "text.primary",
        },
        "& .react-calendar__navigation button:disabled": { color: "text.disabled" },
        "& .react-calendar__navigation button:enabled:hover, & .react-calendar__navigation button:enabled:focus":
          { backgroundColor: "action.hover" },
        // --- weekday header ---
        "& .react-calendar__month-view__weekdays": {
          fontSize: "0.7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: "text.secondary",
          paddingTop: "6px",
        },
        "& .react-calendar__month-view__weekdays__weekday": { padding: "4px 6px" },
        "& .react-calendar__month-view__weekdays abbr": { textDecoration: "none" },
        // --- day tiles ---
        "& .react-calendar__tile": {
          // Positioned so the row axis can be placed against the tile.
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: `${TILE_GAP}px`,
          // Tall enough for the date, the bars slot, and its caption.
          minHeight: 136,
          // No horizontal padding: the level trace and the completion fill run
          // edge to edge so one day's meets the next day's. Everything else in
          // the tile is centred, which does not miss the inset.
          padding: `${TILE_PAD_Y}px 0`,
          border: "1px solid",
          borderColor: "divider",
          background: "none",
          fontSize: "0.75rem",
          color: "text.primary",
          // Deliberately unclipped, so the row axis -- a child of the tile --
          // can reach past its left edge and sit outside the grid.
          //
          // !important is load-bearing here, unusually. react-calendar renders
          // each tile as a <button>, and the browser clips a button's content at
          // a priority a plain author declaration does not outrank: with
          // `overflow: visible` as the only matching rule in the document, the
          // computed value still came back `hidden`. This is the one thing that
          // moves it. Should a future engine ignore it, the labels are clipped and
          // nothing else changes -- the bars, the hover readouts, and the note at
          // the foot of the page all still work.
          //
          // The day's own content does its own clipping -- see .day-body in
          // TileBody.
          overflow: "visible !important",
        },
        // One axis per row at each end: activity on the row's first tile, the queue
        // scale on its last.
        "& .react-calendar__month-view__days__day:not(:nth-of-type(7n + 1)) .day-axis": {
          display: "none",
        },
        "& .react-calendar__month-view__days__day:not(:nth-of-type(7n)) .day-axis-right": {
          display: "none",
        },
        "& .react-calendar__tile:enabled:hover, & .react-calendar__tile:enabled:focus": {
          backgroundColor: "action.hover",
        },
        "& .react-calendar__tile:disabled": {
          backgroundColor: "transparent",
          color: "text.disabled",
        },
        // Dim the day, not the tile: the row axis is a sibling of the body and
        // belongs to the whole row, so it must stay legible even when the row
        // happens to start in the previous month.
        "& .react-calendar__month-view__days__day--neighboringMonth > abbr, & .react-calendar__month-view__days__day--neighboringMonth .day-body, & .react-calendar__month-view__days__day--neighboringMonth .day-level, & .react-calendar__month-view__days__day--neighboringMonth .day-fill":
          { opacity: 0.35 },
        // The as-of day is marked instead of the browser's own current date; the
        // baked window ends whenever the data was built.
        "& .react-calendar__tile--now": { backgroundColor: "transparent" },
        "& .react-calendar__tile--active": { backgroundColor: "transparent" },
        "& .react-calendar__tile.day-as-of": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
        },
        // Outside the selected range: a solid grey block. The date stays, faint,
        // so the grid is still a calendar; everything drawn in the tile goes,
        // so the selected days are the only marks on it. The row axes are
        // spared -- they belong to the row, not the day.
        "& .react-calendar__tile.day-outside, & .react-calendar__tile.day-outside:enabled:hover, & .react-calendar__tile.day-outside:enabled:focus":
          { backgroundColor: "grey.200" },
        "& .react-calendar__tile.day-outside > abbr": { opacity: 0.4 },
        "& .react-calendar__tile.day-outside > *:not(abbr):not(.day-axis):not(.day-axis-right)":
          { visibility: "hidden" },
      }}
    >
      <Calendar
        view="month"
        minDetail="month"
        maxDetail="month"
        // Weeks run Sunday to Saturday, pinned rather than left to the browser's
        // locale: the data is fetched in Sunday-to-Saturday weeks, and the page
        // measures its scale peaks over the grid it believes is drawn. A
        // Monday-start locale would otherwise show a different set of
        // neighbouring days from the ones scaled against.
        calendarType="gregory"
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate: next }) => {
          if (next) onActiveStartDateChange(next);
        }}
        minDate={minDate}
        maxDate={maxDate}
        value={null}
        onClickDay={(date, event) => {
          // The click that follows a drag released on its starting tile.
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          const key = dayKeyOf(date);
          // Shift-click: the keyboard-friendly way to pick a range. Extends
          // from the current range's start, or starts one on this day.
          if (event.shiftKey) {
            onRangeChange(rangeOf(range?.start ?? key, key));
            return;
          }
          onSelectDay(key);
        }}
        tileClassName={({ date, view }) => {
          if (view !== "month") return null;
          const key = dayKeyOf(date);
          const classes: string[] = [];
          if (key === asOf) classes.push("day-as-of");
          if (shown && !inRange(key, shown)) classes.push("day-outside");
          return classes.length > 0 ? classes : null;
        }}
        tileDisabled={({ date }) => {
          const key = dayKeyOf(date);
          // A day with inherited work to report on is alive even if nothing
          // moved: its completion fill is the answer.
          if (fills?.get(key)?.hasData) return false;
          return isEmptySlice(slices.get(key));
        }}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const key = dayKeyOf(date);
          const slice = slices.get(key);
          // Local-midnight arithmetic, not a milliseconds offset, so the label is
          // right across a daylight-saving boundary.
          const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
          const nextKey = dayKeyOf(next);
          return (
            <>
              {/* Which day this tile is, for the drag gesture, which sees only
                  DOM targets. Hidden: it is a marker, not content. */}
              <span data-day={key} hidden />
              {/* Rendered on every tile, revealed by CSS on the first of each
                  row. See TileAxis. Absent under per-day scaling, which has no
                  shared peak to label. */}
              {axis.ticks.length > 0 && (
                <TileAxis
                  ticks={axis.ticks}
                  // The bars keep headroom for the hidden-state marks at the
                  // top of the slot, so the tallest bar stops short of it and
                  // the axis has to as well, or its top tick would float above
                  // the bar it names. The queue trace keeps the whole slot.
                  height={BARS_SLOT - GLYPH_HEADROOM}
                  bottom={AXIS_BOTTOM}
                  side="left"
                  unit={axis.unit}
                  highlighted={hoveredScale === "activity"}
                />
              )}
              {/* The right-hand scale, revealed by CSS on the last tile of each
                  row. Only where there is something on the right to scale. */}
              {rightAxis && rightAxis.ticks.length > 0 && (
                <TileAxis
                  ticks={rightAxis.ticks}
                  height={BARS_SLOT}
                  bottom={AXIS_BOTTOM}
                  side="right"
                  unit={rightAxis.unit}
                  highlighted={hoveredScale === "queue"}
                  glyph={rightAxis.glyph}
                />
              )}
              {/*
                The completion fill, the whole tile's background. First of the
                positioned siblings so the level trace, at the same z-index,
                paints over it; the day body sits above both.
              */}
              {fills && fills.get(key)?.hasData && (
                <TileCompletionFill outcome={fills.get(key) as DayOutcome} day={key} />
              )}
              {/*
                The open-jobs level, behind the bars. Sibling of the day body,
                not a child of it: the body clips, and the trace has to run edge
                to edge into the neighbouring day, with its midnight dot astride
                the boundary.
              */}
              {levels && slice && levels.get(key)?.hasData && (
                <TileLevelLine
                  level={levels.get(key) as DayLevel}
                  day={key}
                  nextDay={slices.has(nextKey) ? nextKey : null}
                  queue={slice.queue}
                  peak={levelPeak}
                  scale={scale}
                  height={BARS_SLOT}
                  bottom={AXIS_BOTTOM}
                  onHoverScale={setHoveredScale}
                />
              )}
              <TileBody
                slice={slice}
                activity={activities.get(key)}
                bars={bars}
                onShowBars={onShowBars}
                perDayScale={perDayScale}
                peakBinTotal={peakBinTotal}
                scale={scale}
                onHoverScale={setHoveredScale}
              />
            </>
          );
        }}
      />
    </Box>
  );
}

/**
 * Fixed height for every tile's bars: a uniform canvas keeps the six-bin shape
 * legible on every day, and the bars carry their own height inside it.
 */
const BARS_SLOT = TILE_BARS_HEIGHT;

// Tile geometry, shared between the CSS below and the axis offset. The row axis
// is positioned against the tile, so it can only line up with the bars if these
// three numbers and the CSS agree -- hence one definition, used in both places.
const TILE_PAD_Y = 6;
const TILE_GAP = 4;
const CAPTION_LINE = 14;

/**
 * Distance from a tile's bottom edge up to the floor of its bar slot: the
 * caption, the gap above it, and the tile's own bottom padding.
 */
const AXIS_BOTTOM = TILE_PAD_Y + CAPTION_LINE + TILE_GAP;

const TILE_CAPTION = {
  fontSize: "0.64rem",
  fontWeight: 700,
  height: `${CAPTION_LINE}px`,
  lineHeight: `${CAPTION_LINE}px`,
  textAlign: "center",
  whiteSpace: "nowrap",
} as const;

/**
 * One day's tile content: the bar slot and its caption.
 *
 * Deliberately the same skeleton on every day, including days with nothing to
 * draw. The row axis is positioned against the tile, so it can only line up with
 * the bars if the slot sits at the same height in every tile -- and the leftmost
 * tile of a row is as likely to be an empty day as a busy one.
 */
function TileBody({
  slice,
  activity,
  bars,
  onShowBars,
  perDayScale,
  peakBinTotal,
  scale,
  onHoverScale,
}: {
  slice: DaySlice | undefined;
  activity: DayActivity | undefined;
  bars: ActivityState[];
  onShowBars: (state: ActivityState) => void;
  perDayScale: boolean;
  peakBinTotal: number;
  scale: BarScale;
  onHoverScale: (kind: ScaleKind | null) => void;
}) {
  // The bars show only when something changed state.
  const barsVisible = slice ? !!activity?.hasData : false;
  const dayLabel = slice ? formatDayShort(slice.day) : "";
  // What this tile's bars are scaled against: the day's own busiest window
  // under per-day scaling, else the scope's shared peak. The hover readout is
  // where the counts live either way.
  const peak = perDayScale
    ? (activity?.bins.reduce((max, bin) => Math.max(max, bin.total), 0) ?? 0)
    : peakBinTotal;

  // The day bake counts starts, completions and removals, so a day whose only
  // event was a submission has "0 changed" -- which reads as nothing happened
  // next to a tile full of fresh blue. The bars' own placement count knows
  // better.
  const caption = !slice
    ? ""
    : !barsVisible
      ? ""
      : slice.changed > 0
        ? `${compactNumber(slice.changed)} changed`
        : activity && activity.bins.some((bin) => bin.placed > 0)
          ? `${compactNumber(activity.bins.reduce((sum, bin) => sum + bin.placed, 0))} placed`
          : `${compactNumber(slice.changed)} changed`;

  return (
    <Box
      className="day-body"
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: `${TILE_GAP}px`,
        // The tile is unclipped so the axis can reach outside it; the day's own
        // content is clipped here instead.
        overflow: "hidden",
        // Above the level trace, which is a positioned sibling at z-index 0 and
        // would otherwise paint over this in-flow content.
        position: "relative",
        zIndex: 1,
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: BARS_SLOT,
          display: "flex",
          alignItems: barsVisible ? "flex-end" : "center",
          justifyContent: "center",
        }}
      >
        {barsVisible && slice && activity ? (
          // The bars stay inset and centred, where a gap between days is correct
          // -- each is its own independent total, not a series.
          <Box sx={{ width: "100%", maxWidth: 104, minWidth: 0 }}>
            <TileActivityBars
              bins={activity.bins}
              peakBinTotal={peak}
              scale={scale}
              height={BARS_SLOT}
              dayLabel={dayLabel}
              label={`${compactNumber(activity.total)} jobs ${describeActivity(bars)}`}
              shown={bars}
              onShow={onShowBars}
              onHoverScale={onHoverScale}
            />
          </Box>
        ) : (
          // Nothing to plot, but the day still has a headline worth showing.
          slice &&
          (slice.queued > 0 || slice.changed > 0) && (
            <Typography
              component="span"
              sx={{ fontSize: "0.68rem", fontWeight: 700, lineHeight: 1.3 }}
            >
              {slice.changed > 0
                ? `${compactNumber(slice.changed)} changed`
                : `${compactNumber(slice.queued)} placed`}
            </Typography>
          )
        )}
      </Box>

      {/* Always present, even when blank: it is what holds the bar slot at the
          same height in every tile, which is what the row axis is aligned to. */}
      <Typography component="span" sx={TILE_CAPTION}>
        {caption || "\u00A0"}
      </Typography>
    </Box>
  );
}
