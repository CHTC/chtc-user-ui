"use client";

import { useState } from "react";
import { Box, Tooltip } from "@mui/material";

import type { BarScale } from "../types";
import { barFraction, type BinActivity, type ScaleKind } from "./binModel";
import BinReadout, { READOUT_PLACEMENT, READOUT_SLOT_PROPS, type ReadoutRow } from "./BinReadout";
import {
  ACTIVITY_STACK,
  ACTIVITY_STYLES,
  describeActivity,
  stackOrder,
  type ActivityState,
} from "./palette";

/**
 * "1,200 placed and 30 removed", or null when nothing hidden happened: the
 * states the bars are not showing, with their counts, so the readout still
 * says what else moved in the window.
 */
export function otherChanges(bin: BinActivity, shown: ActivityState[]): string | null {
  const parts = ACTIVITY_STACK.filter((state) => !shown.includes(state) && bin[state] > 0).map(
    (state) => `${bin[state].toLocaleString()} ${ACTIVITY_STYLES[state].label.toLowerCase()}`,
  );
  return parts.length > 0 ? parts.join(" and ") : null;
}

/**
 * The mark drawn above a bar for a hidden state that moved in its window: a
 * plus for arrivals, a minus for removals. Clicking one adds that state to the
 * bars. Completions get no mark -- they are what the bars are for, and a
 * reader who switched them off did so on purpose.
 */
const HIDDEN_GLYPH: Partial<Record<ActivityState, string>> = {
  placed: "+",
  removed: "−",
};

/**
 * Headroom every column keeps above its bar for the marks, whether or not it
 * has any to draw: the glyph's line plus the gap under it. The bar's height is
 * a share of the column *below* this headroom, so a full-height bar with a
 * plus over it reaches exactly as high as a full-height bar without one. Were
 * the marks simply stacked on top, the column would have to shrink a marked
 * bar to fit them, and the days that had the most going on would read shorter.
 */
const GLYPH_LINE = 11;
const GLYPH_GAP = 1;
export const GLYPH_HEADROOM = GLYPH_LINE + GLYPH_GAP;

/** The marked states hidden from the bars that actually moved in this bin, in stacking order. */
function hiddenWithCounts(bin: BinActivity, shown: ActivityState[]): ActivityState[] {
  return ACTIVITY_STACK.filter(
    (state) => HIDDEN_GLYPH[state] !== undefined && !shown.includes(state) && bin[state] > 0,
  );
}

interface TileActivityBarsProps {
  bins: BinActivity[];
  /**
   * The tallest bin count in scope: the visible grid, or the picked range, or
   * under per-day scaling the day itself. Every bar in a tile scales against
   * the same peak, so bar heights compare on one shared scale.
   */
  peakBinTotal: number;
  scale: BarScale;
  height: number;
  /** The day the bars belong to, for the hover readout's title. */
  dayLabel: string;
  /** Accessible description; the graphic is one image. */
  label: string;
  /** Which states the bars stack; the rest are quoted in the readout. */
  shown: ActivityState[];
  /**
   * The reader clicked the glyph above a bar for a hidden state: add it to the
   * bars, page-wide. The tile has no room for a toggle of its own, but a
   * hidden count is exactly where the reader will want to turn it on.
   */
  onShow?: (state: ActivityState) => void;
  /**
   * Reports which of the calendar's two scales the pointer is over, so the axis
   * that governs these bars can light up while they are hovered.
   */
  onHoverScale?: (kind: ScaleKind | null) => void;
}

/**
 * The calendar-tile variant of the magnitude chart: six count-scaled columns,
 * colour only. Plain divs rather than a Chart.js canvas: a month renders ~30 of
 * these and flexbox needs no per-tile chart lifecycle. The column heights carry
 * the signal, under whichever scale the page is set to (see barFraction, and
 * ScaleInfo.tsx for what each one costs).
 *
 * Each column gets a full-height hit area so an idle 4-hour window is still
 * hoverable and can say so.
 */
export default function TileActivityBars({
  bins,
  peakBinTotal,
  scale,
  height,
  dayLabel,
  label,
  shown,
  onShow,
  onHoverScale,
}: TileActivityBarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const bin = hovered === null ? null : bins[hovered];
  const peak = Math.max(peakBinTotal, 1);
  const order = stackOrder(shown);

  const enter = (index: number) => {
    setHovered(index);
    onHoverScale?.("activity");
  };
  const leave = () => {
    setHovered(null);
    onHoverScale?.(null);
  };

  const rows: ReadoutRow[] = bin
    ? order
        .filter((state) => bin[state] > 0)
        .map((state) => ({
          label: `jobs ${state}`,
          color: ACTIVITY_STYLES[state].color,
          value: bin[state],
          share: bin.total > 0 ? (bin[state] / bin.total) * 100 : null,
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
            title={`${dayLabel} · ${bin.label} h`}
            subtitle={
              bin.total > 0
                ? `${bin.total.toLocaleString()} ${bin.total === 1 ? "job" : "jobs"} ${describeActivity(shown)}`
                : undefined
            }
            rows={rows}
            footer={[
              ...(bin.total === 0 ? [`Nothing ${describeActivity(shown)} in this window.`] : []),
              ...(otherChanges(bin, shown)
                ? [`${otherChanges(bin, shown)}; not in the bar. Click the mark above it to add them.`]
                : []),
            ]}
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
        sx={{ display: "flex", gap: "2px", width: "100%", height, alignItems: "flex-end" }}
      >
        {bins.map((entry, i) => (
          <Box
            key={i}
            onMouseEnter={() => enter(i)}
            // Full-height hit area; the bar itself sits at the bottom of it.
            // The top padding is the marks' reserved headroom, kept on every
            // column: the bar's percentage height resolves against the content
            // box, so the same share is the same pixel height on a marked and
            // an unmarked column alike.
            sx={{
              flex: 1,
              minWidth: 0,
              height: "100%",
              boxSizing: "border-box",
              pt: `${GLYPH_HEADROOM}px`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              opacity: hovered === null || hovered === i ? 1 : 0.55,
            }}
          >
            {/* The bar's extent, which the marks hang off: a positioned box so
                they can sit just above the bar's top, in the headroom, without
                taking any of its height. */}
            <Box
              sx={{
                position: "relative",
                // Rounded to three decimals on purpose. Math.log10 is only
                // implementation-approximated, so Node and the browser can
                // disagree in the last bits of a float -- enough to emit two
                // different style strings for the same bar and trip a hydration
                // mismatch. Three decimals is far finer than a pixel.
                height: `${(barFraction(entry.total, peak, scale) * 100).toFixed(3)}%`,
                // A bin with any activity at all stays visible even when it
                // rounds to under a pixel against the scope's peak.
                minHeight: entry.total > 0 ? 2 : 0,
                // Never squeezed to make room for anything else in the column:
                // the headroom above already is that room.
                flexShrink: 0,
              }}
            >
              {/* Marks for what moved here but is not in the bar, sitting just
                  above it, side by side when there is more than one. Plain
                  spans, not buttons: the tile is itself a button, and a button
                  may not contain another. The toolbar toggle is the keyboard
                  route to the same thing. */}
              {hiddenWithCounts(entry, shown).length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `calc(100% + ${GLYPH_GAP}px)`,
                    height: `${GLYPH_LINE}px`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-end",
                    gap: "2px",
                  }}
                >
                  {hiddenWithCounts(entry, shown).map((state) => (
                    <Box
                      key={state}
                      component="span"
                      title={`${entry[state].toLocaleString()} ${ACTIVITY_STYLES[state].label.toLowerCase()}, not in the bar — click to add`}
                      onClick={(event) => {
                        // Not a click on the day: do not open its dialog.
                        event.stopPropagation();
                        onShow?.(state);
                      }}
                      // Nor the start of a range drag.
                      onMouseDown={(event) => event.stopPropagation()}
                      sx={{
                        fontSize: `${GLYPH_LINE}px`,
                        lineHeight: `${GLYPH_LINE}px`,
                        fontWeight: 700,
                        color: ACTIVITY_STYLES[state].color,
                        cursor: onShow ? "pointer" : "default",
                        userSelect: "none",
                        "&:hover": { transform: "scale(1.3)" },
                        transition: "transform 80ms",
                      }}
                    >
                      {HIDDEN_GLYPH[state]}
                    </Box>
                  ))}
                </Box>
              )}
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column-reverse",
                  borderRadius: "1px",
                  overflow: "hidden",
                }}
              >
                {entry.total > 0 &&
                  order.map((state) => (
                    <Box
                      key={state}
                      sx={{
                        flexGrow: entry[state],
                        flexBasis: 0,
                        backgroundColor: ACTIVITY_STYLES[state].color,
                      }}
                    />
                  ))}
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Tooltip>
  );
}
