"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import DetailFrame, { type DetailPage } from "@/src/components/DetailFrame/DetailFrame";
import usePageTitle from "@/src/utils/usePageTitle";
import { userKey } from "@/src/utils/userCache";
import type { User } from "@/types";
import { Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import useSWR from "swr";

const userFetcher = async (id: number): Promise<User> => {
  const response = await apiFetch(`/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

/** The user from ?id=; shares the cache entry the form and the group table revalidate */
export function useUser(id: number) {
  return useSWR(userKey(id), () => userFetcher(id), { suspense: true });
}

type UserPage = (user: User, id: number) => ReactNode;

const PAGES: DetailPage[] = [
  { label: "Details", path: "/users/details/" },
  { label: "Projects", path: "/users/projects/" },
  { label: "Groups", path: "/users/groups/" },
  { label: "Submit Nodes", path: "/users/submit-nodes/" },
];

/**
 * The frame every page of one user shares: login check, the user from ?id=, their name and the
 * tabs between their pages. The page itself is a function of the loaded user.
 */
const UserShell = ({ children }: { children: UserPage }) => (
  <AuthGuard message="You must be logged in to view a user.">
    <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
      <UserFrame>{children}</UserFrame>
    </Suspense>
  </AuthGuard>
);

const UserFrame = ({ children }: { children: UserPage }) => {
  const id = Number.parseInt(useSearchParams().get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No user ID provided.</Typography>;
  }
  return <UserLoaded id={id}>{children}</UserLoaded>;
};

const UserLoaded = ({ id, children }: { id: number; children: UserPage }) => {
  const { data: user } = useUser(id);

  usePageTitle(user ? "User: " + user.name : null);

  return (
    <DetailFrame section={{ label: "Users", href: "/users/" }} title={user?.name || user?.email1} pages={PAGES} id={id}>
      <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>{user && children(user, id)}</Suspense>
    </DetailFrame>
  );
};

export default UserShell;
