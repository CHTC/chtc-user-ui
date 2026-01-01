import { apiFetch } from "@/src/components/AuthProvider";
import { Group } from "@/types";
import { Delete } from "@mui/icons-material";
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import useSWR from "swr";

import { ConfirmButton } from "@chtc/web-components";

interface UserProjectTableProps {
  userId: number;
}

const UserProjectTable = ({ userId }: UserProjectTableProps) => {
  const { data: groups, mutate } = useSWR(
    `/users/${userId}/groups`,
    async (): Promise<Group[]> => {
      const groupUserResponse = await apiFetch(`/users/${userId}/groups`);
      return groupUserResponse.json();
    },
    { suspense: true },
  );

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Point Of Contact</TableCell>
          <TableCell>Unix GID</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {groups &&
          (groups || []).map((group) => (
            <TableRow key={group.id}>
              <TableCell>{group.name}</TableCell>
              <TableCell>{group.point_of_contact}</TableCell>
              <TableCell>{group.unix_gid}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ConfirmButton
                    aria-label={"Delete Group"}
                    color={"error"}
                    onConfirm={async () => {
                      await apiFetch(`/groups/${group.id}/users/${group.id}`, {
                        method: "DELETE",
                      });
                      mutate();
                      // Optionally, you can add a way to refresh the data here
                    }}
                  >
                    <Delete />
                  </ConfirmButton>
                </Box>
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default UserProjectTable;
