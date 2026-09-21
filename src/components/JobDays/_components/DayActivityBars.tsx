"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableLineSegmentContext,
  type TooltipItem,
} from "chart.js";
import { Chart as MixedChart } from "react-chartjs-2";

import type { BinActivity, BucketUnit, DayLevel } from "./binModel";
import {
  ACTIVITY_STYLES,
  describeActivity,
  levelSlopeColor,
  stackOrder,
  type ActivityState,
} from "./palette";
import { otherChanges } from "./TileActivityBars";

// The bars, plus the line the level trace needs when it is drawn over them.
Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

interface DayActivityBarsProps {
  bins: BinActivity[];
  height?: number;
  /** Accessible description; the canvas itself is opaque to a screen reader. */
  label: string;
  /**
   * What one bar spans. Hours is the day chart; the period summary widens the
   * bars to a day or a week each, which changes the axis title and how a
   * tooltip names its bar.
   */
  unit?: BucketUnit;
  /**
   * The open-jobs level at the close of each bar, drawn as a line over the
   * bars on its own scale down the right -- the summary's version of the trace
   * behind the calendar tiles, coloured by slope the same way. Omitted, the
   * chart is bars alone.
   */
  level?: DayLevel | null;
  /** Which states the bars stack; the rest are quoted in the tooltip. */
  shown: ActivityState[];
}

/** Axis title and tooltip nouns for each bar width. */
export const UNIT_WORDING: Record<BucketUnit, { axis: string; noun: string }> = {
  hours: { axis: "Hour of day", noun: "bin" },
  days: { axis: "Day", noun: "day" },
  weeks: { axis: "Week", noun: "week" },
};

/**
 * One day as six count-stacked bars: how many state changes landed in each
 * 4-hour bin. It is about magnitude -- a heavy bin towers, an idle one is empty
 * -- so the y axis is jobs.
 *
 * Deliberately always linear, whatever the calendar's scale toggle says. This is
 * where the reader comes for the real numbers: the calendar's log option buys
 * visibility at the cost of proportionality, and this chart is the place that
 * cost gets refunded.
 *
 * With a level, a line runs over the bars: the queue as a standing count, read
 * at the close of each bar against the right-hand axis. Standing jobs and
 * changes are different quantities, so they never share a scale. Each stretch
 * of the line takes the colour its steepness earns on the weather-radar ramp
 * -- light blue flat, through green and yellow as it moves, red steep, purple
 * for a drop or climb the height of the axis in one bar -- and each point the
 * colour of the stretch arriving at it, exactly as the tiles do.
 */
export default function DayActivityBars({
  bins,
  height = 320,
  label,
  unit = "hours",
  level = null,
  shown,
}: DayActivityBarsProps) {
  const { data, options } = useMemo(() => {
    const wording = UNIT_WORDING[unit];
    const order = stackOrder(shown);
    const trace = level && level.hasData ? level : null;
    // The line's own scale: its highest reading, so it fills the axis.
    const levelPeak = trace ? Math.max(trace.start, ...trace.ends, 1) : 1;
    // The reading each point steps from: the start for the first, the previous
    // close for the rest. Steepness is the change as a share of the axis.
    const stepColor = (index: number) => {
      if (!trace) return "transparent";
      const before = index === 0 ? trace.start : trace.ends[index - 1];
      return levelSlopeColor(Math.abs(trace.ends[index] - before) / levelPeak);
    };
    const barCount = order.length;

    const data: ChartData<"bar" | "line"> = {
      labels: bins.map((bin) => bin.label),
      datasets: [
        ...order.map((state) => ({
          type: "bar" as const,
          label: ACTIVITY_STYLES[state].label,
          data: bins.map((bin) => bin[state]),
          backgroundColor: ACTIVITY_STYLES[state].color,
          borderWidth: 0,
          yAxisID: "y",
          order: 2,
        })),
        ...(trace
          ? [
              {
                type: "line" as const,
                label: "Open jobs",
                data: trace.ends,
                yAxisID: "y1",
                // Drawn above the bars.
                order: 1,
                borderWidth: 2.5,
                tension: 0,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBorderWidth: 1.5,
                pointBorderColor: "#ffffff",
                pointBackgroundColor: trace.ends.map((_, index) => stepColor(index)),
                // The colour of each stretch between two readings. Chart.js
                // hands the segment's endpoints; p1DataIndex is the reading it
                // arrives at.
                segment: {
                  borderColor: (ctx: ScriptableLineSegmentContext) => stepColor(ctx.p1DataIndex),
                },
                // The legend swatch needs a fixed colour; the ramp's blue, a
                // gently moving queue, stands for the whole line.
                borderColor: levelSlopeColor(0.003),
                backgroundColor: levelSlopeColor(0.003),
              },
            ]
          : []),
      ],
    };

    const options: ChartOptions<"bar" | "line"> = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: {
        x: {
          stacked: true,
          title: { display: true, text: wording.axis },
          grid: { display: false },
        },
        y: {
          stacked: true,
          min: 0,
          title: { display: true, text: `Jobs ${describeActivity(shown)}` },
          ticks: { precision: 0 },
        },
        ...(trace
          ? {
              y1: {
                position: "right" as const,
                min: 0,
                suggestedMax: levelPeak,
                title: { display: true, text: "Open jobs" },
                ticks: { precision: 0 },
                // One set of gridlines is enough; the bars' axis keeps them.
                grid: { drawOnChartArea: false },
              },
            }
          : {}),
      },
      plugins: {
        legend: { position: "bottom", labels: { boxWidth: 14, boxHeight: 14 } },
        tooltip: {
          callbacks: {
            title: (items: TooltipItem<"bar" | "line">[]) =>
              items.length > 0 ? (unit === "hours" ? `${items[0].label} h` : String(items[0].label)) : "",
            label: (ctx: TooltipItem<"bar" | "line">) => {
              if (ctx.datasetIndex >= barCount) {
                const open = trace ? trace.ends[ctx.dataIndex] : 0;
                return `${open.toLocaleString()} ${open === 1 ? "job" : "jobs"} open at the close of this ${wording.noun}`;
              }
              const bin = bins[ctx.dataIndex];
              const state = order[ctx.datasetIndex];
              return `${ACTIVITY_STYLES[state].label}: ${bin[state].toLocaleString()} jobs`;
            },
            footer: (items: TooltipItem<"bar" | "line">[]) => {
              if (items.length === 0 || items[0].datasetIndex >= barCount) return "";
              const bin = bins[items[0].dataIndex];
              const inBar = `${bin.total.toLocaleString()} ${describeActivity(shown)} in this ${wording.noun}`;
              const other = otherChanges(bin, shown);
              return other ? `${inBar} · ${other}, not in the bar` : inBar;
            },
          },
        },
      },
    };

    return { data, options };
  }, [bins, unit, level, shown]);

  return (
    <Box role="img" aria-label={label} sx={{ position: "relative", width: "100%", height }}>
      <MixedChart type="bar" data={data} options={options} />
    </Box>
  );
}
