"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";

import type { BarScale } from "../types";
import { barFraction, type DayLevel, type ScaleKind } from "./binModel";
import BinReadout, { READOUT_PLACEMENT, READOUT_SLOT_PROPS_LIGHT, type ReadoutRow } from "./BinReadout";
import { formatDateShort, formatDayShort, parseDayKey, type DayQueue } from "./dayCards";
import { BAR_STATE_STYLES, CARRIED_ACTIVE_COLOR, levelSegments, levelSlopeColor } from "./palette";
import SlopeLegend from "./SlopeLegend";

/** Diameter of the midnight dot. */
const DOT = 7;

/** Beyond this the projected empty day is not worth a date. */
const FAR_FUTURE_DAYS = 365;

/**
 * The queue's net change across the whole day, midnight to midnight, and
 * where that rate would take it. The day's total rather than the closing
 * window: a single 4-hour window is too noisy to project from, and the day is
 * the unit the calendar is built on. The six segments still show how the
 * day's change was distributed.
 */
export function daySlope(level: DayLevel, day: string): {
  /** Jobs per day, negative when the queue is falling. */
  perDay: number;
  /** The day the queue would reach zero at this rate; null unless it is falling. */
  emptiesOn: Date | null;
  /** True when the projected empty day is more than a year away. */
  farOff: boolean;
} {
  const midnight = level.ends[level.ends.length - 1];
  const perDay = midnight - level.start;
  if (perDay >= 0 || midnight <= 0) {
    return { perDay, emptiesOn: null, farOff: false };
  }
  const days = midnight / -perDay;
  const start = parseDayKey(day);
  // Local-midnight arithmetic: the day after this one, plus however many days
  // the queue needs at this rate, rounded up to the day it actually hits zero.
  const emptiesOn = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 1 + Math.floor(days),
  );
  return { perDay, emptiesOn, farOff: days > FAR_FUTURE_DAYS };
}

/** "1,200 jobs/day". */
function formatRate(perDay: number): string {
  const magnitude = Math.round(Math.abs(perDay));
  return `${magnitude.toLocaleString()} ${magnitude === 1 ? "job" : "jobs"}/day`;
}

/** The caveat every projection opens with. */
const RATES_VARY = "Rates can vary over time.";

/** The readout's lines about the slope: the day's rate, then what it implies. */
export function slopeLines(slope: ReturnType<typeof daySlope>, midnight: number): string[] {
  const { perDay, emptiesOn, farOff } = slope;
  if (midnight <= 0 && perDay <= 0) {
    return ["Job queue hit 0 by midnight."];
  }
  if (perDay === 0) {
    return ["Flat: 0 jobs/day", `${RATES_VARY} Current rate indicates job queue never hits 0`];
  }
  if (perDay > 0) {
    return [
      `Rising ${formatRate(perDay)}`,
      `${RATES_VARY} Current rate indicates job queue is growing, not hitting 0`,
    ];
  }
  const rate = `Falling ${formatRate(perDay)}`;
  if (!emptiesOn) return [rate];
  return [
    rate,
    farOff
      ? `${RATES_VARY} Current rate indicates job queue hits 0 more than a year out`
      : `${RATES_VARY} Current rate indicates job queue hits 0 on ${formatDateShort(emptiesOn)}`,
  ];
}

interface TileLevelLineProps {
  level: DayLevel;
  /** The day whose trace this is. */
  day: string;
  /** The following day, for the readout's title. Null at the end of the window. */
  nextDay: string | null;
  /**
   * The measured midnight census, when the bake has one. The trace itself is
   * derived from transitions; this is what the readout quotes for the split
   * between carried and placed-today.
   */
  queue: DayQueue | null;
  /** Highest level anywhere on the visible month; the trace's own scale. */
  peak: number;
  scale: BarScale;
  /** Bar-slot height, shared with the day's bars. */
  height: number;
  /** Distance from the tile's bottom edge to the floor of the bar slot. */
  bottom: number;
  /** Lights up the queue scale down the right while the dot is hovered. */
  onHoverScale?: (kind: ScaleKind | null) => void;
}

/**
 * The open-jobs level through one day: a grey trace behind the bars from the
 * tile's left edge (the level at midnight) through the close of each 4-hour
 * window to its right edge, where a dot marks the midnight reading.
 *
 * It spans the tile edge to edge so it runs straight into the next day's trace:
 * the level is one continuous series and a week reads as one line, stepping down
 * as work finishes and jumping when a batch lands. The bars stay inset and
 * centred above it, so the two never fight for the same pixels.
 *
 * The line takes no pointer events; the dot is the hover target and carries the
 * numbers. Each of its six segments is coloured by how steeply it moves, on a
 * weather-radar ramp from light blue for flat through green, yellow and red to
 * purple for a full-slot drop or climb in one window: see levelSlopeColor. Steepness is measured on the drawn pixels, after the
 * page's scale, so the colour matches the slope the eye sees. The dot takes
 * the day's average slope, and its readout projects from that average.
 */
export default function TileLevelLine({
  level,
  day,
  nextDay,
  queue,
  peak,
  scale,
  height,
  bottom,
  onHoverScale,
}: TileLevelLineProps) {
  const [hovered, setHovered] = useState(false);
  const top = Math.max(peak, 1);

  // One x unit per window; y in pixels so the stroke stays true. The SVG is
  // stretched to the tile's width with preserveAspectRatio="none", and the
  // stroke is kept from stretching with it by vector-effect below.
  const bins = level.ends.length;
  // Rounded to two decimals so server and client emit the same attribute
  // strings; see the note on Math.log10 in TileActivityBars.
  const y = (value: number) => Number((height - barFraction(value, top, scale) * height).toFixed(2));
  const segments = levelSegments([y(level.start), ...level.ends.map(y)], height);

  const midnight = level.ends[bins - 1];
  const dotBottom = barFraction(midnight, top, scale) * height;
  // The dot is coloured by the day's average slope, on the same per-window
  // steepness scale as the segments: a day that fell the whole slot evenly is
  // six segments of one sixth, and a dot of one sixth. Its readout quotes the
  // same average.
  const dotColor = levelSlopeColor(Math.abs(y(midnight) - y(level.start)) / height / bins);
  const slope = daySlope(level, day);

  const rows: ReadoutRow[] = queue
    ? [
        ...(queue.carried > 0
          ? [
              {
                label: "already in flight before this day",
                color: CARRIED_ACTIVE_COLOR,
                value: queue.carried,
                share: queue.total > 0 ? (queue.carried / queue.total) * 100 : null,
              },
            ]
          : []),
        ...(queue.fromToday > 0
          ? [
              {
                label: "placed this day, still in flight",
                color: BAR_STATE_STYLES.active.color,
                value: queue.fromToday,
                share: queue.total > 0 ? (queue.fromToday / queue.total) * 100 : null,
              },
            ]
          : []),
      ]
    : [];

  return (
    <>
      <Box
        className="day-level"
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom,
          height,
          // Below the day body, which sets its own z-index above this.
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${bins} ${height}`}
          preserveAspectRatio="none"
          style={{ display: "block", overflow: "visible" }}
        >
          {/* One <line> per window rather than a polyline, so each segment can
              carry its own steepness colour. Round caps close the joins. */}
          {segments.map((segment) => (
            <line
              key={segment.x1}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              stroke={segment.color}
              strokeWidth={hovered ? 2.5 : 1.75}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </Box>

      {/* The midnight dot, astride the boundary: half in this day, half in the
          next. Its own element rather than an SVG circle, which the stretched
          viewBox would squash into an ellipse. */}
      <Tooltip
        arrow
        followCursor
        disableInteractive
        placement={READOUT_PLACEMENT.queue}
        slotProps={READOUT_SLOT_PROPS_LIGHT}
        open={hovered}
        title={
          <Box>
            <BinReadout
              title={
                nextDay
                  ? `Open jobs at midnight · ${formatDayShort(day)} → ${formatDayShort(nextDay)}`
                  : `Open jobs at the end of ${formatDayShort(day)}`
              }
              subtitle={`${midnight.toLocaleString()} ${midnight === 1 ? "job" : "jobs"} still open`}
              rows={rows}
              footer={[
                ...slopeLines(slope, midnight),
                ...(queue && queue.total !== midnight
                  ? [`The midnight census counted ${queue.total.toLocaleString()}; the split above is from that census.`]
                  : []),
              ]}
            />
            {/* What the line's colours mean, for the reader wondering right here. */}
            <SlopeLegend />
          </Box>
        }
      >
        <Box
          role="img"
          aria-label={`${midnight.toLocaleString()} jobs open at the end of ${formatDayShort(day)}`}
          onMouseEnter={() => {
            setHovered(true);
            onHoverScale?.("queue");
          }}
          onMouseLeave={() => {
            setHovered(false);
            onHoverScale?.(null);
          }}
          sx={{
            position: "absolute",
            right: 0,
            bottom: bottom + dotBottom,
            width: DOT,
            height: DOT,
            // Grows under the pointer, about its own centre, so the reader can
            // see which dot the readout belongs to.
            transform: `translate(50%, 50%) scale(${hovered ? 1.6 : 1})`,
            transition: "transform 120ms ease-out, box-shadow 120ms ease-out",
            borderRadius: "50%",
            backgroundColor: dotColor,
            // The paper ring, and on hover a halo in the dot's own colour.
            boxShadow: (theme) =>
              hovered
                ? `0 0 0 1.5px ${theme.palette.background.paper}, 0 0 0 4px ${dotColor}55`
                : `0 0 0 1.5px ${theme.palette.background.paper}`,
            // Above the neighbouring tile, which paints after this one.
            zIndex: 2,
            cursor: "default",
          }}
        />
      </Tooltip>
    </>
  );
}
