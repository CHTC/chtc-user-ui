"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import Close from "@mui/icons-material/Close";

import { barFraction, buildScaleTicks, type DayLevel } from "./binModel";
import { compactNumber } from "./dayCards";
import { otherChanges } from "./TileActivityBars";
import { daySlope, slopeLines } from "./TileLevelLine";
import {
  ACTIVITY_STYLES,
  DEFAULT_BARS,
  stackOrder,
  BAR_STATE_STYLES,
  CARRIED_ACTIVE_COLOR,
  ratioCompletedColor,
  LEVEL_DOT_COLOR,
  RATIO_UNFINISHED_COLOR,
  RATIO_COMPLETED_COLOR,
  TILE_BASELINE_COLOR,
  levelSegments,
  levelSlopeColor,
} from "./palette";
import QueueGlyph from "./QueueGlyph";
import RatioLegend from "./RatioLegend";
import SlopeLegend from "./SlopeLegend";
import type { CalendarVersion } from "./VersionSwitch";

/**
 * Which part of the example cell a feature is about. Several features point at
 * the bars, so emphasis is expressed per part rather than per feature.
 */
type Part = "date" | "axis" | "bars" | "baseline" | "caption" | "queue" | "queueAxis" | "fill";

type FeatureId =
  | "date"
  | "windows"
  | "colour"
  | "baseline"
  | "height"
  | "hover"
  | "queue"
  | "fill"
  | "caption";

interface Feature {
  id: FeatureId;
  title: string;
  body: string;
  /** Parts of the example that stay lit while this feature is hovered. */
  parts: Part[];
}

/**
 * The features of a calendar cell, ordered by what a reader needs first.
 *
 * Orientation before structure, structure before encoding, and within the
 * encoding "what happened" before "how much" -- you have to know what you are
 * looking at before its size means anything. Then the escape hatch (hover for the
 * real numbers), then the marks that are not bars, and finally the caption,
 * which only matters once the rest has landed.
 */
const FEATURES: Feature[] = [
  {
    id: "date",
    title: "One cell is one day",
    body: "Click anywhere in it to open that day in full — its cohort, its charts, and its exact counts.",
    parts: ["date"],
  },
  {
    id: "windows",
    title: "Six bars, six 4-hour windows",
    body: "Midnight on the left through to midnight on the right, so you can see when in the day the work got done. An empty slot is a window in which nothing completed.",
    parts: ["bars"],
  },
  {
    id: "colour",
    title: "The bars are jobs completed",
    body: "Each bar is the jobs that completed in its window, in teal. Placements and removals are not in the bars unless you add them: a small blue + above a bar means jobs were placed in that window, a red − that some were removed, and clicking either adds that kind to every bar, as the “Bars show” toggle above the calendar does. On the line, a placement is a jump up and a removal a drop with no bar under it. Hover a bar for every count.",
    parts: ["bars"],
  },
  {
    id: "baseline",
    title: "The hairline is zero",
    body: "Every bar stands on it, and it runs edge to edge across each cell at the same height on every day. It is the floor of the slot the marks are drawn in, so a short bar can be told from a tall one that happens to sit low, and the ratio can be read as it moves rather than guessed at from where the shortest bar stops.",
    parts: ["baseline", "bars"],
  },
  {
    id: "height",
    title: "Height is how much happened",
    body: "Every bar on the month is scaled against the busiest single window in it. The numbers down the left of each row say what those heights are worth in state changes. One heavy day flattens the rest, so drag across a run of days — or shift-click — to scale everything to just those days; the others go grey until you press Escape.",
    parts: ["axis", "bars"],
  },
  {
    id: "hover",
    title: "Hover a bar for the numbers",
    body: "The bars are deliberately small and unlabelled — a month of them is a shape you scan. Hovering one gives its exact counts, and lights up the scale it is measured against.",
    parts: ["bars", "axis"],
  },
  {
    id: "queue",
    title: "The line behind the bars is the queue",
    body: "How many jobs were open at the close of each window — the queue as a level, not the changes to it. It steps down as work finishes, jumps when a batch lands, and runs straight on into the next day so a week reads as one line. Its colour says how fast it is moving, on the scale a rain map uses: light blue only where the queue is perfectly flat, blue and green as it starts to move, yellow and orange as it speeds up, red where it drops or climbs steeply, and purple where it moves the whole height of the cell in one window, whichever way. The dot on the midnight boundary is coloured by the day's average slope, and on hover gives the queue's numbers, that average rate, and when the queue would empty if it held. Where the queue reaches zero the line simply stops, and a day that ends with nothing open has no dot at all — an empty queue is not a low one, and a line along the floor would read as one. Being a headcount rather than a count of changes, it is measured against its own scale, down the right under the stacked glyph.",
    parts: ["queue", "queueAxis"],
  },
  {
    id: "fill",
    title: "The ground is the day's end-of-day ratio",
    body: "Of every job this day had in hand — open when it began, plus everything placed into it during the day — how many had completed by the time it ended. The ground rises from the floor of the cell to that share, so a day that finished all its work is filled to the top and a day that finished none of it is bare. A day with nothing in hand has no ground at all. The ground is also coloured by its own size, on the same ramp the queue line uses: cool blue for a day that barely touched its workload, through green and orange as the share climbs, to brilliant purple for a day that finished essentially all of it — so a cleared day is purple to the top. A day that finished every job it held is striped as well as purple, because the top of the ramp is a gradient and 96% and 100% are otherwise neighbouring shades. What is left undone is the plain cell above the waterline rather than a colour of its own: the cell is already carrying six bars, a queue line and two numbers, and one field behind them is as much as stays legible. Its numbers are in the day's full breakdown, one click away.",
    parts: ["fill"],
  },
  {
    id: "caption",
    title: "The caption counts jobs",
    body: "Distinct jobs that changed state that day. A job that did two things still counts once, which is why this rarely matches the bars added up.",
    parts: ["caption"],
  },
];

/**
 * Calendar v2 scales each day's bars to that day's own busiest window, drops
 * the queue line, and redraws the inheritance mark: a column with both sides
 * of the ratio painted, in two flat colours.
 */
const V2_FILL_FEATURE: Feature = {
  id: "fill",
  title: "The column on midnight is the day's end-of-day ratio",
  body:
    "Of every job this day had in hand — open when it began, plus everything placed into it " +
    "during the day — how many had completed by the time it ended, as a single stacked column " +
    "straddling the midnight boundary, so it reads as the close of the day rather than a " +
    "seventh bar. Completed is at its base, in bright red; above that, in highlighter yellow, " +
    "is everything that had not completed when the day closed, removed and still open " +
    "together. A day with nothing in hand — or nothing at all happening — has no " +
    "column. Two flat colours and " +
    "nothing else: at this width the reading is where the boundary between them falls, and red " +
    "on yellow is the loudest pair on the calendar to find it by — a star on top of a full " +
    "column marks a clean sweep. Hover it for the counts, including the yellow split back into " +
    "removed and still active.",
  parts: ["fill"],
};

/**
 * v2 draws no queue line, so the two cards that lean on it are rewritten and
 * the card about the line itself is dropped. Its height card sends the reader
 * to the hover readout rather than to an axis, there being neither: the left
 * one goes with the shared scale and the right one with the line.
 */
const V2_HEIGHT_FEATURE: Feature = {
  id: "height",
  title: "Height is how much happened — within the day",
  body: "On this calendar every day is its own chart: its tallest bar reaches the top of the cell whatever its count. So the shape of a day is always legible, even a quiet one, but two days' bars cannot be compared by height — hover a bar for its count. There is no axis down either side; what a height is worth is in the hover readout.",
  parts: ["bars"],
};

const V2_COLOUR_FEATURE: Feature = {
  id: "colour",
  title: "The bars are jobs completed",
  body: "Each bar is the jobs that completed in its window, in teal. Placements and removals are not in the bars unless you add them: a small blue + above a bar means jobs were placed in that window, a red − that some were removed, and clicking either adds that kind to every bar, as the “Bars show” toggle above the calendar does. Hover a bar for every count, whether it is in the bar or not.",
  parts: ["bars"],
};

/**
 * The feature list for one calendar version: v2 takes its own height and
 * bar-colour cards, swaps the ratio card for the column's, and drops the cards
 * for the two things it does not draw: the queue line and the caption.
 */
function featuresFor(variant: CalendarVersion): Feature[] {
  if (variant === "v1") return FEATURES;
  // The caption card goes with the caption: v2's bars take that line, and the
  // counts it carried are in the hover readout.
  return FEATURES.filter((feature) => feature.id !== "queue" && feature.id !== "caption").map((feature) => {
    if (feature.id === "height") return V2_HEIGHT_FEATURE;
    if (feature.id === "colour") return V2_COLOUR_FEATURE;
    if (feature.id === "fill") return V2_FILL_FEATURE;
    return feature;
  });
}

/** The made-up day the example draws: a quiet morning, a busy afternoon. */
const EXAMPLE_BINS = [
  { label: "00–04", placed: 0, completed: 0, removed: 0 },
  { label: "04–08", placed: 1200, completed: 0, removed: 0 },
  { label: "08–12", placed: 400, completed: 900, removed: 0 },
  { label: "12–16", placed: 0, completed: 2600, removed: 300 },
  { label: "16–20", placed: 0, completed: 1100, removed: 0 },
  { label: "20–24", placed: 0, completed: 200, removed: 0 },
];

/** Bar heights: completions per window. Placements and removals are on the line, not in the bars. */
const EXAMPLE_TOTALS = EXAMPLE_BINS.map((bin) => bin.completed);
const EXAMPLE_PEAK = Math.max(...EXAMPLE_TOTALS);
/** The bar the colour and hover features point at: the tallest, with a removal beside it to quote. */
const FOCUS_BIN = 3;
/** That bar as the model would hand it to a readout, under the default pick. */
const EXAMPLE_FOCUS_BIN = { ...EXAMPLE_BINS[FOCUS_BIN], total: EXAMPLE_TOTALS[FOCUS_BIN] };

const SLOT_HEIGHT = 150;
const GUTTER = 46;

/**
 * The open-jobs level through the example day: what was in the queue at
 * midnight, then the balance after each window, exactly as buildDayLevels
 * would compute it from the bins above.
 */
const EXAMPLE_LEVEL_START = 3800;
const EXAMPLE_LEVELS = EXAMPLE_BINS.reduce<number[]>((acc, bin) => {
  const prev = acc.length ? acc[acc.length - 1] : EXAMPLE_LEVEL_START;
  acc.push(Math.max(0, prev + bin.placed - bin.completed - bin.removed));
  return acc;
}, []);
const EXAMPLE_LEVEL_END = EXAMPLE_LEVELS[EXAMPLE_LEVELS.length - 1];
/** The example day as a key, so the dot's projected empty time can be dated. */
const EXAMPLE_DAY = "2026-08-12";
/** The example's level in the shape the real dot reads its slope from. */
const EXAMPLE_LEVEL: DayLevel = { start: EXAMPLE_LEVEL_START, ends: EXAMPLE_LEVELS, hasData: true };
/** The queue scale's peak: the highest the level reached, as the calendar does per month. */
const EXAMPLE_LEVEL_PEAK = Math.max(EXAMPLE_LEVEL_START, ...EXAMPLE_LEVELS);
const EXAMPLE_LEVEL_TICKS = buildScaleTicks(EXAMPLE_LEVEL_PEAK, "linear");
/**
 * The example trace's segments, coloured by steepness exactly as a real tile
 * colours its own. The example is linear, the page's default.
 */
const EXAMPLE_LEVEL_SEGMENTS = levelSegments(
  [EXAMPLE_LEVEL_START, ...EXAMPLE_LEVELS].map((level) => ({
    value: level,
    y: Number(
      (SLOT_HEIGHT - barFraction(level, EXAMPLE_LEVEL_PEAK, "linear") * SLOT_HEIGHT).toFixed(2),
    ),
  })),
  SLOT_HEIGHT,
);
/** What the midnight census would say, to match the real dot's readout. */
const EXAMPLE_QUEUE = { carried: 120, fromToday: 180 };

/** Width the example reserves for the queue scale hanging off its right. */
const RIGHT_GUTTER = 56;

/** The example cell's own padding, in px, so the slot can cancel it exactly. */
const CELL_PAD = 12;

/** Reserved row below the slot for the hour labels; see ExampleCell. */
const HOUR_ROW = 14;

/** The activity scale's ticks, from the same peak the example's bars use. */
const EXAMPLE_ACTIVITY_TICKS = buildScaleTicks(EXAMPLE_PEAK, "linear");

/**
 * The share of the example day's 3,800 jobs that completed, for the fill: the
 * jobs it opened with and the ones placed into it during the day, each ending
 * the day completed, removed or still open.
 */
const EXAMPLE_OUTCOME = { active: 300, completed: 3200, removed: 300 };
const EXAMPLE_OUTCOME_TOTAL = EXAMPLE_OUTCOME.active + EXAMPLE_OUTCOME.completed + EXAMPLE_OUTCOME.removed;

interface CellGuideDialogProps {
  /** Which calendar the guide explains; the cells differ only in how the bars are scaled. */
  variant?: CalendarVersion;
  open: boolean;
  /**
   * Closing is what dismisses the guide for good -- there is no checkbox to tick.
   * The reader who has read it should not have to say so twice, and the button
   * under the calendar brings it back whenever they want it.
   */
  onClose: () => void;
}

/**
 * The "how to read a cell" dialog the page opens with.
 *
 * A calendar tile packs six stacked bars, a height scale, and a caption into
 * about 150 by 130 pixels. That density is the point -- it is what lets a month
 * be one glance -- but it means nothing on the tile has room to label itself. So
 * the labelling happens once, here, against an oversized example: the reader
 * hovers a feature on the left and sees exactly which part of the cell it means
 * light up on the right.
 */
export default function CellGuideDialog({ variant = "v1", open, onClose }: CellGuideDialogProps) {
  const [active, setActive] = useState<FeatureId | null>(null);
  const features = featuresFor(variant);
  const feature = features.find((f) => f.id === active) ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Typography
          component="span"
          variant="h6"
          sx={{ fontWeight: 700, display: "block" }}
        >
          How to read a day in the calendar
        </Typography>
        <Typography
          component="span"
          variant="caption"
          sx={{ color: "text.secondary" }}
        >
          hover anything on the left to find it on the right
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={{ xs: 2.5, md: 3 }}
        >
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            {features.map((entry) => (
              <FeatureCard
                key={entry.id}
                feature={entry}
                active={active === entry.id}
                onActivate={() => setActive(entry.id)}
                onDeactivate={() => setActive(null)}
              />
            ))}
          </Stack>

          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: 340 },
              // Sticks alongside the list, so a feature low down still has the
              // example in view when it lights up.
              position: { md: "sticky" },
              top: { md: 8 },
              alignSelf: "flex-start",
            }}
          >
            <ExampleCell active={feature} variant={variant} />
            {/* Every version reports the ratio, so every version needs its
                key -- one colour on v1, a scale on v2. */}
            <RatioLegend variant={variant} />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Reopen this any time from &ldquo;How to read a day&rdquo; under the calendar.
        </Typography>
        <Button variant="contained" onClick={onClose}>
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Swatch plus text, matching the real readout's shape. */
function ReadoutLine({ color, text }: { color: string; text: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "2px",
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <Typography variant="caption">{text}</Typography>
    </Stack>
  );
}

function FeatureCard({
  feature,
  active,
  onActivate,
  onDeactivate,
}: {
  feature: Feature;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <Box
      // Focusable as well as hoverable: the highlight is the explanation, so it
      // cannot be mouse-only.
      tabIndex={0}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
      sx={{
        p: 1.25,
        borderRadius: 1,
        border: "1px solid",
        borderColor: active ? "primary.main" : "divider",
        backgroundColor: active ? "action.hover" : "transparent",
        cursor: "default",
        transition: "border-color 120ms, background-color 120ms",
      }}
    >
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {feature.title}
      </Typography>
      <Typography
        variant="caption"
        component="p"
        sx={{ color: "text.secondary", mt: 0.25 }}
      >
        {feature.body}
      </Typography>
    </Box>
  );
}

/**
 * An oversized calendar cell, built from the same palette and the same height
 * maths as the real thing so nothing here can teach the reader something the
 * calendar does not do.
 */
function ExampleCell({
  active,
  variant,
}: {
  active: Feature | null;
  variant: CalendarVersion;
}) {
  const share = EXAMPLE_OUTCOME.completed / EXAMPLE_OUTCOME_TOTAL;
  // v2 draws no queue line, so the example drops the trace, its dot and the
  // scale that labels them -- and the gutter it all hung in.
  const showLine = variant === "v1";
  const lit = (part: Part) => !active || active.parts.includes(part);
  // Two features single out one bar; the rest treat the row as a whole.
  const focusOneBar = active?.id === "colour" || active?.id === "hover";

  const dim = (part: Part) => ({
    opacity: lit(part) ? 1 : 0.25,
    transition: "opacity 140ms",
  });

  const ring = (part: Part) => ({
    outline: active && active.parts.includes(part) ? "2px solid" : "2px solid transparent",
    outlineColor: active && active.parts.includes(part) ? "primary.main" : "transparent",
    outlineOffset: "3px",
    borderRadius: "3px",
    transition: "outline-color 140ms",
  });

  return (
    <Box>
      {/* Both scales hang outside the cell, as they do on a real row, so the
          wrapper reserves their width on either side. */}
      <Box sx={{ pl: `${GUTTER}px`, pr: `${showLine ? RIGHT_GUTTER : 16}px` }}>
        <Box
          sx={{
            position: "relative",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            backgroundColor: "background.paper",
            p: `${CELL_PAD}px`,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {/* The end-of-day ratio. On v1 it is the cell's ground, drawn first
              so everything else paints over it, as on a real tile; on v2 it is
              the column astride the right-hand boundary. Its height is the
              example's completed share of the jobs the day had in hand. */}
          {variant === "v2" ? (
            <Box
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                transform: "translateX(50%)",
                width: 16,
                display: "flex",
                flexDirection: "column-reverse",
                // borderRadius comes from ring(), which spreads after this.
                overflow: "hidden",
                border: "1px solid",
                borderColor: LEVEL_DOT_COLOR,
                boxSizing: "content-box",
                boxShadow: (theme) => `0 0 0 1px ${theme.palette.background.paper}`,
                zIndex: 2,
                ...dim("fill"),
                ...ring("fill"),
              }}
            >
              <Box
                sx={{
                  flexGrow: EXAMPLE_OUTCOME.completed,
                  flexBasis: 0,
                  backgroundColor: RATIO_COMPLETED_COLOR,
                }}
              />
              <Box
                sx={{
                  flexGrow: EXAMPLE_OUTCOME_TOTAL - EXAMPLE_OUTCOME.completed,
                  flexBasis: 0,
                  backgroundColor: RATIO_UNFINISHED_COLOR,
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${(share * 100).toFixed(3)}%`,
                backgroundColor: ratioCompletedColor(share),
                zIndex: 0,
                pointerEvents: "none",
                ...dim("fill"),
                ...ring("fill"),
              }}
            />
          )}

          <Box sx={{ alignSelf: "center", ...dim("date"), ...ring("date") }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              12
            </Typography>
          </Box>

          {/*
            One slot, and everything that has to share a baseline is positioned
            against it at bottom: 0 -- the bars, both scales, and the level trace.
            They used to be aligned by matching offsets measured from the cell,
            which is what let them drift apart: the hour labels quietly added their
            own height to the row, so the activity scale sat lower than the bars it
            was labelling.

            The negative side margins pull the slot out to the cell's borders, so
            the level trace runs edge to edge and its midnight dot straddles the
            edge exactly as it straddles a real day boundary.
          */}
          <Box sx={{ position: "relative", height: SLOT_HEIGHT, mx: `-${CELL_PAD}px` }}>
            {/* The zero of the slot, edge to edge, exactly as on a real tile.
                First in the slot so the bars and the trace stand on it. */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "1px",
                backgroundColor: TILE_BASELINE_COLOR,
                zIndex: 0,
                ...dim("baseline"),
                ...ring("baseline"),
              }}
            />

            {/* The row axis, outside the cell on the left. */}
            <Box
              sx={{
                position: "absolute",
                right: `calc(100% + 8px)`,
                bottom: 0,
                height: "100%",
                width: GUTTER - 16,
                ...dim("axis"),
                ...ring("axis"),
              }}
            >
              {EXAMPLE_ACTIVITY_TICKS.map((tick) => (
                <ExampleTick key={tick.value} tick={tick} side="left" />
              ))}
            </Box>

            {/* The level trace, behind the bars and edge to edge, with the
                midnight dot astride the right border. Underneath, since it is
                the ground the day's changes happen against, and coloured
                segment by segment by its steepness as on a real tile. */}
            {showLine && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 0,
                ...dim("queue"),
                ...ring("queue"),
              }}
            >
              <svg
                width="100%"
                height={SLOT_HEIGHT}
                viewBox={`0 0 ${EXAMPLE_BINS.length} ${SLOT_HEIGHT}`}
                preserveAspectRatio="none"
                style={{ display: "block", overflow: "visible" }}
              >
                {EXAMPLE_LEVEL_SEGMENTS.map((segment) => (
                  <line
                    key={segment.x1}
                    x1={segment.x1}
                    y1={segment.y1}
                    x2={segment.x2}
                    y2={segment.y2}
                    stroke={segment.color}
                    strokeWidth={active?.id === "queue" ? 3 : 2}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </svg>
              <Box
                sx={{
                  position: "absolute",
                  right: 0,
                  bottom: barFraction(EXAMPLE_LEVEL_END, EXAMPLE_LEVEL_PEAK, "linear") * SLOT_HEIGHT,
                  width: 10,
                  height: 10,
                  transform: "translate(50%, 50%)",
                  borderRadius: "50%",
                  // The day's average slope on the segments' per-window scale,
                  // as on a real tile.
                  backgroundColor: levelSlopeColor(
                    Math.abs(
                      barFraction(EXAMPLE_LEVEL_END, EXAMPLE_LEVEL_PEAK, "linear") -
                        barFraction(EXAMPLE_LEVEL_START, EXAMPLE_LEVEL_PEAK, "linear"),
                    ) / EXAMPLE_BINS.length,
                  ),
                  boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
                }}
              />
            </Box>
            )}

            {/* The six bars, inset to the cell's own padding, above the trace. */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                mx: `${CELL_PAD}px`,
                display: "flex",
                gap: "3px",
                alignItems: "flex-end",
                ...dim("bars"),
                ...ring("bars"),
              }}
            >
              {EXAMPLE_BINS.map((bin, index) => {
                const total = EXAMPLE_TOTALS[index];
                const muted = focusOneBar && index !== FOCUS_BIN;
                return (
                  <Box
                    key={bin.label}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      opacity: muted ? 0.25 : 1,
                      transition: "opacity 140ms",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column-reverse",
                        // The example is linear, which is the page's default.
                        height: `${(barFraction(total, EXAMPLE_PEAK, "linear") * 100).toFixed(3)}%`,
                        minHeight: total > 0 ? 2 : 0,
                        borderRadius: "2px",
                        overflow: "hidden",
                        outline:
                          focusOneBar && index === FOCUS_BIN
                            ? "2px solid"
                            : "2px solid transparent",
                        outlineColor:
                          focusOneBar && index === FOCUS_BIN ? "primary.main" : "transparent",
                        outlineOffset: "2px",
                      }}
                    >
                      {total > 0 &&
                        stackOrder(DEFAULT_BARS).map((state) => (
                          <Box
                            key={state}
                            sx={{
                              flexGrow: bin[state],
                              flexBasis: 0,
                              backgroundColor: ACTIVITY_STYLES[state].color,
                            }}
                          />
                        ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {/* The queue level's own scale, outside the cell on the right,
                aligned to the bar slot like the trace it labels. */}
            {showLine && (
              <Box
                sx={{
                  position: "absolute",
                  left: `calc(100% + 14px)`,
                  bottom: 0,
                  height: "100%",
                  width: RIGHT_GUTTER - 20,
                  ...dim("queueAxis"),
                  ...ring("queueAxis"),
                }}
              >
                {EXAMPLE_LEVEL_TICKS.map((tick) => (
                  <ExampleTick key={tick.value} tick={tick} side="right" />
                ))}
                <Box sx={{ position: "absolute", top: "100%", left: 0, mt: "3px" }}>
                  <QueueGlyph size={14} active={active?.id === "queue"} />
                </Box>
              </Box>
            )}
          </Box>

          {/*
            The hour labels sit in their own reserved row below the slot rather
            than inside it. In the slot they added height to the bars' container
            and dragged the baseline down with them; here the row is always
            present and only its ink comes and goes.
          */}
          <Box
            sx={{
              height: HOUR_ROW,
              display: "flex",
              gap: "3px",
              opacity: active?.id === "windows" ? 1 : 0,
              transition: "opacity 140ms",
            }}
          >
            {EXAMPLE_BINS.map((bin) => (
              <Typography
                key={bin.label}
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "center",
                  fontSize: "0.6rem",
                  lineHeight: `${HOUR_ROW}px`,
                  color: "text.secondary",
                }}
              >
                {bin.label.split("–")[0]}
              </Typography>
            ))}
          </Box>

          {/* v2 has no caption line: the bars run on down to the cell's floor
              instead. See TileBody. */}
          {variant === "v1" && (
            <Box sx={{ alignSelf: "center", ...dim("caption"), ...ring("caption") }}>
              <Typography component="span" sx={{ fontSize: "0.72rem", fontWeight: 700 }}>
                4.1k changed
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Standing in for the real hover readout, so the reader knows what to
          expect before they go looking for it. Whichever bar they are asking
          about is the one it describes. */}
      <Box
        sx={{
          mt: 1.5,
          opacity: active?.id === "hover" || active?.id === "queue" ? 1 : 0,
          transition: "opacity 140ms",
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            display: "inline-block",
            px: 1.25,
            py: 0.75,
            borderRadius: 1,
            // Matches the real readouts' grounds: the bars' solid dark one, and
            // the v1 dot's light one; see READOUT_SLOT_PROPS in BinReadout.
            ...(active?.id === "queue"
              ? {
                  backgroundColor: "background.paper",
                  color: "text.primary",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: 3,
                }
              : { backgroundColor: "grey.900", color: "common.white" }),
          }}
        >
          {active?.id === "queue" ? (
            <>
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                Open jobs at midnight · Wed, Aug 12 → Thu, Aug 13
              </Typography>
              <Typography variant="caption" sx={{ display: "block", opacity: 0.8 }}>
                {EXAMPLE_LEVEL_END.toLocaleString()} jobs still open
              </Typography>
              <ReadoutLine
                color={CARRIED_ACTIVE_COLOR}
                text={`${EXAMPLE_QUEUE.carried.toLocaleString()} already in flight before this day`}
              />
              <ReadoutLine
                color={BAR_STATE_STYLES.active.color}
                text={`${EXAMPLE_QUEUE.fromToday.toLocaleString()} placed this day, still in flight`}
              />
              {slopeLines(daySlope(EXAMPLE_LEVEL, EXAMPLE_DAY), EXAMPLE_LEVEL_END).map((line) => (
                <Typography
                  key={line}
                  variant="caption"
                  sx={{ display: "block", opacity: 0.8, mt: 0.5 }}
                >
                  {line}
                </Typography>
              ))}
              <SlopeLegend />
            </>
          ) : (
            <>
              <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
                Wed, Aug 12 · 12–16 h
              </Typography>
              {stackOrder(DEFAULT_BARS).filter((state) => EXAMPLE_BINS[FOCUS_BIN][state] > 0).map(
                (state) => (
                  <ReadoutLine
                    key={state}
                    color={ACTIVITY_STYLES[state].color}
                    text={`${EXAMPLE_BINS[FOCUS_BIN][state].toLocaleString()} jobs ${state}`}
                  />
                ),
              )}
              {/* What else moved in the window, as the real readout says it. */}
              {otherChanges(EXAMPLE_FOCUS_BIN, DEFAULT_BARS) && (
                <Typography
                  variant="caption"
                  sx={{ display: "block", opacity: 0.8, mt: 0.5, fontStyle: "italic" }}
                >
                  {otherChanges(EXAMPLE_FOCUS_BIN, DEFAULT_BARS)}; not in the bar.
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Typography
        variant="caption"
        component="p"
        sx={{ color: "text.secondary", mt: 1.5, fontStyle: "italic" }}
      >
        An example day, drawn about twice the size of a real cell.
      </Typography>
    </Box>
  );
}

/** One labelled gridline on the example's scales. */
function ExampleTick({
  tick,
  side,
  unit = "count",
}: {
  tick: { value: number; fraction: number };
  side: "left" | "right";
  unit?: "count" | "percent";
}) {
  const dash = <Box sx={{ width: 4, height: "1px", backgroundColor: "divider", flexShrink: 0 }} />;
  return (
    <Box
      sx={{
        position: "absolute",
        ...(side === "left" ? { right: 0 } : { left: 0 }),
        bottom: `${tick.fraction * 100}%`,
        transform: "translateY(50%)",
        display: "flex",
        alignItems: "center",
        gap: "3px",
      }}
    >
      {side === "right" && dash}
      <Typography
        component="span"
        sx={{ fontSize: "0.7rem", lineHeight: 1, color: "text.secondary" }}
      >
        {unit === "percent" ? `${tick.value}%` : compactNumber(tick.value)}
      </Typography>
      {side === "left" && dash}
    </Box>
  );
}
