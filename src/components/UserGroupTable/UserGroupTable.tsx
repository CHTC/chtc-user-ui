import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { Group } from "@/types";
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { EmptyTableMessage } from "../EmptyTableMessage/EmptyTableMessage";

interface UserProjectTableProps {
  userId: number;
  adminView?: boolean;
}

const UserProjectTable = ({ userId, adminView = false }: UserProjectTableProps) => {
  const { data: groups, mutate } = useTableFetch<Group[]>(`/users/${userId}/groups`);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Point Of Contact</TableCell>
          <TableCell>Unix GID</TableCell>
          {adminView && (
            <TableCell>Action</TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {groups && groups.length > 0 ?
          (groups || []).map((group) => (
            <TableRow key={group.id}>
              <TableCell>
                {group.name}
                {adminView && (<EditLink href={`/groups/edit/?id=${group.id}`} ariaLabel="Go to group" /> )}
              </TableCell>
              <TableCell>{group.point_of_contact?.name ?? group.point_of_contact?.email1 ?? ""}</TableCell>
              <TableCell>{group.unix_gid}</TableCell>
              {adminView && (
                <TableCell>
                  <DeleteActionButton
                    url={`/groups/${group.id}/users/${userId}`}
                    onSuccess={mutate}
                    ariaLabel="Delete Group"
                  />
                </TableCell>
              )}
            </TableRow>
          )) : <EmptyTableMessage message="No groups" />}
      </TableBody>
    </Table>
  );
};

export default UserProjectTable;
