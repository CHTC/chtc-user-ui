import MembershipPaths from "@/src/components/MembershipPaths/MembershipPaths";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns } from "@/src/components/Table/ServerTable";
import type { CellComponentProps, SortState } from "@chtc/web-components";
import { makeLinkedTextCell } from "@/src/components/TableCells/TableCells";
import { useRevalidateUserAndGroups, userGroupsKey } from "@/src/utils/userCache";
import { UserGroupsView } from "@/types";
import { Check } from "@mui/icons-material";
import { TableCell } from "@mui/material";
import { useMemo } from "react";

interface UserGroupTableProps {
  userId: number;
  /** Staff view: links to every group and shows the remove control */
  adminView?: boolean;
}

// The groups the user administers first, then by name
const defaultSort: SortState<keyof UserGroupsView & string> = { columnId: "is_owner", direction: "desc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [
  { columnId: "name", direction: "asc" },
  { columnId: "group_id", direction: "asc" },
];

const OwnerCell = ({ row }: CellComponentProps<UserGroupsView, keyof UserGroupsView>) => (
  <TableCell>{row.is_owner && <Check aria-label="Owner" color="success" />}</TableCell>
);

// Only a direct membership can be removed; access through another group can't
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
  // Removing a group also removes the submit nodes it grants, so refresh the user too.
  const revalidate = useRevalidateUserAndGroups(userId);

  const columns = useMemo(
    (): ServerTableColumns<UserGroupsView> => ({
      name: {
        id: "name",
        name: "Name",
        sortable: true,
        // Linked to the group's page for the groups the reader may open: staff any, others the ones they administer
        CellComponent: makeLinkedTextCell<UserGroupsView>({
          href: (group) => `/groups/details/?id=${group.group_id}`,
          ariaLabel: "Go to group",
          canOpen: (group) => adminView || group.is_owner,
        }),
      },
      is_owner: { id: "is_owner", name: "Owner", sortable: true, firstSortDirection: "desc", CellComponent: OwnerCell },
      unix_gid: { id: "unix_gid", name: "Unix GID", sortable: true },
      access: { id: "access", name: "Access", CellComponent: makeAccessCell(adminView) },
      ...(adminView && {
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
    [adminView, userId, revalidate],
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
