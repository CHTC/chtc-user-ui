"use client";

import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import GroupAutocomplete from "@/src/components/GroupAutocomplete/GroupAutocomplete";
import MembershipPaths from "@/src/components/MembershipPaths/MembershipPaths";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import { makeIconLinkCell, makeManagedByCell } from "@/src/components/TableCells/TableCells";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { fetchList, ForbiddenError } from "@/src/utils/fetchList";
import { apiErrorMessage } from "@/src/utils/formErrors";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import type { Group, GroupMember, GroupMembersView, User } from "@/types";
import { Delete, Edit } from "@mui/icons-material";
import {
  Grid,
  Link as MuiLink,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useMemo } from "react";
import useSWR from "swr";

type MemberCellProps = CellComponentProps<GroupMembersView, keyof GroupMembersView>;

const defaultSort: SortState<keyof GroupMembersView & string> = { columnId: "name", direction: "asc" };

const searchFields = ["name", "netid"];

const tiebreakers: SortState[] = [{ columnId: "user_id", direction: "asc" }];

const AccessCell = ({ row }: MemberCellProps) => (
  <TableCell>
    <MembershipPaths direct={row.direct} paths={row.paths} path_names={row.path_names} />
  </TableCell>
);

/** Only a direct member can be removed here; access through another group is removed in that group */
function makeRemoveMemberCell(groupId: number, onRemoved: (member: GroupMembersView) => void) {
  const RemoveMemberCell = ({ row }: MemberCellProps) => {
    const url = `/groups/${groupId}/members/users/${row.user_id}`;
    return (
      <TableCell>
        {row.direct && (
          // Table keys rows by index, so a per-row key stops the next row inheriting an open Confirm
          <ActionButton
            key={url}
            method="DELETE"
            icon={<Delete />}
            color="error"
            url={url}
            onSuccess={() => onRemoved(row)}
            ariaLabel={`Remove ${row.name ?? "user"}`}
          />
        )}
      </TableCell>
    );
  };
  RemoveMemberCell.displayName = "RemoveMemberCell";
  return RemoveMemberCell;
}

interface GroupMembersPanelProps {
  groupId: number;
  /**
   * Staff, or a non-staff viewer who got far enough to load the page (the API only lets owners
   * see it). Hides the add/remove controls when false.
   */
  canAdminister: boolean;
}

/**
 * Members of a group: every user with access and how, the groups added to it directly, and
 * controls to add or remove either. Shared by the group page and the data access page.
 */
const GroupMembersPanel = ({ groupId, canAdminister }: GroupMembersPanelProps) => {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const { showAlert } = useAlert();

  const endpoint = `/groups/${groupId}/members`;
  const refreshMembers = useServerTableRefresh(endpoint);
  const directKey = `/groups/${groupId}/direct_members?page_size=500`;
  const direct = useSWR(directKey, () => fetchList<GroupMember>(directKey));
  const { mutate: mutateDirect } = direct;

  const refresh = useCallback(async () => {
    await Promise.all([refreshMembers(), mutateDirect()]);
  }, [refreshMembers, mutateDirect]);

  const columns = useMemo(
    (): ServerTableColumns<GroupMembersView> => ({
      ...(isStaff && {
        edit: {
          id: "edit",
          name: "",
          CellComponent: makeIconLinkCell<GroupMembersView>({
            href: (member) => `/users/edit/?id=${member.user_id}`,
            icon: <Edit />,
            ariaLabel: "Go to user",
          }),
        },
      }),
      name: { id: "name", name: "Name", sortable: true },
      netid: { id: "netid", name: "NetID", sortable: true },
      access: { id: "access", name: "Access", CellComponent: AccessCell },
      ...(isStaff && {
        managed_by: {
          id: "managed_by",
          name: "Managed By",
          CellComponent: makeManagedByCell<GroupMembersView>({
            patchUrl: (member) => `/groups/${groupId}/members/users/${member.user_id}`,
            onSuccess: refresh,
            show: (member) => member.direct,
          }),
        },
      }),
      ...(canAdminister && {
        remove: {
          id: "remove",
          name: "Remove",
          CellComponent: makeRemoveMemberCell(groupId, (member) => {
            showAlert("REMOVE_MEMBER_SUCCESS", member.name ?? `user ${member.user_id}`);
            refresh();
          }),
        },
      }),
    }),
    [isStaff, canAdminister, groupId, refresh, showAlert],
  );

  if (direct.error instanceof ForbiddenError) {
    return <Typography color="error">You do not have access to this group</Typography>;
  }

  const addMember = async (body: { user_id: number } | { group_id: number }, name: string) => {
    const response = await apiFetch(`/groups/${groupId}/members`, { method: "POST", body: JSON.stringify(body) });
    if (!response.ok) {
      // 400 (cycle) and 409 (already a member) carry a readable detail
      showAlert("ACTION_ERROR", await apiErrorMessage(response, "Failed to add member"));
      return;
    }
    showAlert("ADD_MEMBER_SUCCESS", name);
    await refresh();
  };

  const memberGroups = (direct.data?.rows ?? []).filter((row) => row.member_group);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: canAdminister ? 8 : 12 }}>
        <ServerTable
          endpoint={endpoint}
          columns={columns}
          defaultSort={defaultSort}
          tiebreakers={tiebreakers}
          defaultPageSize={100}
          urlPrefix="members."
          searchLabel="Search by Name or NetID"
          searchFields={searchFields}
          emptyMessage="No members"
        />

        <Typography variant="h6" component="h4" mt={3} mb={1}>
          Member groups
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Group</TableCell>
              {canAdminister && <TableCell>Remove</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {memberGroups.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <MuiLink component={Link} href={`/groups/edit/?id=${row.member_group!.id}`}>
                    {row.member_group!.name}
                  </MuiLink>
                </TableCell>
                {canAdminister && (
                  <TableCell>
                    <ActionButton
                      method="DELETE"
                      icon={<Delete />}
                      color="error"
                      url={`/groups/${groupId}/members/groups/${row.member_group!.id}`}
                      onSuccess={() => {
                        showAlert("REMOVE_MEMBER_SUCCESS", row.member_group!.name);
                        refresh();
                      }}
                      ariaLabel={`Remove group ${row.member_group!.name}`}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!direct.isLoading && memberGroups.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
            No member groups
          </Typography>
        )}
      </Grid>

      {canAdminister && (
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h6" component="h4">
              Add member
            </Typography>
            <UserAutocomplete
              label="Add user"
              onSelect={async (user: User | null) => {
                if (user) await addMember({ user_id: user.id }, user.name ?? user.email1);
              }}
            />
            <GroupAutocomplete
              label="Add group"
              onSelect={async (group: Group | null) => {
                if (group) await addMember({ group_id: group.id }, group.name);
              }}
            />
          </Stack>
        </Grid>
      )}
    </Grid>
  );
};

export default GroupMembersPanel;
