"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import JobsView from "@/src/components/JobDays/JobsView";

/**
 * The signed-in user's own jobs. No `owner` is sent, so the API reports on
 * whoever the session cookie belongs to.
 */
function View() {
  return (
    <AuthGuard message="You must be logged in to see your jobs.">
      <JobsView />
    </AuthGuard>
  );
}

export default View;
