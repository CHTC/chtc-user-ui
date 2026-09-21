"use client";

import { Box, Typography } from "@mui/material";

import { LEVEL_SLOPE_STOPS } from "./palette";

/**
 * The trace's colour scale, as small as it can be read: two words over a strip
 * of the ramp. Sits at the foot of the midnight dot's readout, so the reader
 * who is wondering what the line's colours mean finds out where they are
 * already looking, without a legend taking up room on the calendar itself.
 *
 * The strip spaces the stops evenly; the ramp is log-scaled in use, so this
 * shows the order of the colours rather than where a given slope lands.
 */
export default function SlopeLegend() {
  return (
    <Box sx={{ mt: 1, pt: 0.75, borderTop: "1px solid", borderColor: "divider" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.35 }}>
        <Typography variant="caption" sx={{ fontSize: "0.65rem", lineHeight: 1.2, opacity: 0.8 }}>
          No change
        </Typography>
        <Typography variant="caption" sx={{ fontSize: "0.65rem", lineHeight: 1.2, opacity: 0.8 }}>
          Rapid change
        </Typography>
      </Box>
      <Box
        aria-hidden
        sx={{
          height: 6,
          borderRadius: 3,
          background: `linear-gradient(to right, ${LEVEL_SLOPE_STOPS.join(", ")})`,
        }}
      />
    </Box>
  );
}
