"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import MembersTable, {
  groupMemberRow,
  sortMemberRows,
  userMemberRow,
} from "@/src/components/MembersTable/MembersTable";
import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import type { GroupMember, GroupMembersView, Project } from "@/types";
import { Typography } from "@mui/material";
import { useCallback } from "react";
import useSWR from "swr";

interface ProjectPiTableProps {
  projectId: number;
  project: Project;
}

// Large enough that one request covers any project; the table has no paging controls
const ALL_ROWS = "page_size=10000";

/**
 * The project's PIs: the groups added to its pi group and every user in it, direct or through
 * a group. Both lists are read through the project routes: a PI may view the project but not
 * its pi group, which has no owner group. Only staff add or remove PIs, through /groups/{pi_group_id}.
 */
const ProjectPiTable = ({ projectId, project }: ProjectPiTableProps) => {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const piGroupId = project.pi_group_id;

  const pis = useSWR(`/projects/${projectId}/pis?${ALL_ROWS}`, (url: string) => fetchJson<GroupMembersView[]>(url));
  const groups = useSWR(piGroupId ? `/projects/${projectId}/pi_groups?${ALL_ROWS}` : null, (url: string) =>
    fetchJson<GroupMember[]>(url),
  );
  const { mutate: mutatePis } = pis;
  const { mutate: mutateGroups } = groups;

  const refresh = useCallback(async () => {
    await Promise.all([mutatePis(), mutateGroups()]);
  }, [mutatePis, mutateGroups]);

  if (!piGroupId) {
    return <Typography color="text.secondary">This project has no PI group, so it has no PIs.</Typography>;
  }

  const rows = sortMemberRows([
    ...(groups.data ?? [])
      .filter((row) => row.member_group)
      .map((row) =>
        groupMemberRow(row.member_group!, {
          removeUrl: `/groups/${piGroupId}/members/groups/${row.member_group!.id}`,
          linkGroups: isStaff,
        }),
      ),
    ...(pis.data ?? []).map((member) =>
      userMemberRow(member, {
        removeUrl: member.direct ? `/projects/${projectId}/pis/${member.user_id}` : null,
        linkUsers: isStaff,
        linkGroups: isStaff,
      }),
    ),
  ]);

  return (
    <MembersTable
      rows={rows}
      isLoading={pis.isLoading || groups.isLoading}
      forbidden={pis.error instanceof ForbiddenError || groups.error instanceof ForbiddenError}
      canAdminister={isStaff}
      addUser={(user) => ({ url: `/groups/${piGroupId}/members`, body: { user_id: user.id } })}
      addGroup={(group) => ({ url: `/groups/${piGroupId}/members`, body: { group_id: group.id } })}
      onChanged={refresh}
      addTitle="Add PI"
      userLabel="Add user as PI"
      groupLabel="Add group as PIs"
      emptyMessage="No PIs"
    />
  );
};

export default ProjectPiTable;
