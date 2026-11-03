import MembershipPaths from "@/src/components/MembershipPaths/MembershipPaths";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import { makeLinkedTextCell, makeManagedByCell } from "@/src/components/TableCells/TableCells";
import { useRevalidateUserAndGroups, userGroupsKey } from "@/src/utils/userCache";
import { UserGroupsView } from "@/types";
import { TableCell } from "@mui/material";
import { useMemo } from "react";

interface UserGroupTableProps {
  userId: number;
  /** Staff view: links to groups and shows the managed-by and remove controls */
  adminView?: boolean;
}

const defaultSort: SortState<keyof UserGroupsView & string> = { columnId: "name", direction: "asc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "group_id", direction: "asc" }];

// Only a direct membership has a managed-by and can be removed; access through another group can't
const isDirect = (group: UserGroupsView) => group.direct;

function makeAccessCell(linkGroups: boolean) {
  const AccessCell = ({ row }: CellComponentProps<UserGroupsView, keyof UserGroupsView>) => (
    <TableCell>
      <MembershipPaths direct={row.direct} paths={row.paths} path_names={row.path_names} linkGroups={linkGroups} />
    </TableCell>
  );
  AccessCell.displayName = "AccessCell";
  return AccessCell;
}

const UserGroupTable = ({ userId, adminView = false }: UserGroupTableProps) => {
  const endpoint = userGroupsKey(userId);
  const refresh = useServerTableRefresh(endpoint);
  // Removing a group also removes the submit nodes it grants, so refresh the user too.
  const revalidate = useRevalidateUserAndGroups(userId);

  const columns = useMemo(
    (): ServerTableColumns<UserGroupsView> => ({
      name: {
        id: "name",
        name: "Name",
        sortable: true,
        ...(adminView && {
          CellComponent: makeLinkedTextCell<UserGroupsView>({
            href: (group) => `/groups/edit/?id=${group.group_id}`,
            ariaLabel: "Go to group",
          }),
        }),
      },
      unix_gid: { id: "unix_gid", name: "Unix GID", sortable: true },
      access: { id: "access", name: "Access", CellComponent: makeAccessCell(adminView) },
      ...(adminView && {
        managed_by: {
          id: "managed_by",
          name: "Managed By",
          CellComponent: makeManagedByCell<UserGroupsView>({
            patchUrl: (group) => `/groups/${group.group_id}/members/users/${userId}`,
            onSuccess: refresh,
            show: (group) => isDirect(group) && !!group.managed_by,
          }),
        },
        remove: {
          id: "remove",
          name: "Action",
          CellComponent: makeDeleteCell<UserGroupsView>({
            mutate: revalidate,
            deleteUrl: (group) => `/groups/${group.group_id}/members/users/${userId}`,
            canDelete: isDirect,
            ariaLabel: "Remove from Group",
          }),
        },
      }),
    }),
    [adminView, userId, refresh, revalidate],
  );

  return (
    <ServerTable
      endpoint={endpoint}
      columns={columns}
      defaultSort={defaultSort}
      tiebreakers={tiebreakers}
      defaultPageSize={5}
      urlPrefix="groups."
      searchLabel="Search by Group"
      searchFields={searchFields}
      emptyMessage="No groups"
    />
  );
};

export default UserGroupTable;
