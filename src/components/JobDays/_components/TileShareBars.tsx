"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";

import type { BinCensus, ScaleKind } from "./binModel";
import BinReadout, { READOUT_PLACEMENT, READOUT_SLOT_PROPS, type ReadoutRow } from "./BinReadout";
import {
  SHARE_SEGMENT_ORDER,
  SHARE_SEGMENT_ORDER_TOP_DOWN,
  SHARE_SEGMENT_STYLES,
} from "./palette";

interface TileShareBarsProps {
  /** The day's six window censuses; see CensusMode "window" in binModel. */
  bins: BinCensus[];
  height: number;
  /** The day the bars belong to, for the hover readout's title. */
  dayLabel: string;
  /** Accessible description; the graphic is one image. */
  label: string;
  /** Lights up the percentage axis while a bar is hovered. See TileAxis. */
  onHoverScale?: (kind: ScaleKind | null) => void;
}

/** Gap between neighbouring columns, in pixels. */
const COLUMN_GAP = 2;

/**
 * Calendar v2's tile chart: six 100%-stacked columns, one per 4-hour window,
 * filling the tile's height. Each column is one window's own population -- the
 * jobs open when it started plus the jobs placed during it -- and where those
 * stood when it closed. Top down: still active, removed, completed, and the
 * window's own placements at the base (see SHARE_SEGMENT_ORDER).
 *
 * Unlike the journey bars in TileBars, these do not run edge to edge: every
 * column has its own denominator, so a gap between them is the honest join.
 *
 * A column whose window had no population (nothing open, nothing placed) draws
 * nothing but keeps its hit area, so hovering it says so.
 */
export default function TileShareBars({
  bins,
  height,
  dayLabel,
  label,
  onHoverScale,
}: TileShareBarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const bin = hovered === null ? null : bins[hovered];

  const enter = (index: number) => {
    setHovered(index);
    onHoverScale?.("activity");
  };
  const leave = () => {
    setHovered(null);
    onHoverScale?.(null);
  };

  // Share first, count second: the bar is a percentage and the count is detail.
  // Listed top-down, the way the eye reads the bar.
  const rows: ReadoutRow[] = bin?.drawn
    ? SHARE_SEGMENT_ORDER_TOP_DOWN.filter((state) => bin[state] > 0).map((state) => ({
        label: SHARE_SEGMENT_STYLES[state].label.toLowerCase(),
        color: SHARE_SEGMENT_STYLES[state].color,
        value: bin[state],
        share: bin.inPlay > 0 ? (bin[state] / bin.inPlay) * 100 : null,
        lead: "share" as const,
      }))
    : [];

  return (
    <Tooltip
      arrow
      followCursor
      disableInteractive
      placement={READOUT_PLACEMENT.activity}
      slotProps={READOUT_SLOT_PROPS}
      open={bin !== null}
      title={
        bin ? (
          <BinReadout
            title={`${dayLabel} · ${bin.snapshotAt}`}
            rows={rows}
            footer={
              bin.drawn
                ? [
                    `${bin.inPlay.toLocaleString()} jobs in this window: ${(bin.inPlay - bin.placedInBin).toLocaleString()} open at its start + ${bin.placedInBin.toLocaleString()} placed during it`,
                    ...(bin.terminal ? ["All of them finished by its close."] : []),
                  ]
                : ["Nothing open and nothing placed in this window."]
            }
          />
        ) : (
          ""
        )
      }
    >
      <Box
        role="img"
        aria-label={label}
        onMouseLeave={leave}
        sx={{
          display: "flex",
          width: "100%",
          height,
          gap: `${COLUMN_GAP}px`,
          alignItems: "stretch",
        }}
      >
        {bins.map((entry, i) => (
          <Box
            key={i}
            onMouseEnter={() => enter(i)}
            sx={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              // Stacked bottom-up: column-reverse keeps the segment order
              // identical to SHARE_SEGMENT_ORDER.
              flexDirection: "column-reverse",
              overflow: "hidden",
              borderRadius: "1px",
              // The hovered column lifts out of the row without moving anything.
              opacity: hovered === null || hovered === i ? 1 : 0.3,
              transition: "opacity 100ms",
            }}
          >
            {entry.drawn &&
              SHARE_SEGMENT_ORDER.map((state) => (
                <Box
                  key={state}
                  sx={{
                    flexGrow: entry[state],
                    flexBasis: 0,
                    backgroundColor: SHARE_SEGMENT_STYLES[state].color,
                  }}
                />
              ))}
          </Box>
        ))}
      </Box>
    </Tooltip>
  );
}
