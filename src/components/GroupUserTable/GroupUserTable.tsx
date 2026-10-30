import { apiDelete, apiFetch } from "@/src/components/AuthProvider";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, { ServerTableColumns, useServerTableRefresh } from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { makeLinkedTextCell, makeManagedByCell } from "@/src/components/TableCells/TableCells";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { GroupUserView, User } from "@/types";
import { Grid, Stack, Typography } from "@mui/material";
import { useMemo } from "react";

interface GroupUserTableProps {
  groupId: number;
}

const defaultSort: SortState<keyof GroupUserView & string> = { columnId: "name", direction: "asc" };

const searchFields = ["name", "netid"];

const tiebreakers: SortState[] = [{ columnId: "user_id", direction: "asc" }];

const GroupUserTable = ({ groupId }: GroupUserTableProps) => {
  const endpoint = `/groups/${groupId}/users`;
  const refresh = useServerTableRefresh(endpoint);

  const columns = useMemo(
    (): ServerTableColumns<GroupUserView> => ({
      name: {
        id: "name",
        name: "Name",
        sortable: true,
        CellComponent: makeLinkedTextCell<GroupUserView>({
          href: (user) => `/users/edit/?id=${user.user_id}`,
          ariaLabel: "Go to user",
        }),
      },
      netid: { id: "netid", name: "NetID", sortable: true },
      managed_by: {
        id: "managed_by",
        name: "Managed By",
        CellComponent: makeManagedByCell<GroupUserView>({
          patchUrl: (user) => `/groups/${groupId}/users/${user.user_id}`,
          onSuccess: refresh,
        }),
      },
      remove: {
        id: "remove",
        name: "Action",
        CellComponent: makeDeleteCell<GroupUserView>({
          mutate: refresh,
          handleDelete: (user) => apiDelete(`/groups/${groupId}/users/${user.user_id}`),
          confirmButtonProps: { "aria-label": "Remove User" },
        }),
      },
    }),
    [groupId, refresh],
  );

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <ServerTable
          endpoint={endpoint}
          columns={columns}
          defaultSort={defaultSort}
          tiebreakers={tiebreakers}
          defaultPageSize={10}
          urlPrefix="users."
          searchLabel="Search by Name or NetID"
          searchFields={searchFields}
          emptyMessage="No users"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Add User to Group</Typography>
          <UserAutocomplete
            onSelect={async (user: User | null) => {
              if (!user) return;
              await apiFetch(`/groups/${groupId}/users`, {
                method: "POST",
                body: JSON.stringify({ user_id: user.id }),
              });
              refresh();
            }}
          />
        </Stack>
      </Grid>
    </Grid>
  );
};

export default GroupUserTable;
