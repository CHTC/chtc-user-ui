import useSWR from "swr";
import { apiFetch } from "@/src/components/AuthProvider";
import { Table, TableBody, TableCell, TableHead, TableRow, Button } from "@mui/material";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { User } from "@/types";

interface GroupUserTableProps {
  groupId: number;
}

const GroupUserTable = ({ groupId }: GroupUserTableProps) => {
  const { data: users, mutate } = useSWR(
    `/groups/${groupId}/users`,
    async (): Promise<User[]> => {
      const groupUserResponse = await apiFetch(`/groups/${groupId}/users`);
      return groupUserResponse.json();
    },
    { suspense: true },
  );

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Username</TableCell>
          <TableCell>NetID</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users &&
          (users || []).map((user: any) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.netid}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={async () => {
                    await apiFetch(`/groups/${groupId}/users/${user.id}`, {
                      method: "DELETE",
                    });
                    mutate();
                    // Optionally, you can add a way to refresh the data here
                  }}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        <TableRow>
          <TableCell colSpan={4} align="center">
            <UserAutocomplete
              onSelect={async (user: User) => {
                await apiFetch(`/groups/${groupId}/users`, {
                  method: "POST",
                  body: JSON.stringify({ id: user.id }),
                });
                mutate();
              }}
            />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default GroupUserTable;
