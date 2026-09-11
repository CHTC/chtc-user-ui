"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import {
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import type { BinCensus } from "./binModel";
import {
  BAR_SEGMENT_ORDER,
  SEGMENT_STYLES,
  type BarStateStyle,
  type SegmentState,
} from "./palette";

// Chart.js v4 is tree-shakeable: register exactly what the bar chart needs.
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface DayStackedBarsProps {
  bins: BinCensus[];
  height?: number;
  /** Accessible description; the canvas itself is opaque to a screen reader. */
  label: string;
  /**
   * What each segment is called. The journey census and calendar v2's share
   * census stack the same four segments but mean different things by the two
   * blues, so the caller says which vocabulary applies.
   */
  styles?: Record<SegmentState, BarStateStyle>;
  /**
   * What the denominator is called: the y-axis title and the tooltip's footer.
   * The journey census counts jobs in play so far; the window census counts one
   * window's own population.
   */
  denominator?: {
    axisTitle: string;
    footer: (bin: BinCensus) => string;
  };
  /** Bottom-up stacking order. Defaults to the journey census's; v2 has its own. */
  order?: readonly SegmentState[];
}

const IN_PLAY_DENOMINATOR = {
  axisTitle: "Share of jobs in play",
  footer: (bin: BinCensus) => {
    const base = `${bin.inPlay.toLocaleString()} jobs in play at this point`;
    return bin.terminal ? `${base} · all of them in a final state` : base;
  },
};

/** The window census's denominator wording; see CensusMode "window". */
export const WINDOW_DENOMINATOR = {
  axisTitle: "Share of the window's jobs",
  footer: (bin: BinCensus) => {
    const base = `${bin.inPlay.toLocaleString()} jobs in this window: ${(bin.inPlay - bin.placedInBin).toLocaleString()} open at its start + ${bin.placedInBin.toLocaleString()} placed`;
    return bin.terminal ? `${base} · all finished by its close` : base;
  },
};

/**
 * One day as six 100%-stacked bars: a census of the group's whole cohort taken
 * every four hours.
 *
 * Each bar is a reading at an instant, not a summary of a window, so it is
 * labelled with the clock time the reading was taken. The view is percentages so
 * a 500-job group and a 900,000-job group both read as "how has this resolved";
 * the absolute counts live in the tooltip.
 *
 * Bins the model marked undrawn get null data points rather than zeroes: they
 * keep their tick on the axis -- the day is still 24 hours long -- but draw
 * nothing and raise no tooltip. That is what stops a cluster that finished at
 * 08:00 from repeating an all-teal bar four more times.
 */
export default function DayStackedBars({
  bins,
  height = 320,
  label,
  styles = SEGMENT_STYLES,
  denominator = IN_PLAY_DENOMINATOR,
  order = BAR_SEGMENT_ORDER,
}: DayStackedBarsProps) {
  const { data, options } = useMemo(() => {
    const data = {
      // Labelled by the instant each census was taken, not by the window that
      // closed. These bars are readings at a point in time; calling them "00-04"
      // invited reading them as a summary of those four hours.
      labels: bins.map((bin) => bin.snapshotAt),
      datasets: order.map((state) => ({
        label: styles[state].label,
        data: bins.map((bin) =>
          bin.drawn && bin.inPlay > 0 ? (bin[state] / bin.inPlay) * 100 : null,
        ),
        backgroundColor: styles[state].color,
        borderWidth: 0,
        // Thin slivers (one removed job among a million) should still be hoverable.
        minBarLength: 0,
      })),
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: "Snapshot time" },
          grid: { display: false },
        },
        y: {
          stacked: true,
          min: 0,
          max: 100,
          title: { display: true, text: denominator.axisTitle },
          ticks: { callback: (value: string | number) => `${value}%` },
        },
      },
      plugins: {
        legend: { position: "bottom" as const, labels: { boxWidth: 14, boxHeight: 14 } },
        tooltip: {
          callbacks: {
            title: (items: TooltipItem<"bar">[]) => (items.length > 0 ? String(items[0].label) : ""),
            // Percent on screen, totals on hover -- this is where the absolute
            // numbers live.
            label: (ctx: TooltipItem<"bar">) => {
              const bin = bins[ctx.dataIndex];
              const state = order[ctx.datasetIndex];
              const count = bin[state];
              const share = bin.inPlay > 0 ? ((count / bin.inPlay) * 100).toFixed(1) : "0.0";
              return `${styles[state].label}: ${count.toLocaleString()} jobs (${share}%)`;
            },
            footer: (items: TooltipItem<"bar">[]) => {
              if (items.length === 0) return "";
              return denominator.footer(bins[items[0].dataIndex]);
            },
          },
        },
      },
    };

    return { data, options };
  }, [bins, styles, denominator, order]);

  return (
    <Box role="img" aria-label={label} sx={{ position: "relative", width: "100%", height }}>
      <Bar data={data} options={options} />
    </Box>
  );
}
