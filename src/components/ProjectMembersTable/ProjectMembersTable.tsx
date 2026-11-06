"use client";

import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAlert } from "@/src/components/AlertProvider";
import { useAuthClient } from "@/src/components/AuthProvider";
import MembersTable, {
  groupMemberRow,
  sortMemberRows,
  userMemberRow,
} from "@/src/components/MembersTable/MembersTable";
import { fetchJson, ForbiddenError } from "@/src/utils/fetchList";
import { useReadableGroup } from "@/src/utils/groupCache";
import type { GroupMember, GroupMembersView, JoinedProjectView, Project } from "@/types";
import { Star, StarBorder } from "@mui/icons-material";
import { Alert, Box, IconButton, Typography } from "@mui/material";
import { userKey } from "@/src/utils/userCache";
import { useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";

interface ProjectMembersTableProps {
  projectId: number;
  project: Project;
  /** The direct members (the default), or every user with access and how */
  view?: "direct" | "users";
}

// Large enough that one request covers any project; the table has no paging controls
const ALL_ROWS = "page_size=10000";

const PRIMARY_COLUMN = { id: "primary", name: "Primary" };

/**
 * The project group's members: on the direct view the groups and users added to it, on the users
 * view every user with access, direct or through a group, and how. Membership lives on the project group, so members are read,
 * added and (for groups) removed through /groups/{project_group_id}; /projects/{id}/users adds
 * the primary flag. Controls are shown to everyone who can load the page; the API rejects what
 * the viewer may not do.
 */
const ProjectMembersTable = ({ projectId, project, view = "direct" }: ProjectMembersTableProps) => {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const { showAlert } = useAlert();
  const { mutate } = useSWRConfig();
  const groupId = project.project_group_id;

  const members = useSWR(groupId ? `/groups/${groupId}/members?${ALL_ROWS}` : null, (url: string) =>
    fetchJson<GroupMembersView[]>(url),
  );
  const groups = useSWR(groupId ? `/groups/${groupId}/direct_members?${ALL_ROWS}` : null, (url: string) =>
    fetchJson<GroupMember[]>(url),
  );
  // Shared with the group's own pages through the SWR cache; a viewer who may not read the group simply gets no warning
  const projectGroup = useReadableGroup(groupId);
  const users = useSWR(`/projects/${projectId}/users?${ALL_ROWS}`, (url: string) =>
    fetchJson<JoinedProjectView[]>(url),
  );
  const { mutate: mutateMembers } = members;
  const { mutate: mutateGroups } = groups;
  const { mutate: mutateUsers } = users;

  const refresh = useCallback(async () => {
    await Promise.all([mutateMembers(), mutateGroups(), mutateUsers()]);
  }, [mutateMembers, mutateGroups, mutateUsers]);

  if (!groupId) {
    return <Typography color="text.secondary">This project has no project group, so it has no members.</Typography>;
  }

  const primary = new Set((users.data ?? []).filter((u) => u.is_primary).map((u) => u.id));

  const primaryCell = (member: GroupMembersView) =>
    primary.has(member.user_id) ? (
      // Same 48px box and padding as ConfirmButton so the stars line up
      <Box sx={{ width: 48, height: 48, p: 0.5 }}>
        <IconButton aria-label="Primary project" color="error" disableRipple sx={{ cursor: "default" }}>
          <Star />
        </IconButton>
      </Box>
    ) : (
      isStaff && (
        // Table keys rows by index, so key the button by user to keep an open Confirm on its own row
        <ActionButton
          key={member.user_id}
          url={`/users/${member.user_id}`}
          method="PATCH"
          body={{ primary_project_id: projectId }}
          icon={<StarBorder />}
          color="error"
          ariaLabel={`Make ${project.name} the primary project of ${member.name ?? "this user"}`}
          onSuccess={() => {
            showAlert("UPDATE_PRIMARY_PROJECT_SUCCESS", project.name);
            void mutateUsers();
            // The user's own page may hold a cached copy with the old primary project
            void mutate(userKey(member.user_id));
          }}
          onError={(detail) => showAlert("UPDATE_PRIMARY_PROJECT_ERROR", detail)}
        />
      )
    );

  const memberGroups = view === "direct" ? (groups.data ?? []) : [];
  const memberUsers = (members.data ?? []).filter((member) => view === "users" || member.direct);

  const rows = sortMemberRows([
    ...memberGroups
      .filter((row) => row.member_group)
      .map((row) =>
        groupMemberRow(row.member_group!, {
          removeUrl: `/groups/${groupId}/members/groups/${row.member_group!.id}`,
          linkGroups: isStaff,
        }),
      ),
    ...memberUsers.map((member) => ({
      ...userMemberRow(member, {
        removeUrl: member.direct ? `/projects/${projectId}/users/${member.user_id}` : null,
        linkUsers: isStaff,
        linkGroups: isStaff,
      }),
      extra: primaryCell(member),
    })),
  ]);

  return (
    <>
      {projectGroup && projectGroup.managed_by !== "APPLICATION" && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Membership of this group is synced from {projectGroup.managed_by}. Members added or removed here are replaced
          by the next sync.
        </Alert>
      )}
      <MembersTable
        rows={rows}
        isLoading={members.isLoading || groups.isLoading || users.isLoading}
        forbidden={members.error instanceof ForbiddenError || groups.error instanceof ForbiddenError}
        canAdminister={true}
        view={view}
        addUser={(user) => ({ url: `/groups/${groupId}/members`, body: { user_id: user.id } })}
        addGroup={(group) => ({ url: `/groups/${groupId}/members`, body: { group_id: group.id } })}
        onChanged={refresh}
        extraColumn={PRIMARY_COLUMN}
        emptyMessage={view === "direct" ? "No direct members" : "No users"}
      />
    </>
  );
};

export default ProjectMembersTable;
