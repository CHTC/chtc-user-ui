"use client";

// The range table of everyone's jobs, and the way in to any one user's calendar.
//
// Admin-only, because it is about every user rather than about the caller. The
// API enforces that and answers 403; the check here exists so a non-admin who
// reaches the page is told what to do instead of watching a table fail to load.

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import UserJobsTable from "@/src/components/UserJobsTable/UserJobsTable";
import { Alert, AlertTitle, Skeleton, Stack, Typography } from "@mui/material";
import Link from "next/link";

function AdminUserJobs() {
  const { currentUser, loading } = useAuthClient();

  if (loading) return <Skeleton variant="rectangular" height={80} />;

  if (currentUser?.is_admin !== true) {
    return (
      <Alert severity="warning">
        <AlertTitle>Admins only</AlertTitle>
        This table covers every user. Your own jobs are at <Link href="/users/me/jobs/">My Jobs</Link>.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body1" sx={{ color: "text.secondary" }}>
        Everyone who finished an HTCondor job in the chosen range, busiest first. Sort by any
        column to find who is worth a look, then open the calendar icon to see what happened to
        their jobs day by day.
      </Typography>
      <UserJobsTable />
    </Stack>
  );
}

function View() {
  return (
    <AuthGuard message="You must be logged in to see user jobs.">
      <AdminUserJobs />
    </AuthGuard>
  );
}

export default View;
