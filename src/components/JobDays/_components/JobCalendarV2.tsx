"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import Calendar from "react-calendar";

import "react-calendar/dist/Calendar.css";

import type { DayCensus, ScaleKind, ScaleTick } from "./binModel";
import { compactNumber, dayKeyOf, formatDayShort, isEmptySlice, parseDayKey, type DaySlice } from "./dayCards";
import TileAxis, { AXIS_WIDTH } from "./TileAxis";
import TileShareBars from "./TileShareBars";

interface JobCalendarV2Props {
  slices: Map<string, DaySlice>;
  /**
   * Per-day window censuses (CensusMode "window"), keyed like `slices`: each
   * 4-hour window's own population and where it stood at the window's close.
   */
  shares: Map<string, DayCensus>;
  /** First and last day the window covers, "YYYY-MM-DD". */
  firstDay: string;
  lastDay: string;
  /** The day everything is read as of; marked in the grid. */
  asOf: string;
  activeStartDate: Date;
  onActiveStartDateChange: (date: Date) => void;
  onSelectDay: (day: string) => void;
}

/**
 * Height of the bar slot, which is the whole of the tile below its date. The
 * bars are percentages, so every day gets the same canvas and the six-column
 * shape reads the same on a 40-job day and a 400,000-job day.
 */
const SHARE_SLOT = 112;

// Tile geometry shared between the CSS below and the row axis, which is
// positioned against the tile and can only line up with the bars if these agree.
const TILE_PAD_TOP = 4;
const TILE_PAD_BOTTOM = 4;
const DATE_LINE = 18;
const TILE_GAP = 2;
const TILE_PAD_X = 3;

/** The percentage axis: fixed, because every bar is 0-100% of its own day. */
const PERCENT_TICKS: ScaleTick[] = [
  { value: 100, fraction: 1 },
  { value: 50, fraction: 0.5 },
  { value: 0, fraction: 0 },
];

/**
 * Calendar v2: a month grid where each day is six full-height percentage bars,
 * one per 4-hour window, and nothing else. No queue marker on the right and no
 * count scale: each bar is a share of its own window's population, so the only
 * axis it needs is 0-100%, printed once per row down the left.
 */
export default function JobCalendarV2({
  slices,
  shares,
  firstDay,
  lastDay,
  asOf,
  activeStartDate,
  onActiveStartDateChange,
  onSelectDay,
}: JobCalendarV2Props) {
  const minDate = parseDayKey(firstDay);
  const maxDate = parseDayKey(lastDay);

  // Only one scale here, but the axis still lights up while a bar is hovered so
  // the reader is reminded what the heights are measured in.
  const [hoveredScale, setHoveredScale] = useState<ScaleKind | null>(null);

  return (
    <Box
      sx={{
        // The axis hangs off the left of the grid, so the wrapper reserves its
        // width. Nothing hangs off the right in this version.
        pl: `${AXIS_WIDTH}px`,
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
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: `${TILE_GAP}px`,
          // Exactly the date line plus the bar slot: the bars are the cell.
          height: TILE_PAD_TOP + DATE_LINE + TILE_GAP + SHARE_SLOT + TILE_PAD_BOTTOM,
          padding: `${TILE_PAD_TOP}px ${TILE_PAD_X}px ${TILE_PAD_BOTTOM}px`,
          border: "1px solid",
          borderColor: "divider",
          background: "none",
          fontSize: "0.75rem",
          color: "text.primary",
          // Unclipped so the row axis -- a child of the tile -- can reach past
          // its left edge. See the note on !important in JobCalendar.
          overflow: "visible !important",
        },
        "& .react-calendar__tile > abbr": {
          display: "block",
          height: `${DATE_LINE}px`,
          lineHeight: `${DATE_LINE}px`,
          flexShrink: 0,
        },
        // One axis per row, on the row's first tile.
        "& .react-calendar__month-view__days__day:not(:nth-of-type(7n + 1)) .day-axis": {
          display: "none",
        },
        "& .react-calendar__tile:enabled:hover, & .react-calendar__tile:enabled:focus": {
          backgroundColor: "action.hover",
        },
        "& .react-calendar__tile:disabled": {
          backgroundColor: "transparent",
          color: "text.disabled",
        },
        // Dim the day, not the tile: the row axis belongs to the whole row.
        "& .react-calendar__month-view__days__day--neighboringMonth > abbr, & .react-calendar__month-view__days__day--neighboringMonth .day-body":
          { opacity: 0.35 },
        "& .react-calendar__tile--now": { backgroundColor: "transparent" },
        "& .react-calendar__tile--active": { backgroundColor: "transparent" },
        "& .react-calendar__tile.day-as-of": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: "-2px",
        },
      }}
    >
      <Calendar
        view="month"
        minDetail="month"
        maxDetail="month"
        activeStartDate={activeStartDate}
        onActiveStartDateChange={({ activeStartDate: next }) => {
          if (next) onActiveStartDateChange(next);
        }}
        minDate={minDate}
        maxDate={maxDate}
        value={null}
        onClickDay={(date) => onSelectDay(dayKeyOf(date))}
        tileClassName={({ date, view }) =>
          view === "month" && dayKeyOf(date) === asOf ? "day-as-of" : null
        }
        // A day is alive whenever it has a population -- carried in or placed --
        // even if nothing moved.
        tileDisabled={({ date }) => {
          const key = dayKeyOf(date);
          return !shares.get(key)?.hasData && isEmptySlice(slices.get(key));
        }}
        tileContent={({ date, view }) => {
          if (view !== "month") return null;
          const key = dayKeyOf(date);
          const slice = slices.get(key);
          const share = shares.get(key);
          const visible = !!slice && !!share?.hasData;
          const busiest = share ? Math.max(0, ...share.bins.map((bin) => bin.inPlay)) : 0;
          return (
            <>
              {/* Rendered on every tile, revealed by CSS on the first of each
                  row. See TileAxis. */}
              <TileAxis
                ticks={PERCENT_TICKS}
                height={SHARE_SLOT}
                bottom={TILE_PAD_BOTTOM}
                side="left"
                unit="percent"
                highlighted={hoveredScale === "activity"}
              />
              <Box
                className="day-body"
                sx={{ width: "100%", height: SHARE_SLOT, overflow: "hidden" }}
              >
                {visible && slice && share && (
                  <TileShareBars
                    bins={share.bins}
                    height={SHARE_SLOT}
                    dayLabel={formatDayShort(slice.day)}
                    label={`Where each 4-hour window's jobs stood at its close; the busiest window held ${compactNumber(busiest)} jobs`}
                    onHoverScale={setHoveredScale}
                  />
                )}
              </Box>
            </>
          );
        }}
      />
    </Box>
  );
}
