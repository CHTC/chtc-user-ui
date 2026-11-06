"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import MembersTable, {
  groupMemberRow,
  sortMemberRows,
  userMemberRow,
} from "@/src/components/MembersTable/MembersTable";
import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import type { GroupMember, GroupMembersView } from "@/types";
import { useCallback } from "react";
import useSWR from "swr";

// Large enough that one request covers any group; the table has no paging controls
const ALL_ROWS = "page_size=10000";

interface GroupMembersPanelProps {
  groupId: number;
  /**
   * Staff, or a non-staff viewer who got far enough to load the page (the API only lets owners
   * see it). Hides the add/remove controls when false.
   */
  canAdminister: boolean;
  /** The direct members (the default), or every user with access and how */
  view?: "direct" | "users";
}

/**
 * Members of a group through the group's own routes. Shared by the group page and the data
 * access page; the project pages use the same table through the project routes.
 */
const GroupMembersPanel = ({ groupId, canAdminister, view = "direct" }: GroupMembersPanelProps) => {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;

  const membersKey = `/groups/${groupId}/members?${ALL_ROWS}`;
  const directKey = `/groups/${groupId}/direct_members?${ALL_ROWS}`;
  const members = useSWR(membersKey, () => fetchJson<GroupMembersView[]>(membersKey));
  const direct = useSWR(directKey, () => fetchJson<GroupMember[]>(directKey));
  const { mutate: mutateMembers } = members;
  const { mutate: mutateDirect } = direct;

  const refresh = useCallback(async () => {
    await Promise.all([mutateMembers(), mutateDirect()]);
  }, [mutateMembers, mutateDirect]);

  const memberGroups = view === "direct" ? (direct.data ?? []) : [];
  const memberUsers = (members.data ?? []).filter((member) => view === "users" || member.direct);

  const rows = sortMemberRows([
    ...memberGroups
      .filter((row) => row.member_group)
      .map((row) =>
        groupMemberRow(row.member_group!, {
          removeUrl: `/groups/${groupId}/members/groups/${row.member_group!.id}`,
          linkGroups: true,
        }),
      ),
    ...memberUsers.map((member) =>
      userMemberRow(member, {
        removeUrl: member.direct ? `/groups/${groupId}/members/users/${member.user_id}` : null,
        // User pages are staff only; group pages open for whoever administers them
        linkUsers: isStaff,
        linkGroups: true,
      }),
    ),
  ]);

  return (
    <MembersTable
      rows={rows}
      isLoading={members.isLoading || direct.isLoading}
      forbidden={members.error instanceof ForbiddenError || direct.error instanceof ForbiddenError}
      canAdminister={canAdminister}
      view={view}
      addUser={(user) => ({ url: `/groups/${groupId}/members`, body: { user_id: user.id } })}
      addGroup={(group) => ({ url: `/groups/${groupId}/members`, body: { group_id: group.id } })}
      onChanged={refresh}
      emptyMessage={view === "direct" ? "No direct members" : "No users"}
    />
  );
};

export default GroupMembersPanel;
