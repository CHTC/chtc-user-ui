"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import DetailFrame, { type DetailPage } from "@/src/components/DetailFrame/DetailFrame";
import { fetchGroup, groupKey } from "@/src/utils/groupCache";
import usePageTitle from "@/src/utils/usePageTitle";
import type { Group } from "@/types";
import { Alert, Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import useSWR from "swr";

/** The group from ?id=, or "forbidden"; every page of the group shares this cache entry */
export function useGroup(id: number) {
  return useSWR(groupKey(id), () => fetchGroup(id), { suspense: true });
}

type GroupPage = (group: Group, id: number) => ReactNode;

// Details is the metadata form, which only staff edit; non-staff administrators get the member
// pages only (the details page sends them to Members)
const DETAILS: DetailPage = { label: "Details", path: "/groups/details/" };

const PAGES: DetailPage[] = [
  DETAILS,
  {
    label: "Members",
    path: "/groups/members/",
    children: [
      { label: "Direct", path: "/groups/members/" },
      { label: "Users", path: "/groups/members/users/" },
    ],
  },
  { label: "Access", path: "/groups/access/" },
  { label: "History", path: "/groups/history/" },
];

/**
 * The frame every page of one group shares: login check, the group from ?id=, its name, a
 * deleted banner and the tabs between its pages. The page itself is a function of the loaded group.
 */
const GroupShell = ({ children }: { children: GroupPage }) => (
  <AuthGuard message="You must be logged in to view a group.">
    <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
      <GroupFrame>{children}</GroupFrame>
    </Suspense>
  </AuthGuard>
);

const GroupFrame = ({ children }: { children: GroupPage }) => {
  const id = Number.parseInt(useSearchParams().get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No group ID provided.</Typography>;
  }
  return <GroupLoaded id={id}>{children}</GroupLoaded>;
};

const GroupLoaded = ({ id, children }: { id: number; children: GroupPage }) => {
  const { data: group } = useGroup(id);
  const { currentUser } = useAuthClient();
  const loaded = group && group !== "forbidden" ? group : null;
  const pages = currentUser?.is_admin ? PAGES : PAGES.filter((page) => page !== DETAILS);

  usePageTitle(loaded ? "Group: " + loaded.name : null);

  if (!loaded) {
    return <Typography color="error">You do not have access to this group</Typography>;
  }

  return (
    <DetailFrame
      section={{ label: "Groups", href: "/groups/" }}
      title={loaded.name}
      pages={pages}
      id={id}
      banner={
        loaded.deleted_at !== null && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Deleted on {new Date(loaded.deleted_at).toLocaleString()}
          </Alert>
        )
      }
    >
      <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>{children(loaded, id)}</Suspense>
    </DetailFrame>
  );
};

export default GroupShell;
