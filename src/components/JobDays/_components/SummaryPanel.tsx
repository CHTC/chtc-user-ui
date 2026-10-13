"use client";

import { Box, Link, Paper, Stack, Tooltip, Typography } from "@mui/material";

import { compactNumber, formatDayShort, parseDayKey } from "./dayCards";
import { ACTIVITY_STYLES, type ActivityState } from "./palette";
import type { LiveNow, Projection, ScopeSummary, Totals, YesterdaySummary } from "./summaryModel";

interface SummaryPanelProps {
  yesterday: YesterdaySummary | null;
  scope: ScopeSummary;
  /** "October 2026" or "Sep 27 – Oct 10 · 14 days": what the scope block is about. */
  scopeTitle: string;
  /** True when the scope is a dragged range rather than the month grid. */
  scopeIsRange: boolean;
  live: LiveNow;
  projection: Projection | null;
  /** A day named in the panel was clicked: open its dialog. */
  onOpenDay: (day: string) => void;
}

/**
 * The numbers beside the calendar: four short blocks that answer the questions
 * the grid raises without making the reader hover. Yesterday, because the as-of
 * day is unfinished; the scope, because it is what the bars are scaled to and
 * follows the reader's range; the queue now; and when it might clear.
 *
 * Follows every filter the calendar does, since it is built from the same
 * per-day models. Days named in it open the day dialog, the same as a tile.
 */
export default function SummaryPanel({
  yesterday,
  scope,
  scopeTitle,
  scopeIsRange,
  live,
  projection,
  onOpenDay,
}: SummaryPanelProps) {
  return (
    <Paper
      component="aside"
      variant="outlined"
      aria-label="Summary"
      sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2.5, alignSelf: "start" }}
    >
      {/* --- Yesterday --- */}
      <Block
        title="Yesterday"
        subtitle={
          yesterday
            ? `${formatDayShort(yesterday.day)}, the last complete day`
            : "No complete day loaded yet"
        }
      >
        {yesterday && (
          <>
            <TotalsRows totals={yesterday.totals} />
            <Row label="Jobs that moved" value={compactNumber(yesterday.changed)} />
            {yesterday.queue && (
              <Row
                label="Queue at midnight"
                value={compactNumber(yesterday.queue.total)}
                note={
                  yesterday.queue.total > 0
                    ? `${compactNumber(yesterday.queue.fromToday)} placed that day, ${compactNumber(yesterday.queue.carried)} carried in`
                    : undefined
                }
              />
            )}
            {yesterday.outcome && (
              <Row
                label="Day's jobs finished"
                value={`${Math.round((yesterday.outcome.completed / yesterday.outcome.inPlay) * 100)}%`}
                note={`${compactNumber(yesterday.outcome.completed)} of ${compactNumber(yesterday.outcome.inPlay)} open at the start or placed that day`}
              />
            )}
            <DayLink day={yesterday.day} onOpenDay={onOpenDay}>
              Open the day
            </DayLink>
          </>
        )}
      </Block>

      {/* --- The scope --- */}
      <Block
        title={scopeTitle}
        subtitle={
          scope.days.length === 0
            ? "Nothing loaded for these days"
            : scopeIsRange
              ? `${scope.days.length} ${scope.days.length === 1 ? "day" : "days"} selected`
              : `${scope.days.length} days on the grid`
        }
      >
        {scope.days.length > 0 && (
          <>
            <TotalsRows totals={scope.totals} previous={scope.previous} />
            {scope.previous && (
              <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                Changes are against the {scope.days.length} days before.
              </Typography>
            )}
            <Sparkline points={scope.dailyCompleted} onOpenDay={onOpenDay} />
            {scope.queueOpen !== null && scope.queueClose !== null && (
              <Row
                label="Queue, open → close"
                value={`${compactNumber(scope.queueOpen)} → ${compactNumber(scope.queueClose)}`}
                note={signedChange(scope.queueClose - scope.queueOpen)}
              />
            )}
            {scope.peakQueue && (
              <Row
                label="Peak queue"
                value={compactNumber(scope.peakQueue.value)}
                note={<DayLink day={scope.peakQueue.day} onOpenDay={onOpenDay} />}
              />
            )}
            {scope.busiest && (
              <Row
                label="Busiest day"
                value={`${compactNumber(scope.busiest.completed)} completed`}
                note={<DayLink day={scope.busiest.day} onOpenDay={onOpenDay} />}
              />
            )}
            <Row
              label="Days with activity"
              value={`${scope.activeDays} of ${scope.days.length}`}
            />
          </>
        )}
      </Block>

      {/* --- Right now --- */}
      <Block
        title="Right now"
        subtitle={
          live.census
            ? `Census at the close of ${formatDayShort(live.census.day)}`
            : "The bake carries no queue census"
        }
      >
        {live.liveTotal !== null && (
          <Row
            label="In condor_q"
            value={compactNumber(live.liveTotal)}
            note="live, whole account"
          />
        )}
        {live.census && (
          <>
            <Row label="Waiting" value={compactNumber(live.census.waiting)} />
            <Row label="Running" value={compactNumber(live.census.running)} />
          </>
        )}
        {live.oldestOpen && (
          <Row
            label="Oldest open cluster"
            value={String(live.oldestOpen.cluster)}
            note={`placed ${formatDayShort(live.oldestOpen.since)}, ${daysSince(live.oldestOpen.since)}`}
          />
        )}
        {live.liveTotal === null && !live.census && !live.oldestOpen && (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Nothing standing for this selection.
          </Typography>
        )}
      </Block>

      {/* --- Projection --- */}
      <Block
        title="When it clears"
        subtitle={
          projection
            ? `${compactNumber(projection.open)} open at the close of ${formatDayShort(projection.asOfDay)}`
            : "Needs a complete day with a queue reading"
        }
      >
        {projection && <ProjectionRows projection={projection} />}
      </Block>
    </Paper>
  );
}

// ---------------------------------------------------------------------------

function Block({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Box component="section">
      <Typography
        variant="overline"
        component="h3"
        sx={{ color: "text.secondary", lineHeight: 1.6, display: "block" }}
      >
        {title}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>
        {subtitle}
      </Typography>
      <Stack spacing={0.75}>{children}</Stack>
    </Box>
  );
}

/** One figure: a label on the left, the number on the right, a note under. */
function Row({
  label,
  value,
  note,
  swatch,
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
  swatch?: string;
}) {
  return (
    <Box>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
          {swatch && (
            <Box
              component="span"
              aria-hidden
              sx={{ width: 8, height: 8, borderRadius: "2px", backgroundColor: swatch, flexShrink: 0 }}
            />
          )}
          <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
            {label}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
          {value}
        </Typography>
      </Stack>
      {note && (
        <Typography
          variant="caption"
          component="div"
          sx={{ color: "text.secondary", textAlign: "right", lineHeight: 1.3 }}
        >
          {note}
        </Typography>
      )}
    </Box>
  );
}

const TOTAL_ROWS: { state: ActivityState; key: keyof Totals }[] = [
  { state: "placed", key: "placed" },
  { state: "completed", key: "completed" },
  { state: "removed", key: "removed" },
];

/** Placed, completed, removed, each with the bars' own colour and, given a comparison, its change. */
function TotalsRows({ totals, previous }: { totals: Totals; previous?: Totals | null }) {
  return (
    <>
      {TOTAL_ROWS.map(({ state, key }) => (
        <Row
          key={key}
          label={ACTIVITY_STYLES[state].label}
          swatch={ACTIVITY_STYLES[state].color}
          value={compactNumber(totals[key])}
          note={previous ? <Delta now={totals[key]} before={previous[key]} /> : undefined}
        />
      ))}
    </>
  );
}

/** "+12% (from 8.1k)" or "new" or "—" against the previous window. */
function Delta({ now, before }: { now: number; before: number }) {
  if (now === before) return <span>no change</span>;
  if (before === 0) return <span>new; none before</span>;
  const pct = ((now - before) / before) * 100;
  const text = Math.abs(pct) >= 1000 ? `${pct > 0 ? "+" : "−"}${compactNumber(Math.round(Math.abs(pct)))}%` : `${pct > 0 ? "+" : "−"}${Math.round(Math.abs(pct))}%`;
  return (
    <span>
      {text} from {compactNumber(before)}
    </span>
  );
}

function signedChange(delta: number): string {
  if (delta === 0) return "unchanged";
  return `${delta > 0 ? "+" : "−"}${compactNumber(Math.abs(delta))} over the scope`;
}

function daysSince(day: string): string {
  const days = Math.round((Date.now() - parseDayKey(day).getTime()) / 86_400_000);
  return days <= 0 ? "today" : days === 1 ? "1 day ago" : `${days} days ago`;
}

/** A day, as a link that opens its dialog. Plain text when it has no handler. */
function DayLink({
  day,
  onOpenDay,
  children,
}: {
  day: string;
  onOpenDay: (day: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <Link
      component="button"
      type="button"
      variant="caption"
      underline="hover"
      onClick={() => onOpenDay(day)}
      sx={{ verticalAlign: "baseline", textAlign: "inherit" }}
    >
      {children ?? formatDayShort(day)}
    </Link>
  );
}

/**
 * Completions per day across the scope, one thin bar each, scaled to the
 * scope's own busiest day. Hover a bar for its day and count; click to open
 * the day. Plain SVG: it is a dozen rectangles, not a chart.
 */
function Sparkline({
  points,
  onOpenDay,
}: {
  points: { day: string; value: number }[];
  onOpenDay: (day: string) => void;
}) {
  const height = 28;
  const peak = Math.max(1, ...points.map((p) => p.value));
  const width = points.length;
  if (points.length < 2) return null;
  return (
    <Box
      component="svg"
      role="img"
      aria-label={`Completions per day across ${points.length} days`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      sx={{ width: "100%", height, display: "block", my: 0.5 }}
    >
      {points.map((point, i) => {
        const h = point.value > 0 ? Math.max(1, (point.value / peak) * height) : 0;
        return (
          <Tooltip
            key={point.day}
            title={`${formatDayShort(point.day)} · ${point.value.toLocaleString()} completed`}
            placement="top"
            arrow
            disableInteractive
          >
            <g onClick={() => onOpenDay(point.day)} style={{ cursor: "pointer" }}>
              {/* Full-height hit area so an empty day is still hoverable. */}
              <rect x={i} y={0} width={1} height={height} fill="transparent" />
              <rect
                x={i + 0.12}
                y={height - h}
                width={0.76}
                height={h}
                fill={ACTIVITY_STYLES.completed.color}
              />
            </g>
          </Tooltip>
        );
      })}
    </Box>
  );
}

function ProjectionRows({ projection }: { projection: Projection }) {
  const dated = projection.paces.filter((pace) => pace.clearsOn !== null);
  const earliest = dated.length > 0 ? dated.reduce((a, b) => (a.clearsOn! < b.clearsOn! ? a : b)) : null;
  const latest = dated.length > 0 ? dated.reduce((a, b) => (a.clearsOn! > b.clearsOn! ? a : b)) : null;

  const headline =
    projection.open === 0
      ? "Nothing open to clear."
      : !earliest || !latest
        ? "Nothing left the queue in the last two weeks, so there is no pace to project from."
        : earliest.clearsOn === latest.clearsOn
          ? `Around ${farDay(earliest.clearsOn!, projection.asOfDay)}.`
          : `Between ${farDay(earliest.clearsOn!, projection.asOfDay)} and ${farDay(latest.clearsOn!, projection.asOfDay)}, depending on the pace.`;

  return (
    <>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {headline}
      </Typography>
      {projection.open > 0 &&
        projection.paces.map((pace) => (
          <Row
            key={pace.window}
            label={`${pace.window}-day pace`}
            value={pace.clearsOn ? farDay(pace.clearsOn, projection.asOfDay) : "no progress"}
            note={`${compactNumber(Math.round(pace.perDay))} leaving per day`}
          />
        ))}
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.5 }}>
        Assumes nothing new is placed; a batch landing resets it. Removals count as leaving
        the queue, though they are not completions.
      </Typography>
    </>
  );
}

/** A projected day, or "over a year" when the date would be meaningless. */
function farDay(day: string, from: string): string {
  const days = Math.round((parseDayKey(day).getTime() - parseDayKey(from).getTime()) / 86_400_000);
  if (days > 365) return "over a year away";
  return formatDayShort(day);
}
