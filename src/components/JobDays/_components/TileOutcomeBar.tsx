"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";
import Star from "@mui/icons-material/Star";

import type { ScaleKind } from "./binModel";
import BinReadout, { READOUT_PLACEMENT, READOUT_SLOT_PROPS, type ReadoutRow } from "./BinReadout";
import { formatDayShort, type DayOutcome } from "./dayCards";
import { LEVEL_DOT_COLOR, OUTCOME_ORDER, OUTCOME_ORDER_TOP_DOWN, OUTCOME_STYLES } from "./palette";

/**
 * Width of the bar. Straddling the boundary, half of this sits in each day, so
 * it reads as belonging to the day that just ended rather than to a bin.
 */
const BAR_WIDTH = 11;

/** Diameter of the disc the clean-sweep star sits on. */
const STAR_DISC = 14;

/**
 * True when every job the day inherited completed during it: nothing still
 * open, nothing removed. The bar is solid teal and gets a star on top, so a
 * month can be scanned for the days that cleared their backlog outright.
 */
function isCleanSweep(outcome: DayOutcome): boolean {
  return outcome.opening > 0 && outcome.active === 0 && outcome.removed === 0;
}

interface TileOutcomeBarProps {
  outcome: DayOutcome;
  /** The day whose close this is. */
  day: string;
  /** The following day, for the readout's title. Null at the end of the window. */
  nextDay: string | null;
  /** Lights up the percentage scale down the right while this bar is hovered. */
  onHoverScale?: (kind: ScaleKind | null) => void;
}

/**
 * Calendar v2's boundary bar: what became of the jobs that were open when the
 * day began, as a 100%-stacked column astride midnight.
 *
 * Its population is fixed at the moment the day opens, so placements during the
 * day never enter it: a day that inherited 200 jobs and finished 100 is 50/50
 * whatever arrived meanwhile. Top down it reads still active, removed,
 * completed (see OUTCOME_ORDER). The six bars in the tile beside it count
 * changes to every job; this one answers only for the inherited ones.
 *
 * It runs the full height of the tile, top edge to bottom edge, rather than
 * the bar slot's: being a share it has no height of its own to encode, and
 * spanning the cell is what marks it as a boundary between days rather than a
 * seventh bar. The border says the same thing without colour.
 */
export default function TileOutcomeBar({ outcome, day, nextDay, onHoverScale }: TileOutcomeBarProps) {
  const [hovered, setHovered] = useState(false);
  const cleanSweep = isCleanSweep(outcome);

  const rows: ReadoutRow[] = OUTCOME_ORDER_TOP_DOWN.filter((state) => outcome[state] > 0).map(
    (state) => ({
      label: OUTCOME_STYLES[state].label.toLowerCase(),
      color: OUTCOME_STYLES[state].color,
      value: outcome[state],
      share: outcome.opening > 0 ? (outcome[state] / outcome.opening) * 100 : null,
      lead: "share" as const,
    }),
  );

  return (
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
              ? `Jobs open as ${formatDayShort(day)} began · by midnight`
              : `Jobs open as ${formatDayShort(day)} began · by its end`
          }
          subtitle={`${outcome.opening.toLocaleString()} ${outcome.opening === 1 ? "job was" : "jobs were"} open at the start of the day`}
          rows={rows}
          footer={[
            ...(cleanSweep
              ? ["A clean sweep: every job the day began with completed before it ended."]
              : []),
            "Only the jobs already open when the day began. Anything placed during the day is not part of this bar; the six bars beside it count those.",
          ]}
        />
      }
    >
      <Box
        role="img"
        aria-label={`Of ${outcome.opening.toLocaleString()} jobs open as ${formatDayShort(day)} began: ${outcome.active.toLocaleString()} still active, ${outcome.completed.toLocaleString()} completed, ${outcome.removed.toLocaleString()} removed`}
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
          // The whole tile, top to bottom.
          top: 0,
          bottom: 0,
          // Half in this day, half in the next.
          transform: "translateX(50%)",
          width: BAR_WIDTH,
          display: "flex",
          // Stacked bottom-up in OUTCOME_ORDER.
          flexDirection: "column-reverse",
          borderRadius: "2px",
          overflow: "hidden",
          // A thin dark border tells it apart from the day bars, which have
          // none; the paper ring outside it keeps it clear of whatever it
          // overlaps. Both sit outside the content box, so the segments still
          // share the full height between them.
          border: "1px solid",
          borderColor: LEVEL_DOT_COLOR,
          boxSizing: "content-box",
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.background.paper}`,
          // Lifts the overhanging half above the following tile, which paints
          // after this one and would otherwise cover it on hover.
          zIndex: 2,
          cursor: "default",
        }}
      >
        {OUTCOME_ORDER.map((state) => (
          <Box
            key={state}
            sx={{
              flexGrow: outcome[state],
              flexBasis: 0,
              backgroundColor: OUTCOME_STYLES[state].color,
            }}
          />
        ))}
        {/* The clean-sweep mark: a star at the top of an all-teal bar, on a
            paper disc so it reads against the teal. */}
        {cleanSweep && (
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: 3,
              left: "50%",
              transform: "translateX(-50%)",
              width: STAR_DISC,
              height: STAR_DISC,
              borderRadius: "50%",
              backgroundColor: "background.paper",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Star sx={{ fontSize: STAR_DISC - 2, color: OUTCOME_STYLES.completed.color }} />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
