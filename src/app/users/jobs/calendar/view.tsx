"use client";

// Admin view of one user's jobs.
//
// The same page as /users/me/jobs/, for a netid named in the URL. The API
// answers 403 to any non-admin who names an owner, so the gate here is not the
// security boundary -- it exists because a page that always errors is worse than
// a page that says who it is for.
//
// Reached from the table at /users/jobs, whose calendar icons link here with
// ?user=<netid>. There is deliberately no picker: by the time you are on this
// page the user has already been chosen, and the table is a better place to
// choose a different one because it shows what makes anyone worth opening.
// Whose jobs these are is stated by the viewer's own heading below.

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import JobsView from "@/src/components/JobDays/JobsView";
import type { CalendarVersion } from "@/src/components/JobDays/_components/VersionSwitch";
import { Alert, AlertTitle, Skeleton, Stack } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

import { readOwnerParam, readRangeParams, type DayRange } from "./params";

function AdminJobs({ variant }: { variant: CalendarVersion }) {
  const { currentUser, loading } = useAuthClient();
  // Null both before the URL has been read and when it named nobody, so `ready`
  // is what separates "still looking" from "there was no netid in the link".
  const [owner, setOwner] = useState<string | null>(null);
  const [range, setRange] = useState<DayRange | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setOwner(readOwnerParam());
    setRange(readRangeParams());
    setReady(true);
  }, []);

  if (loading) return <Skeleton variant="rectangular" height={80} />;

  if (currentUser?.is_admin !== true) {
    return (
      <Alert severity="warning">
        <AlertTitle>Admins only</AlertTitle>
        Your own jobs are at <Link href="/users/me/jobs/">My Jobs</Link>.
      </Alert>
    );
  }

  // The way back to the table is the breadcrumb in this route's layout, drawn
  // before the auth check resolves so it does not pop in under the reader.
  return (
    <Stack spacing={3}>
      {owner ? (
        <JobsView owner={owner} range={range} variant={variant} />
      ) : ready ? (
        // Only reachable by typing the URL by hand or following a truncated
        // link; the table always supplies a netid.
        <Alert severity="info">
          <AlertTitle>No user in this link</AlertTitle>
          This page shows one user&apos;s jobs, and the link did not say whose. Pick someone from{" "}
          <Link href="/users/jobs/">the user table</Link>.
        </Alert>
      ) : null}
    </Stack>
  );
}

/**
 * `variant` picks the calendar: /users/jobs/calendar/ draws v1 and
 * /users/jobs/calendar/v2/ draws v2, for the same user and window.
 */
function View({ variant = "v1" }: { variant?: CalendarVersion }) {
  return (
    <AuthGuard message="You must be logged in to see a user's jobs.">
      <AdminJobs variant={variant} />
    </AuthGuard>
  );
}

export default View;
