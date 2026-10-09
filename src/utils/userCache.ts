import { useCallback } from "react";
import { useSWRConfig } from "swr";

/** SWR keys for a user's record and for the group table driven by the same data. */
export const userKey = (userId: number) => [`/users/${userId}`];
export const userGroupsKey = (userId: number) => `/users/${userId}/groups`;

/**
 * A user's submit nodes come from their group memberships, but the two are rendered
 * from separate requests on the user page, so a change to either side has to
 * revalidate both.
 */
export function useRevalidateUserAndGroups(userId: number | null) {
  const { mutate } = useSWRConfig();

  return useCallback(async () => {
    if (!userId) return;
    await Promise.all([mutate(userKey(userId)), mutate(userGroupsKey(userId))]);
  }, [mutate, userId]);
}
