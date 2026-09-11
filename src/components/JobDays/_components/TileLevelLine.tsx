"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";

import type { BarScale } from "../types";
import { barFraction, type DayLevel, type ScaleKind } from "./binModel";
import BinReadout, { READOUT_PLACEMENT, READOUT_SLOT_PROPS, type ReadoutRow } from "./BinReadout";
import { formatDayShort, type DayQueue } from "./dayCards";
import { BAR_STATE_STYLES, CARRIED_ACTIVE_COLOR, LEVEL_DOT_COLOR, LEVEL_LINE_COLOR } from "./palette";

/** Diameter of the midnight dot. */
const DOT = 7;

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
 * numbers. Grey rather than a state colour, and behind rather than in front: see
 * LEVEL_LINE_COLOR.
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
  const y = (value: number) => (height - barFraction(value, top, scale) * height).toFixed(2);
  const points = [`0,${y(level.start)}`, ...level.ends.map((v, b) => `${b + 1},${y(v)}`)].join(" ");

  const midnight = level.ends[bins - 1];
  const dotBottom = barFraction(midnight, top, scale) * height;

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
          <polyline
            points={points}
            fill="none"
            stroke={LEVEL_LINE_COLOR}
            strokeWidth={hovered ? 2.5 : 1.75}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
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
        slotProps={READOUT_SLOT_PROPS}
        open={hovered}
        title={
          <BinReadout
            title={
              nextDay
                ? `Open jobs at midnight · ${formatDayShort(day)} → ${formatDayShort(nextDay)}`
                : `Open jobs at the end of ${formatDayShort(day)}`
            }
            subtitle={`${midnight.toLocaleString()} ${midnight === 1 ? "job" : "jobs"} still open`}
            rows={rows}
            footer={[
              "The grey line is derived from the 4-hour transitions and read against the queue scale on the right.",
              ...(queue && queue.total !== midnight
                ? [`The midnight census counted ${queue.total.toLocaleString()}; the split above is from that census.`]
                : []),
            ]}
          />
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
            transform: "translate(50%, 50%)",
            borderRadius: "50%",
            backgroundColor: LEVEL_DOT_COLOR,
            boxShadow: (theme) => `0 0 0 1.5px ${theme.palette.background.paper}`,
            // Above the neighbouring tile, which paints after this one.
            zIndex: 2,
            cursor: "default",
          }}
        />
      </Tooltip>
    </>
  );
}
