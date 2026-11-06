"use client";

import GroupDetails from "@/src/app/groups/_components/GroupDetails";
import GroupShell from "@/src/app/groups/_components/GroupShell";
import { useAuthClient } from "@/src/components/AuthProvider";
import { Skeleton } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * The group's metadata form, for staff. Everyone else lands on the members page instead: every
 * link into a group points here, and the metadata is nothing a group administrator needs.
 */
function View() {
  // Reading the id needs a Suspense boundary for static export
  return (
    <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
      <Details />
    </Suspense>
  );
}

const Details = () => {
  const { currentUser, loading } = useAuthClient();
  const router = useRouter();
  const id = useSearchParams().get("id");
  const sendToMembers = !loading && !!currentUser && !currentUser.is_admin;

  useEffect(() => {
    if (sendToMembers) router.replace(id ? `/groups/members/?id=${encodeURIComponent(id)}` : "/groups/");
  }, [sendToMembers, id, router]);

  if (sendToMembers) return <Skeleton variant="rectangular" height="400px" />;

  return <GroupShell>{(group, id) => <GroupDetails group={group} id={id} />}</GroupShell>;
};

export default View;
