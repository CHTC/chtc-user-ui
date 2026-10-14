import ActionButton from "@/src/components/ActionButton/ActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { JoinedProjectView } from "@/types";
import { Star, StarBorder, Delete } from "@mui/icons-material";
import { Box, IconButton, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import EmptyTableMessage from "../EmptyTableMessage/EmptyTableMessage";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import { useAlert } from "@/src/components/AlertProvider";

interface UserProjectTableProps {
  userId: number;
  adminView?: boolean;
}

const UserProjectTable = ({ userId, adminView=false }: UserProjectTableProps) => {
  const { data: projects, mutate } = useTableFetch<JoinedProjectView[]>(`/users/${userId}/projects`);
  const { showAlert } = useAlert();

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Role</TableCell>
          <TableCell>Is Primary</TableCell>
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
        {projects && projects.length > 0 ?
          (projects || []).map((project) => (
            <TableRow key={project.project_id}>
              <TableCell>
                {project.project_name}{" "}
                <EditLink href={`/projects/edit/?id=${project.project_id}`} ariaLabel="Go to project" />
              </TableCell>
              <TableCell>{project.role}</TableCell>
              <TableCell>
                {project.is_primary ? (
                  // The primary project is changed by starring another one, so this does nothing
                  // Same 48px box and padding as ConfirmButton so the stars line up
                  <Box sx={{ width: 48, height: 48, p: 0.5 }}>
                    <IconButton aria-label={`${project.project_name} is the primary project`} color="error" disableRipple sx={{ cursor: "default" }}>
                      <Star />
                    </IconButton>
                  </Box>
                ) : (
                  adminView && (
                    <ActionButton
                      url={`/users/${userId}/projects/${project.project_id}`}
                      method="PATCH"
                      body={{ is_primary: true }}
                      icon={<StarBorder />}
                      color="error"
                      ariaLabel={`Make ${project.project_name} the primary project`}
                      onSuccess={() => {
                        showAlert("UPDATE_PRIMARY_PROJECT_SUCCESS", project.project_name);
                        mutate();
                      }}
                      onError={(detail) => showAlert("UPDATE_PRIMARY_PROJECT_ERROR", detail)}
                    />
                  )
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
                  <ActionButton
                    method="DELETE"
                    icon={<Delete />}
                    color="error"
                    url={`/projects/${project.project_id}/users/${userId}`}
                    onSuccess={mutate}
                    ariaLabel="Delete User"
                  />
                </TableCell>
              )}
            </TableRow>
          )) : <EmptyTableMessage message="No projects" />}
      </TableBody>
    </Table>
  );
};

export default UserProjectTable;
