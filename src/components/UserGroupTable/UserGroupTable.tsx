import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { Group } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

interface UserProjectTableProps {
  userId: number;
}

const UserProjectTable = ({ userId }: UserProjectTableProps) => {
  const { data: groups, mutate } = useTableFetch<Group[]>(`/users/${userId}/groups`);

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
              <TableCell>
                {group.name} <EditLink href={`/groups/edit?id=${group.id}`} ariaLabel="Go to group" />
              </TableCell>
              <TableCell>{group.point_of_contact}</TableCell>
              <TableCell>{group.unix_gid}</TableCell>
              <TableCell>
                <DeleteActionButton
                  url={`/groups/${group.id}/users/${userId}`}
                  onSuccess={mutate}
                  ariaLabel="Delete Group"
                />
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default UserProjectTable;
