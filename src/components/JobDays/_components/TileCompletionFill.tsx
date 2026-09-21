"use client";

import { Box } from "@mui/material";

import { formatDayShort, type DayOutcome } from "./dayCards";
import { COMPLETION_FILL_COLOR } from "./palette";

interface TileCompletionFillProps {
  outcome: DayOutcome;
  /** The day the fill belongs to, for the accessible description. */
  day: string;
}

/** Share of the day's opening jobs that completed during it, 0-1. */
export function completionShare(outcome: DayOutcome): number {
  if (outcome.opening <= 0) return 0;
  return Math.min(1, Math.max(0, outcome.completed / outcome.opening));
}

/**
 * Calendar v1's completion fill: a translucent teal ground that rises from the
 * tile's floor to the share of the jobs open when the day began that completed
 * during it. A day that started with 200 jobs and finished 100 of them is filled
 * to half height, whatever else was placed meanwhile.
 *
 * It is the same population v2's boundary bar answers for (see DayOutcome), but
 * drawn as the whole cell's background so a month scans as a field of rising
 * tide marks: a full tile is a day that cleared its backlog, an empty one a day
 * where nothing it inherited finished.
 *
 * Non-interactive, and underneath everything: the bars and the midnight dot
 * keep the hover readouts, and the fill's own number is in the click-through
 * day dialog. It spans the whole tile, border to border, rather than the bar
 * slot -- being a share it has no height of its own to keep to.
 */
export default function TileCompletionFill({ outcome, day }: TileCompletionFillProps) {
  const share = completionShare(outcome);
  const percent = Math.round(share * 100);

  return (
    <Box
      className="day-fill"
      role="img"
      aria-label={`${percent}% of the ${outcome.opening.toLocaleString()} jobs open as ${formatDayShort(day)} began completed during it`}
      sx={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        // Rounded to three decimals: a hydration-safe style string, as in
        // TileActivityBars.
        height: `${(share * 100).toFixed(3)}%`,
        backgroundColor: COMPLETION_FILL_COLOR,
        // Below the level trace (a positioned sibling at the same z-index that
        // comes later in the DOM) and the day body above it.
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
