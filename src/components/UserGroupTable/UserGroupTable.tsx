import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { UserGroupView } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

interface UserProjectTableProps {
  userId: number;
  adminView?: boolean;
}

const UserProjectTable = ({ userId, adminView = false }: UserProjectTableProps) => {
  const { data: groups, mutate } = useTableFetch<UserGroupView[]>(`/users/${userId}/groups`);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Point Of Contact</TableCell>
          <TableCell>Unix GID</TableCell>
          <TableCell>Managed By</TableCell>
          {adminView && (
            <TableCell>Action</TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {groups &&
          (groups || []).map((group) => (
            <TableRow key={group.group_id}>
              <TableCell>
                {group.name}
                {adminView && (<EditLink href={`/groups/edit/?id=${group.group_id}`} ariaLabel="Go to group" /> )}
              </TableCell>
              <TableCell>{group.point_of_contact?.name ?? group.point_of_contact?.email1 ?? ""}</TableCell>
              <TableCell>{group.unix_gid}</TableCell>
              <TableCell>
                <ManagedBySelect
                  value={group.managed_by ?? "APPLICATION"}
                  patchUrl={`/groups/${group.group_id}/users/${userId}`}
                  onSuccess={mutate}
                />
              </TableCell>
              {adminView && (
                <TableCell>
                  <DeleteActionButton
                    url={`/groups/${group.group_id}/users/${userId}`}
                    onSuccess={mutate}
                    ariaLabel="Delete Group"
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

export default UserProjectTable;
