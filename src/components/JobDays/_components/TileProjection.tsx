"use client";

import { Box, Typography } from "@mui/material";

import type { BarScale } from "../types";
import { barFraction, projectionThrough, type QueueProjection } from "./binModel";
import { formatDateShort } from "./dayCards";
import { PROJECTION_COLOR } from "./palette";

/** Diameter of the hollow dot where the forecast meets the floor. */
const DOT = 7;

interface TileProjectionProps {
  projection: QueueProjection;
  /** The future day this tile is. */
  day: string;
  /** Highest level on the visible scope; the queue line's own scale. */
  peak: number;
  scale: BarScale;
  /** Bar-slot height, shared with the day's bars. */
  height: number;
  /** Distance from the tile's bottom edge to the floor of the bar slot. */
  bottom: number;
}

/**
 * The queue line's forecast through one day: a light grey dashed run from
 * where the readings stop -- the tile's left edge, or the "now" point on the
 * day in progress -- to the tile's right edge, or to the point where it meets
 * the floor, where a hollow dot and a label mark the projected end. Same scale
 * as the real trace; grey and dashed so it cannot be mistaken for a reading.
 * It takes no pointer events: the last real dot's readout carries the numbers
 * behind it.
 */
export default function TileProjection({
  projection,
  day,
  peak,
  scale,
  height,
  bottom,
}: TileProjectionProps) {
  const run = projectionThrough(projection, day);
  if (!run) return null;

  const top = Math.max(peak, 1);
  const y = (value: number) => Number((height - barFraction(value, top, scale) * height).toFixed(2));
  const y1 = y(run.start);
  const y2 = y(run.end);
  const color = PROJECTION_COLOR;
  const meetsFloor = run.zeroAt < 1;

  return (
    <>
      <Box
        className="day-projection"
        aria-hidden
        sx={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom,
          height,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 1 ${height}`}
          preserveAspectRatio="none"
          style={{ display: "block", overflow: "visible" }}
        >
          <line
            x1={run.startAt}
            y1={y1}
            x2={run.zeroAt}
            y2={y2}
            stroke={color}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </Box>
      {meetsFloor && (
        <>
          {/* Where the line reaches zero: a hollow dot on the floor. */}
          <Box
            className="day-projection"
            aria-hidden
            sx={{
              position: "absolute",
              left: `${(run.zeroAt * 100).toFixed(2)}%`,
              bottom,
              width: DOT,
              height: DOT,
              transform: "translate(-50%, 50%)",
              borderRadius: "50%",
              border: "2px solid",
              borderColor: color,
              backgroundColor: "background.paper",
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <Typography
            className="day-projection"
            component="span"
            role="img"
            aria-label={`Projected to reach 0 open jobs on ${formatDateShort(projection.emptiesOn)} at ${Math.round(projection.perDay).toLocaleString()} jobs a day`}
            sx={{
              position: "absolute",
              left: 4,
              right: 4,
              bottom: bottom + DOT,
              fontSize: "0.58rem",
              lineHeight: 1.2,
              textAlign: "center",
              color: "text.secondary",
              pointerEvents: "none",
              zIndex: 2,
            }}
          >
            projected 0
          </Typography>
        </>
      )}
    </>
  );
}
