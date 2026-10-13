"use client";

import { Box } from "@mui/material";

import { formatDayShort, type DayOutcome } from "./dayCards";
import { COMPLETION_FILL_HATCH, ratioCompletedColor } from "./palette";

interface TileRatioBarProps {
  outcome: DayOutcome;
  /** The day the ground belongs to, for the accessible description. */
  day: string;
}

/** Share of the jobs the day had in hand that completed during it, 0-1. */
export function completionShare(outcome: DayOutcome): number {
  if (outcome.inPlay <= 0) return 0;
  return Math.min(1, Math.max(0, outcome.completed / outcome.inPlay));
}

/**
 * The end-of-day ratio as a cell ground, on calendar v1: a translucent field
 * rising from the tile's floor to the share of the day's jobs that completed
 * before it ended. The denominator is everything the day could have finished --
 * what was open when it began plus what was placed into it during the day --
 * so a day that inherited 200 jobs, took on 200 more and finished 100 is
 * filled to a quarter height. Work placed in the morning and finished by the
 * evening counts on both sides of the ratio rather than on neither.
 *
 * The field is also coloured by that same share, on the queue line's ramp (see
 * ratioCompletedColor): cool blue for a day that barely moved its workload,
 * through green and orange as the share climbs, to brilliant purple for a day
 * that finished essentially all of it. Height and colour say one thing twice,
 * so a month reads for purple without reading any single waterline.
 *
 * At 100% -- every job the day held finished -- the field also picks up a fine
 * diagonal hatch. The top of the ramp is a gradient, so a cleared day and a
 * nearly cleared one are neighbouring purples; the stripes give that one
 * reading a hard edge, and v2 marks the same day with a star on its column.
 *
 * One field and one waterline, rather than painting the remainder too: the
 * tile is already carrying six bars, a queue line and two numbers, and a second
 * field behind them costs more legibility than the explicit denominator buys.
 * The baseline rule across the bar slot (see TileBaseline) is what the height is
 * read against. v2 paints both sides, as a column astride midnight where there
 * is no bare tile to mean "the rest"; see TileOutcomeBar.
 *
 * Non-interactive, and underneath everything: the bars and the midnight dot
 * keep the hover readouts, and the number behind the ground is in the
 * click-through day dialog. It spans the whole tile, border to border, rather
 * than the bar slot -- being a share it has no height of its own to keep to.
 */
export default function TileRatioBar({ outcome, day }: TileRatioBarProps) {
  const share = completionShare(outcome);
  const percent = Math.round(share * 100);
  // Every job the day held finished. The share is clamped, so this is an exact
  // comparison rather than a tolerance: completed === inPlay and nothing was
  // removed or left open.
  const cleared = share >= 1;

  return (
    <Box
      className="day-fill"
      role="img"
      aria-label={
        cleared
          ? `Every one of the ${outcome.inPlay.toLocaleString()} jobs ` +
            `${formatDayShort(day)} had open or took on completed during it`
          : `${percent}% of the ${outcome.inPlay.toLocaleString()} jobs ` +
            `${formatDayShort(day)} had open or took on completed during it`
      }
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        // Rounded to three decimals: a hydration-safe style string, as in
        // TileActivityBars.
        height: `${(share * 100).toFixed(3)}%`,
        backgroundColor: ratioCompletedColor(share),
        // A cleared day is also striped; see COMPLETION_FILL_HATCH.
        backgroundImage: cleared ? COMPLETION_FILL_HATCH : "none",
        // Below the level trace (a positioned sibling at the same z-index that
        // comes later in the DOM) and the day body above it.
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
