import { apiFetch } from "@/src/components/AuthProvider";
import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { User } from "@/types";
import { Grid, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import EmptyTableMessage from "../EmptyTableMessage/EmptyTableMessage";

interface GroupUserTableProps {
  groupId: number;
}

const GroupUserTable = ({ groupId }: GroupUserTableProps) => {
  const { data: users, mutate } = useTableFetch<User[]>(`/groups/${groupId}/users`);

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>NetID</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users && users.length > 0 ?
              (users || []).map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <EditLink href={`/users/edit/?id=${user.id}`} ariaLabel="Go to user" />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.netid}</TableCell>
                  <TableCell>
                    <DeleteActionButton
                      url={`/groups/${groupId}/users/${user.id}`}
                      onSuccess={mutate}
                      ariaLabel="Remove User"
                    />
                  </TableCell>
                </TableRow>
              )) : <EmptyTableMessage message="No users" />}
          </TableBody>
        </Table>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Add User to Group</Typography>
          <UserAutocomplete
            onSelect={async (user: User | null) => {
              if (!user) return;
              await apiFetch(`/groups/${groupId}/users`, {
                method: "POST",
                body: JSON.stringify({ id: user.id }),
              });
              mutate();
            }}
          />
        </Stack>
      </Grid>
    </Grid>
  );
};

export default GroupUserTable;
