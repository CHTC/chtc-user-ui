// How one day's clusters are divided for the day dialog's picker, and how each
// one is labelled.
//
// Its own module rather than part of DayDialog because the division is a model
// question, not a rendering one: which bin a group lands in and which figures
// its label quotes are the whole substance of the feature, and both can be
// exercised here without a browser.

import {
  compactNumber,
  type DayClusterRole,
} from "./dayCards";
import type { BatchInfo, GroupBy } from "./grouping";

/** What one group did on the dialog's day, for the select's option labels. */
export interface DayGroupEntry {
  id: string;
  label: string;
  placed: number;
  opening: number;
  open: number;
  completed: number;
  removed: number;
  changed: number;
}

/** Jobs that left the queue on the day: the whole of a group's activity. */
export function activityOf(entry: DayGroupEntry): number {
  return entry.completed + entry.removed;
}

/**
 * The day's clusters under whichever grouping the page is using. A batch
 * appears only if at least one of its clusters took part, and carries the
 * summed figures for the ones that did -- exact, since a job belongs to one
 * cluster and a batch is the sum of its clusters.
 */
export function rollUpDayGroups(
  roles: DayClusterRole[],
  groupBy: GroupBy,
  batches: BatchInfo[] | undefined,
): DayGroupEntry[] {
  if (groupBy !== "batch") {
    return roles.map((role) => ({
      id: String(role.cluster),
      label: `Cluster ${role.cluster}`,
      ...role,
    }));
  }
  const byCluster = new Map(roles.map((role) => [role.cluster, role]));
  const out: DayGroupEntry[] = [];
  for (const batch of batches ?? []) {
    const members = batch.clusters
      .map((member) => byCluster.get(member))
      .filter((role): role is DayClusterRole => !!role);
    if (members.length === 0) continue;
    const sum = (pick: (role: DayClusterRole) => number) =>
      members.reduce((total, role) => total + pick(role), 0);
    out.push({
      id: batch.id,
      label: batch.name,
      placed: sum((r) => r.placed),
      opening: sum((r) => r.opening),
      open: sum((r) => r.open),
      completed: sum((r) => r.completed),
      removed: sum((r) => r.removed),
      changed: sum((r) => r.changed),
    });
  }
  return out;
}

/** Numeric where both ids are cluster labels, alphabetical for batch names. */
function compareIds(a: DayGroupEntry, b: DayGroupEntry): number {
  const na = Number(a.id);
  const nb = Number(b.id);
  if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
  return a.label.localeCompare(b.label);
}

/**
 * The picker's two bins.
 *
 * A day holds two different kinds of group and they answer different
 * questions. Something placed on the day is new work, and the figure worth
 * reading is how much of it arrived. Something carried in from an earlier day
 * was already there, and the figure worth reading is what the day did to it:
 * what completed, and what was removed.
 *
 * A group that did both -- placed on the day and also holding older jobs -- is
 * listed once, under placed, because that is the more specific thing to say
 * about it on this particular day.
 *
 * Inside the carried-in bin the quiet groups come first. They are the ones
 * this split is for: a cluster placed last week that completed and removed
 * nothing today is part of the day, contributes to none of its counts, and
 * sorts to the bottom of any list ordered by activity -- exactly where a
 * reader looking for stalled work would never find it. They are ordered by how
 * much is sitting open in them; everything after them by how much left the
 * queue.
 */
export function splitDayGroups(entries: DayGroupEntry[]): {
  placed: DayGroupEntry[];
  active: DayGroupEntry[];
} {
  const placed = entries
    .filter((entry) => entry.placed > 0)
    .sort((a, b) => b.placed - a.placed || compareIds(a, b));

  const active = entries
    .filter(
      (entry) =>
        entry.placed === 0 && (entry.opening > 0 || entry.open > 0 || entry.changed > 0),
    )
    .sort((a, b) => {
      const quietFirst = Number(activityOf(a) > 0) - Number(activityOf(b) > 0);
      if (quietFirst) return quietFirst;
      // Both bins lead with magnitude. A quiet group has no activity to be
      // ranked by, so it is ranked by how much work is sitting in it: the
      // largest stalled backlog is the one worth looking at first.
      return activityOf(a) === 0
        ? b.open - a.open || compareIds(a, b)
        : activityOf(b) - activityOf(a) || compareIds(a, b);
    });

  return { placed, active };
}

/** "Cluster 418 · 4.8k placed" -- the new-work bin. */
export function placedLabel(entry: DayGroupEntry): string {
  return `${entry.label} · ${compactNumber(entry.placed)} placed`;
}

/**
 * "Cluster 418 · 1.2k completed, 300 removed" -- the carried-in bin, where the
 * question is what the day did to work that was already there. A group that
 * did nothing says so in as many words rather than falling back to its bare
 * name, which would read as a label with its figures missing.
 */
export function activeLabel(entry: DayGroupEntry): string {
  const parts: string[] = [];
  if (entry.completed > 0) parts.push(`${compactNumber(entry.completed)} completed`);
  if (entry.removed > 0) parts.push(`${compactNumber(entry.removed)} removed`);
  return parts.length > 0
    ? `${entry.label} · ${parts.join(", ")}`
    : `${entry.label} · nothing completed or removed`;
}
