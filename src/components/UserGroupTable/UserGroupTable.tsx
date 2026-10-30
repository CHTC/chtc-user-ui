import { apiDelete } from "@/src/components/AuthProvider";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { makeLinkedTextCell, makeManagedByCell } from "@/src/components/TableCells/TableCells";
import { useRevalidateUserAndGroups, userGroupsKey } from "@/src/utils/userCache";
import { UserGroupView } from "@/types";
import { useMemo } from "react";

interface UserGroupTableProps {
  userId: number;
  adminView?: boolean;
}

const defaultSort: SortState<keyof UserGroupView & string> = { columnId: "name", direction: "asc" };

const searchFields = ["name"];

const tiebreakers: SortState[] = [{ columnId: "group_id", direction: "asc" }];

const UserGroupTable = ({ userId, adminView = false }: UserGroupTableProps) => {
  const endpoint = userGroupsKey(userId);
  const refresh = useServerTableRefresh(endpoint);
  // Removing a group also removes the submit nodes it grants, so refresh the user too.
  const revalidate = useRevalidateUserAndGroups(userId);

  const columns = useMemo(
    (): ServerTableColumns<UserGroupView> => ({
      name: {
        id: "name",
        name: "Name",
        sortable: true,
        ...(adminView && {
          CellComponent: makeLinkedTextCell<UserGroupView>({
            href: (group) => `/groups/edit/?id=${group.group_id}`,
            ariaLabel: "Go to group",
          }),
        }),
      },
      // The API sorts point_of_contact by user id, not name, so this column isn't sortable
      point_of_contact: {
        id: "point_of_contact",
        name: "Point Of Contact",
        value: (group) => group.point_of_contact?.name ?? group.point_of_contact?.email1 ?? "",
      },
      unix_gid: { id: "unix_gid", name: "Unix GID", sortable: true },
      managed_by: {
        id: "managed_by",
        name: "Managed By",
        CellComponent: makeManagedByCell<UserGroupView>({
          patchUrl: (group) => `/groups/${group.group_id}/users/${userId}`,
          onSuccess: refresh,
        }),
      },
      ...(adminView && {
        remove: {
          id: "remove",
          name: "Action",
          CellComponent: makeDeleteCell<UserGroupView>({
            mutate: revalidate,
            handleDelete: (group) => apiDelete(`/groups/${group.group_id}/users/${userId}`),
            confirmButtonProps: { "aria-label": "Remove from Group" },
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
