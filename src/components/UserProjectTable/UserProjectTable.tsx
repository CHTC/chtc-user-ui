import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { JoinedProjectView } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";

interface UserProjectTableProps {
  userId: number;
  adminView?: boolean;
}

const UserProjectTable = ({ userId, adminView=false }: UserProjectTableProps) => {
  const { data: projects, mutate } = useTableFetch<JoinedProjectView[]>(`/users/${userId}/projects`);

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Role</TableCell>
          <TableCell>Is Primary</TableCell>
          <TableCell>Staff</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Last Contact</TableCell>
          <TableCell>Accounting Group</TableCell>
          {adminView && (
            <>
              <TableCell>Managed By</TableCell>
              <TableCell>Action</TableCell>
            </>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {projects &&
          (projects || []).map((project) => (
            <TableRow key={project.project_id}>
              <TableCell>
                {project.project_name}{" "}
                <EditLink href={`/projects/edit/?id=${project.project_id}`} ariaLabel="Go to project" />
              </TableCell>
              <TableCell>{project.role}</TableCell>
              <TableCell>{project.is_primary ? "Yes" : "No"}</TableCell>
              <TableCell>
                {project.project_staff1?.name ?? project.project_staff2?.email1 ?? ""}
                {project.project_staff2 && (
                  <>
                    <br />
                    {project.project_staff2?.name ?? project.project_staff2?.email1 ?? ""}
                  </>
                )}
              </TableCell>
              <TableCell>{project.project_status}</TableCell>
              <TableCell>
                {project.project_last_contact ? new Date(project.project_last_contact).toLocaleString() : ""}
              </TableCell>
              <TableCell>{project.project_accounting_group}</TableCell>
              {adminView && (
                <TableCell>
                  <ManagedBySelect
                    value={project.managed_by}
                    patchUrl={`/projects/${project.project_id}/users/${userId}`}
                    onSuccess={mutate}
                  />
                </TableCell>
              )}
              {adminView && (
                <TableCell>
                  <DeleteActionButton
                    url={`/projects/${project.project_id}/users/${userId}`}
                    onSuccess={mutate}
                    ariaLabel="Delete User"
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
