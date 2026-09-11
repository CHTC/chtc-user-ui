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

import { BAR_SEGMENT_ORDER, SHARE_SEGMENT_STYLES, type SegmentState } from "./palette";

/** Which part of the example cell a feature is about. */
type Part = "date" | "axis" | "bars";

type FeatureId = "date" | "windows" | "population" | "colour" | "hover";

interface Feature {
  id: FeatureId;
  title: string;
  body: string;
  /** Parts of the example that stay lit while this feature is hovered. */
  parts: Part[];
}

/**
 * The features of a calendar v2 cell, ordered by what a reader needs first:
 * what a cell is, what a bar is, what its denominator is, what the colours mean,
 * and where the numbers are.
 */
const FEATURES: Feature[] = [
  {
    id: "date",
    title: "One cell is one day",
    body: "Click anywhere in it to open that day in full — the same six bars drawn large, and its exact counts.",
    parts: ["date"],
  },
  {
    id: "windows",
    title: "Six bars, six 4-hour windows",
    body: "Midnight to 04:00 on the left through 20:00 to midnight on the right. Each bar is read as its window closes and covers only what that window held — the next bar starts over.",
    parts: ["bars"],
  },
  {
    id: "population",
    title: "Every bar is 100% of its own window",
    body: "A window's population is the jobs that were open when it started plus the jobs placed during it. Whatever is still active at the close is the whole of the next window's opening population — so 200 jobs open with 100 completing is a 50/50 bar, and the next window starts with 100.",
    parts: ["bars", "axis"],
  },
  {
    id: "colour",
    title: "Colour is where each job ended the window",
    body: "Bottom to top: light blue was open at the start and is still active; dark blue was placed during the window and is still active; teal completed during it; red was removed during it. A window in which nothing moved is all light blue.",
    parts: ["bars"],
  },
  {
    id: "hover",
    title: "Hover a bar for the numbers",
    body: "The bars are unlabelled so a month of them reads as a shape. Hovering one gives each segment's share and count, and how the window's population splits between jobs open at its start and jobs placed during it.",
    parts: ["bars", "axis"],
  },
];

/**
 * The worked example: a day that opens with 400 active jobs, completes 200 in
 * the first window, idles through the second, takes on 400 new jobs in the
 * third, and works them off through the evening. Each entry is one window's
 * population split at its close; the two blues of one window add up to the
 * opening population of the next.
 */
const EXAMPLE_BINS: { time: string; active: number; becameActive: number; completed: number; removed: number }[] = [
  { time: "04:00", active: 200, becameActive: 0, completed: 200, removed: 0 },
  { time: "08:00", active: 200, becameActive: 0, completed: 0, removed: 0 },
  { time: "12:00", active: 200, becameActive: 400, completed: 0, removed: 0 },
  { time: "16:00", active: 450, becameActive: 0, completed: 100, removed: 50 },
  { time: "20:00", active: 200, becameActive: 0, completed: 250, removed: 0 },
  { time: "midnight", active: 0, becameActive: 0, completed: 200, removed: 0 },
];

const populationOf = (bin: (typeof EXAMPLE_BINS)[number]) =>
  bin.active + bin.becameActive + bin.completed + bin.removed;

/** The bar the colour and hover features single out: the one with all four states. */
const FOCUS_BIN = 3;

/** How many of the focus window's jobs were already open when it started. */
const FOCUS_OPEN_AT_START = 600;

const SLOT_HEIGHT = 170;
const GUTTER = 46;
const CELL_PAD = 12;
const HOUR_ROW = 14;

const PERCENT_TICKS = [
  { value: 100, fraction: 1 },
  { value: 50, fraction: 0.5 },
  { value: 0, fraction: 0 },
];

interface CellGuideV2DialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The "how to read a cell" dialog for calendar v2. Same shape as the v1 guide --
 * feature cards on the left, an oversized example cell on the right that lights
 * up part by part -- for a simpler cell: six percentage bars and nothing else.
 */
export default function CellGuideV2Dialog({ open, onClose }: CellGuideV2DialogProps) {
  const [active, setActive] = useState<FeatureId | null>(null);
  const feature = FEATURES.find((f) => f.id === active) ?? null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="body">
      <DialogTitle sx={{ pr: 6, pb: 1 }}>
        <Typography component="span" variant="h6" sx={{ fontWeight: 700, display: "block" }}>
          How to read a day in calendar v2
        </Typography>
        <Typography component="span" variant="caption" sx={{ color: "text.secondary" }}>
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 2.5, md: 3 }}>
          <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
            {FEATURES.map((entry) => (
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
              position: { md: "sticky" },
              top: { md: 8 },
              alignSelf: "flex-start",
            }}
          >
            <ExampleCell active={feature} />
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
      <Typography variant="caption" component="p" sx={{ color: "text.secondary", mt: 0.25 }}>
        {feature.body}
      </Typography>
    </Box>
  );
}

/** Swatch plus text, matching the real readout's shape. */
function ReadoutLine({ color, text }: { color: string; text: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: color, flexShrink: 0 }} />
      <Typography variant="caption">{text}</Typography>
    </Stack>
  );
}

/**
 * An oversized v2 cell, drawn from the same palette and the same stacking order
 * as the real tiles.
 */
function ExampleCell({ active }: { active: Feature | null }) {
  const lit = (part: Part) => !active || active.parts.includes(part);
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

  const focus = EXAMPLE_BINS[FOCUS_BIN];
  const focusPopulation = populationOf(focus);

  return (
    <Box>
      <Box sx={{ pl: `${GUTTER}px` }}>
        <Box
          sx={{
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
          <Box sx={{ alignSelf: "center", ...dim("date"), ...ring("date") }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary" }}>
              12
            </Typography>
          </Box>

          <Box sx={{ position: "relative", height: SLOT_HEIGHT }}>
            {/* The percentage scale, outside the cell on the left. */}
            <Box
              sx={{
                position: "absolute",
                right: `calc(100% + ${CELL_PAD + 8}px)`,
                bottom: 0,
                height: "100%",
                width: GUTTER - 16,
                ...dim("axis"),
                ...ring("axis"),
              }}
            >
              {PERCENT_TICKS.map((tick) => (
                <Box
                  key={tick.value}
                  sx={{
                    position: "absolute",
                    right: 0,
                    bottom: `${tick.fraction * 100}%`,
                    transform: "translateY(50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: "3px",
                  }}
                >
                  <Typography
                    component="span"
                    sx={{ fontSize: "0.7rem", lineHeight: 1, color: "text.secondary" }}
                  >
                    {tick.value}%
                  </Typography>
                  <Box sx={{ width: 4, height: "1px", backgroundColor: "divider", flexShrink: 0 }} />
                </Box>
              ))}
            </Box>

            {/* The six full-height bars. */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                gap: "3px",
                alignItems: "stretch",
                ...dim("bars"),
                ...ring("bars"),
              }}
            >
              {EXAMPLE_BINS.map((bin, index) => {
                const muted = focusOneBar && index !== FOCUS_BIN;
                return (
                  <Box
                    key={bin.time}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      flexDirection: "column-reverse",
                      borderRadius: "2px",
                      overflow: "hidden",
                      opacity: muted ? 0.25 : 1,
                      transition: "opacity 140ms",
                      outline:
                        focusOneBar && index === FOCUS_BIN ? "2px solid" : "2px solid transparent",
                      outlineColor:
                        focusOneBar && index === FOCUS_BIN ? "primary.main" : "transparent",
                      outlineOffset: "2px",
                    }}
                  >
                    {BAR_SEGMENT_ORDER.map((state: SegmentState) => (
                      <Box
                        key={state}
                        sx={{
                          flexGrow: bin[state],
                          flexBasis: 0,
                          backgroundColor: SHARE_SEGMENT_STYLES[state].color,
                        }}
                      />
                    ))}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* The snapshot times, revealed with the windows feature. */}
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
                key={bin.time}
                component="span"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  textAlign: "center",
                  fontSize: "0.58rem",
                  lineHeight: `${HOUR_ROW}px`,
                  color: "text.secondary",
                }}
              >
                {bin.time === "midnight" ? "24:00" : bin.time}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Stands in for the real hover readout. */}
      <Box
        sx={{
          mt: 1.5,
          opacity: active?.id === "hover" || active?.id === "colour" ? 1 : 0,
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
            backgroundColor: "grey.900",
            color: "common.white",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, display: "block" }}>
            Wed, Aug 12 · {focus.time}
          </Typography>
          {BAR_SEGMENT_ORDER.filter((state) => focus[state] > 0).map((state) => (
            <ReadoutLine
              key={state}
              color={SHARE_SEGMENT_STYLES[state].color}
              text={`${Math.round((focus[state] / focusPopulation) * 100)}% ${SHARE_SEGMENT_STYLES[state].label.toLowerCase()} · ${focus[state].toLocaleString()}`}
            />
          ))}
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 0.5, opacity: 0.8, fontStyle: "italic" }}
          >
            {focusPopulation.toLocaleString()} jobs in this window: {FOCUS_OPEN_AT_START.toLocaleString()} open
            at its start + {(focusPopulation - FOCUS_OPEN_AT_START).toLocaleString()} placed during it
          </Typography>
        </Box>
      </Box>

      <Typography
        variant="caption"
        component="p"
        sx={{ color: "text.secondary", mt: 1.5, fontStyle: "italic" }}
      >
        An example day: 400 jobs open at midnight, 200 of them done by 04:00, a quiet
        morning, 400 more placed before noon, then worked off through the evening. Drawn
        about twice the size of a real cell.
      </Typography>
    </Box>
  );
}
