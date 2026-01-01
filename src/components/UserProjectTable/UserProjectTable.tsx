import { apiFetch } from "@/src/components/AuthProvider";
import { JoinedProjectView } from "@/types";
import { Delete } from "@mui/icons-material";
import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import useSWR from "swr";

import { ConfirmButton } from "@chtc/web-components";

interface UserProjectTableProps {
  userId: number;
}

const UserProjectTable = ({ userId }: UserProjectTableProps) => {
  const { data: projects, mutate } = useSWR(
    `/users/${userId}/projects`,
    async (): Promise<JoinedProjectView[]> => {
      const projectUserResponse = await apiFetch(`/users/${userId}/projects`);
      return projectUserResponse.json();
    },
    { suspense: true },
  );

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
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {projects &&
          (projects || []).map((project) => (
            <TableRow key={project.project_id}>
              <TableCell>{project.project_name}</TableCell>
              <TableCell>{project.role}</TableCell>
              <TableCell>{project.is_primary ? "Yes" : "No"}</TableCell>
              <TableCell>
                {project.project_staff1} {project.project_staff2}
              </TableCell>
              <TableCell>{project.project_status}</TableCell>
              <TableCell>
                {project.project_last_contact ? new Date(project.project_last_contact).toLocaleString() : ""}
              </TableCell>
              <TableCell>{project.project_accounting_group}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ConfirmButton
                    aria-label={"Delete Note"}
                    color={"error"}
                    onConfirm={async () => {
                      await apiFetch(`/projects/${project.project_id}/users/${userId}`, {
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
