"use client";

// The fetching half of the job viewer.
//
// DaysView is the page as it was when its two payloads were baked to disk at
// build time: given the data, it paints. This wrapper is everything that became
// true once the same numbers started arriving per-user over the network -- a
// wait that can genuinely last minutes on a cold window, an error vocabulary
// with seven distinct meanings, a queue figure that can arrive under-counted,
// and a user who may simply have no jobs.
//
// It takes `owner` so one component serves both routes: /users/me/jobs passes
// nothing and gets the caller's own jobs, /users/jobs/calendar passes a netid an
// admin picked or arrived with. The API enforces that distinction regardless;
// the parameter only decides what is asked for.

import { apiFetch } from "@/src/components/AuthProvider";
import { Alert, AlertTitle, Box, Button, Skeleton, Stack, Typography } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

import DaysView from "./DaysView";
import type { DayData } from "./_components/dayCards";
import type { StackedBarData } from "./types";

/** The API's marker for an account with access to no submit node at all. */
const NO_SUBMIT_NODE = "no submit node on record";

/** A [start, end) pair of "YYYY-MM-DD" days, `end` exclusive, as the API takes them. */
export interface DayRange {
  start: string;
  end: string;
}

export interface JobsViewProps {
  /**
   * Netid whose jobs to report. Omit (or null) for the caller's own; only an
   * admin may name anyone else, and the API answers 403 if a non-admin tries.
   */
  owner?: string | null;
  /**
   * Window to report on. Omit (or null) for the API's own default, which is the
   * days leading up to today -- right for "my jobs", wrong for a user opened
   * from a range in the past, where it would answer a different question than
   * the one that was asked.
   */
  range?: DayRange | null;
}

/** An error carrying the status that produced it, so the page can explain it. */
class JobsApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "JobsApiError";
    this.status = status;
  }
}

function withParams(endpoint: string, owner: string | null, range: DayRange | null): string {
  const params = new URLSearchParams();
  if (owner) params.set("owner", owner);
  if (range) {
    params.set("start", range.start);
    params.set("end", range.end);
  }
  const query = params.toString();
  return query ? `${endpoint}?${query}` : endpoint;
}

async function getJson<T>(endpoint: string, owner: string | null, range: DayRange | null): Promise<T> {
  const response = await apiFetch(withParams(endpoint, owner, range));
  if (!response.ok) {
    // The API's `detail` strings are written to be read by a person; prefer them
    // to statusText, which says nothing useful about why the request failed.
    const body = await response.json().catch(() => null);
    const detail = typeof body?.detail === "string" ? body.detail : null;
    throw new JobsApiError(detail ?? response.statusText, response.status);
  }
  return response.json() as Promise<T>;
}

/**
 * What each failure means to the reader, and whether trying again could help.
 *
 * Retrying is offered only where it is honest: an unreachable Adstash may well
 * answer a second later, but no number of retries will give an account a netid.
 */
function explain(error: unknown): { title: string; note?: string; body: string; retryable: boolean } {
  const status = error instanceof JobsApiError ? error.status : 0;
  const detail = error instanceof Error ? error.message : String(error);

  switch (status) {
    case 401:
      return {
        title: "Your session has expired",
        body: "Sign in again to see your jobs.",
        retryable: false,
      };
    case 403:
      return {
        title: "Not allowed",
        body: "Only an admin may look at another user's jobs. If you reached this page from the menu, that is a bug worth reporting.",
        retryable: false,
      };
    case 404:
      return {
        title: "No user with that netid",
        body: detail,
        retryable: false,
      };
    case 409:
      return {
        title: "This account has no netid on record",
        body:
          "HTCondor records the submitter of a job as their netid, so without one there is " +
          "no way to tell which jobs belong to this account. Retrying will not help; the " +
          "netid has to be added to the account first.",
        retryable: false,
      };
    case 422:
      return {
        title: "That window will not fit",
        body: detail,
        // Reachable without anything being broken: the user table summarises
        // ranges far longer than this view can draw, so clicking through from a
        // long one lands here legitimately.
        note: "Narrow the range on the user table and open the calendar again.",
        retryable: false,
      };
    case 502:
      return {
        title: "The job history service did not answer",
        body: detail,
        note: "This is usually temporary.",
        retryable: true,
      };
    case 507:
      return {
        title: "Too many clusters in this window",
        body: detail,
        note: "A shorter window would fit.",
        retryable: false,
      };
    default:
      return {
        title: "Could not load jobs",
        body: detail,
        retryable: true,
      };
  }
}

function JobsError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { title, body, note, retryable } = explain(error);
  return (
    <Alert
      severity="error"
      action={
        retryable ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {body}
      {note && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {note}
        </Typography>
      )}
    </Alert>
  );
}

/**
 * A skeleton shaped like the page rather than a spinner.
 *
 * The first request for a given user and window costs seconds of Adstash time
 * and up to minutes of schedd time (the API caches the answer for 60s, so the
 * second load is fast). A bare spinner for that long reads as broken, so this
 * says what is being waited on and lays out the two blocks that will replace it.
 */
function JobsSkeleton() {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 3, md: 4 }, maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="75%" />
      </Stack>
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" height={520} sx={{ borderRadius: 1 }} />
      </Stack>
      <Typography
        variant="caption"
        component="p"
        sx={{ color: "text.secondary", mt: 2, textAlign: "center" }}
      >
        Reading the job history and querying the submit nodes. The first look at a window can
        take a minute; reloading soon afterwards is fast.
      </Typography>
    </Box>
  );
}

/**
 * A partial answer is a 200, not an error: if a submit node did not respond the
 * rest of the payload still arrives, with the jobs that node is holding missing
 * from it. The visibly wrong parts are the queue markers and openingActive, and
 * the page's whole claim is that it accounts for every job -- so this is said out
 * loud rather than swallowed, though it can be dismissed once read.
 *
 * Rendered below the calendar rather than above it. The node that did not answer
 * is usually one the pool does not really own -- a departmental or grid
 * submitter that this application knows about but cannot reach -- so it is a
 * footnote about completeness, not a reason to push the answer down the page.
 */
function DegradedQueueAlert({ errors }: { errors: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || errors.length === 0) return null;

  return (
    <Alert severity="warning" onClose={() => setDismissed(true)} sx={{ mt: 3 }}>
      <AlertTitle>
        {errors.length === 1 ? "A submit node did not answer" : `${errors.length} submit nodes did not answer`}
      </AlertTitle>
      Jobs still in the queue are under-counted above — the queue markers and the opening
      figures are the affected parts; finished jobs come from the history index and are
      unaffected.
      <Box component="ul" sx={{ mt: 1, mb: 0, pl: 3 }}>
        {errors.map((message) => (
          <Box component="li" key={message}>
            <Typography variant="caption">{message}</Typography>
          </Box>
        ))}
      </Box>
    </Alert>
  );
}

/**
 * Distinct from the degraded warning above: nothing failed here. The account has
 * access to no submit node, so the live queue was never queried at all. Finished
 * jobs still come from the history index and the page below is real -- what is
 * missing is anything that has not finished yet.
 */
function NoSubmitNodeAlert({ owner }: { owner: string | null }) {
  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <AlertTitle>No submit node on record</AlertTitle>
      {owner ? `${owner} has` : "This account has"} access to no submit node, so the live queue
      was not queried. Finished jobs are shown in full from the job history; anything still
      queued or running is missing.
    </Alert>
  );
}

function NoJobs({ owner }: { owner: string | null }) {
  return (
    <Alert severity="info">
      <AlertTitle>No jobs in this window</AlertTitle>
      {owner
        ? `${owner} has submitted nothing to HTCondor in the window this page covers.`
        : "You have not submitted anything to HTCondor in the window this page covers."}{" "}
      Jobs appear here once they reach a submit node.
    </Alert>
  );
}

/**
 * Two requests rather than one: they are independent aggregations on the API
 * side, and keeping them separate means neither waits on the other. Both are
 * needed before the page can paint, so the skeleton stands until both land.
 *
 * No refresh interval, deliberately. The API caches for 60s and the cold path
 * costs minutes of submit-node time, so this refetches on demand (a retry, a
 * remount, a change of owner) and never on a timer.
 */
export default function JobsView({ owner = null, range = null }: JobsViewProps) {
  // The range is part of the key, not just the request: changing it asks a
  // different question and must not be answered from the previous one's cache.
  const key = [owner, range?.start ?? null, range?.end ?? null];
  const series = useSWR<StackedBarData, unknown>(["/jobs/series", ...key], () =>
    getJson<StackedBarData>("/jobs/series", owner, range),
  );
  const dayData = useSWR<DayData, unknown>(["/jobs/day-summary", ...key], () =>
    getJson<DayData>("/jobs/day-summary", owner, range),
  );

  const error = series.error ?? dayData.error;
  if (error) {
    return (
      <JobsError
        error={error}
        onRetry={() => {
          void series.mutate();
          void dayData.mutate();
        }}
      />
    );
  }

  if (!series.data || !dayData.data) return <JobsSkeleton />;

  const condorQ = series.data.sources.condorQ;
  const queueErrors = condorQ.errors ?? [];
  const noSubmitNode = condorQ.schedd === NO_SUBMIT_NODE;

  // A user with no jobs in the window gets a perfectly valid, entirely empty
  // payload. DaysView would render a blank calendar and a Sankey of nothing,
  // which reads as a broken page rather than as an answer.
  const empty = series.data.series.length === 0 && dayData.data.cohorts.length === 0;

  return (
    <Box>
      {/*
        An account with no submit node at all stays at the top: nothing failed,
        but the live queue was never asked, so a whole class of job is missing
        from everything below and the reader needs that before they read it.
        A node that failed to answer is a footnote and sits at the bottom.
      */}
      {noSubmitNode && <NoSubmitNodeAlert owner={owner} />}
      {empty ? <NoJobs owner={owner} /> : <DaysView data={series.data} dayData={dayData.data} />}
      {!noSubmitNode && <DegradedQueueAlert errors={queueErrors} />}
    </Box>
  );
}
