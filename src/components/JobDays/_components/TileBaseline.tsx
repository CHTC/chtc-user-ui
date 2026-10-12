"use client";

import { Box } from "@mui/material";

import { TILE_BASELINE_COLOR } from "./palette";

interface TileBaselineProps {
  /** Distance from the tile's bottom edge to the floor of the bar slot. */
  bottom: number;
}

/**
 * The zero line of a tile's bar slot: a hairline run edge to edge across every
 * day, at the height the bars stand on and the queue line is measured from.
 *
 * Every mark in the slot is drawn from this height, but until now nothing drew
 * the height itself, so it had to be inferred from where the shortest bar in
 * the row happened to stop -- and on a day with no bars at all, from nothing.
 * That is the reading the line is for: a trace near the floor and a trace near
 * the top are the same shape until you can see which floor they are near, and
 * the completion ground's own waterline is only a ratio if its zero is visible.
 *
 * Edge to edge rather than inset to the bars, so it joins up across the week
 * the way the queue line above it does. Drawn on every tile, including days
 * with nothing to plot: the slot is there in every tile (see TileBody), and a
 * baseline that came and went would make the grid flicker as the reader paged.
 */
export default function TileBaseline({ bottom }: TileBaselineProps) {
  return (
    <Box
      className="day-baseline"
      aria-hidden
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        height: "1px",
        backgroundColor: TILE_BASELINE_COLOR,
        // With the completion ground, which it has to stay visible over, and
        // below the day body.
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
