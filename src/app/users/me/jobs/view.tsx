"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import JobsView from "@/src/components/JobDays/JobsView";
import type { CalendarVersion } from "@/src/components/JobDays/_components/VersionSwitch";

/**
 * The signed-in user's own jobs. No `owner` is sent, so the API reports on
 * whoever the session cookie belongs to.
 *
 * `variant` picks the calendar: /users/me/jobs/ draws v1, /users/me/jobs/v2/
 * draws v2. Same data, same guard, different cell.
 */
function View({ variant = "v1" }: { variant?: CalendarVersion }) {
  return (
    <AuthGuard message="You must be logged in to see your jobs.">
      <JobsView variant={variant} />
    </AuthGuard>
  );
}

export default View;
