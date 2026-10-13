"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";
import Star from "@mui/icons-material/Star";

import type { ScaleKind } from "./binModel";
import BinReadout, { READOUT_PLACEMENT, READOUT_SLOT_PROPS, type ReadoutRow } from "./BinReadout";
import { formatDayShort, type DayOutcome } from "./dayCards";
import {
  LEVEL_DOT_COLOR,
  OUTCOME_ORDER_TOP_DOWN,
  OUTCOME_STYLES,
  RATIO_UNFINISHED_COLOR,
  RATIO_COMPLETED_COLOR,
} from "./palette";
import { completionShare } from "./TileRatioBar";

/**
 * Width of the bar. Straddling the boundary, half of this sits in each day, so
 * it reads as belonging to the day that just ended rather than to a bin.
 */
const BAR_WIDTH = 11;

/** Diameter of the disc the clean-sweep star sits on. */
const STAR_DISC = 14;

/**
 * True when every job the day held completed during it -- inherited and placed
 * alike: nothing still open, nothing removed. The bar is solid red and gets a
 * star, so a month can be scanned for the days that finished everything they
 * touched.
 */
function isCleanSweep(outcome: DayOutcome): boolean {
  return outcome.inPlay > 0 && outcome.active === 0 && outcome.removed === 0;
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
 * Calendar v2's end-of-day ratio bar: what became of every job the day had in
 * hand, as a 100%-stacked column astride midnight.
 *
 * Its population is everything that could have finished during the day -- open
 * when the day began, or placed into it while the day ran. A day that inherited
 * 200 jobs, took on 200 more and finished 100 of the 400 reads as a quarter
 * completed. The six bars in the tile beside it count every state change in the
 * day; this one asks what share of the day's own workload came out finished.
 *
 * It runs the full height of the tile, top edge to bottom edge, rather than
 * the bar slot's: being a share it has no height of its own to encode, and
 * spanning the cell is what marks it as a boundary between days rather than a
 * seventh bar. The border says the same thing without colour.
 *
 * Two segments rather than the three it carried as v2's boundary bar. The
 * question this calendar asks of a day is how much of its backlog it cleared,
 * which is a ratio with two sides: completed at the base, and everything that
 * had not completed by the day's end -- still open or removed alike -- in the
 * highlighter yellow above it. The three-way split is not lost, only
 * moved: the hover readout still breaks the yellow into removed and still
 * active.
 *
 * Two flat colours, bright red on highlighter yellow: at this width the
 * reading is where the boundary between them falls, and the loudest pair the
 * calendar has is what makes that boundary findable at a glance across a
 * month. The completed segment was once coloured by its own size as well, on
 * the queue line's ramp, which said the ratio a second time at the cost of
 * eight colours to learn.
 *
 * Calendar v1 draws the same quantity as the cell's ground instead; see
 * TileRatioBar.
 */
export default function TileOutcomeBar({ outcome, day, nextDay, onHoverScale }: TileOutcomeBarProps) {
  const [hovered, setHovered] = useState(false);
  const cleanSweep = isCleanSweep(outcome);
  const share = completionShare(outcome);
  const notCompleted = outcome.inPlay - outcome.completed;

  // The readout keeps v2's three-way split: the bar merges removed into "not
  // completed", and this is where that detail goes rather than being dropped.
  const rows: ReadoutRow[] = OUTCOME_ORDER_TOP_DOWN.filter((state) => outcome[state] > 0).map(
    (state) => ({
      label: OUTCOME_STYLES[state].label.toLowerCase(),
      // Completed takes the bar's own red, so the swatch in the readout is the
      // segment the reader is pointing at rather than the teal the rest of the
      // page uses for the same state.
      color: state === "completed" ? RATIO_COMPLETED_COLOR : OUTCOME_STYLES[state].color,
      value: outcome[state],
      share: outcome.inPlay > 0 ? (outcome[state] / outcome.inPlay) * 100 : null,
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
              ? `Jobs ${formatDayShort(day)} had in hand · by midnight`
              : `Jobs ${formatDayShort(day)} had in hand · by its end`
          }
          subtitle={`${Math.round(share * 100)}% of ${outcome.inPlay.toLocaleString()} completed before the day ended`}
          rows={rows}
          footer={[
            ...(cleanSweep
              ? ["A clean sweep: every job the day held completed before it ended."]
              : []),
            "The yellow half of the bar is everything above that had not completed: removed and still active together.",
            "The jobs already open when the day began plus everything placed during it: every job the day could have finished.",
          ]}
        />
      }
    >
      <Box
        role="img"
        aria-label={`Of ${outcome.inPlay.toLocaleString()} jobs ${formatDayShort(day)} had open or took on: ${outcome.completed.toLocaleString()} completed, ${notCompleted.toLocaleString()} had not completed when the day ended (${outcome.removed.toLocaleString()} removed, ${outcome.active.toLocaleString()} still active)`}
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
          // Completed at the base, the unfinished remainder above it.
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
        <Box
          sx={{
            flexGrow: outcome.completed,
            flexBasis: 0,
            backgroundColor: RATIO_COMPLETED_COLOR,
          }}
        />
        <Box
          sx={{
            flexGrow: notCompleted,
            flexBasis: 0,
            backgroundColor: RATIO_UNFINISHED_COLOR,
          }}
        />
        {/* The clean-sweep mark: a star at the top of a bar that is all
            completed, on a paper disc so it reads against the red. */}
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
            <Star sx={{ fontSize: STAR_DISC - 2, color: RATIO_COMPLETED_COLOR }} />
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
