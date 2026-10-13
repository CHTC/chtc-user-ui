"use client";

import { Box, Stack, Typography } from "@mui/material";

import {
  COMPLETION_FILL_HATCH,
  LEVEL_SLOPE_STOPS,
  ratioCompletedColor,
  RATIO_COMPLETED_COLOR,
  RATIO_UNFINISHED_COLOR,
} from "./palette";
import type { CalendarVersion } from "./VersionSwitch";

/** Swatch plus caption, the shape both keys below are built from. */
function Swatch({ color, label, hatch }: { color: string; label: string; hatch?: boolean }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
      <Box
        aria-hidden
        sx={{
          width: 22,
          height: 10,
          borderRadius: "2px",
          flexShrink: 0,
          backgroundColor: color,
          backgroundImage: hatch ? COMPLETION_FILL_HATCH : "none",
          border: "1px solid",
          borderColor: "divider",
        }}
      />
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
    </Stack>
  );
}

/**
 * The key to the end-of-day ratio, in whichever of its two forms this calendar
 * draws.
 *
 * On v1 the ratio is the cell's ground, and its colour is a scale rather than
 * a colour: the field rises to the completed share and is painted by that same
 * share on the queue line's own ramp (LEVEL_SLOPE_STOPS), so the ground and the
 * trace over it agree on what purple means -- the far end of the scale. The
 * ramp is read linearly here, unlike the line's log scale, so the strip's stops
 * sit where their shares land: its midpoint is a day that finished about half
 * the jobs it had in hand. Drawn at full strength, though the ground is translucent: a key
 * is read on its own, not under a tile's worth of bars. The hatch at the top
 * of that scale gets a swatch of its own, since a stripe is not something a
 * gradient strip can show.
 *
 * On v2 it is a column with both sides painted, so the key names both: bright
 * red for the part that completed, highlighter yellow for the part that did
 * not. Both at full strength, as the column draws them -- a key is read on its
 * own, not under a tile's worth of bars.
 */
export default function RatioLegend({ variant }: { variant: CalendarVersion }) {
  return (
    <Box sx={{ mt: 1.5 }}>
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", display: "block", fontWeight: 700 }}
      >
        The end-of-day ratio
      </Typography>

      {variant === "v1" ? (
        <>
          <Box sx={{ mt: 0.75 }}>
            <Box
              aria-hidden
              sx={{
                height: 8,
                borderRadius: 4,
                background: `linear-gradient(to right, ${LEVEL_SLOPE_STOPS.join(", ")})`,
              }}
            />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.35 }}>
              <Typography variant="caption" sx={{ fontSize: "0.65rem", lineHeight: 1.2, opacity: 0.8 }}>
                0% completed
              </Typography>
              <Typography variant="caption" sx={{ fontSize: "0.65rem", lineHeight: 1.2, opacity: 0.8 }}>
                100% completed
              </Typography>
            </Box>
          </Box>
          <Swatch
            color={ratioCompletedColor(1)}
            hatch
            label="Striped: the day finished every job it held"
          />
          <Swatch color="transparent" label="Still to do: the bare cell above it" />
        </>
      ) : (
        <>
          <Swatch color={RATIO_COMPLETED_COLOR} label="Completed by the day's end" />
          <Swatch color={RATIO_UNFINISHED_COLOR} label="Not completed: removed or still open" />
        </>
      )}
    </Box>
  );
}
