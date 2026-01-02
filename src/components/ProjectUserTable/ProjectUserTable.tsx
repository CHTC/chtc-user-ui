import { apiFetch } from "@/src/components/AuthProvider";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { JoinedProjectView, RoleEnum, User } from "@/types";
import { Delete } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

import { ConfirmButton } from "@chtc/web-components";

interface ProjectUserTableProps {
  projectId: number;
}

const ProjectUserTable = ({ projectId }: ProjectUserTableProps) => {
  const { data: users, mutate } = useSWR(
    `/projects/${projectId}/users`,
    async (): Promise<JoinedProjectView[]> => {
      const projectUserResponse = await apiFetch(`/projects/${projectId}/users`);
      return projectUserResponse.json();
    },
    { suspense: true },
  );

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleEnum | "">("");
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddUser = async () => {
    if (!selectedUser || !role) return;
    setIsSubmitting(true);
    try {
      await apiFetch(`/projects/${projectId}/users`, {
        method: "POST",
        body: JSON.stringify({
          user_id: selectedUser.id,
          role,
          is_primary: isPrimary,
        }),
      });
      setSelectedUser(null);
      setRole("");
      setIsPrimary(false);
      mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Username</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Role</TableCell>
          <TableCell>Tickets Assigned</TableCell>
          <TableCell>Email</TableCell>
          <TableCell>Phone</TableCell>
          <TableCell>NetID</TableCell>
          <TableCell>Action</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users &&
          (users || []).map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.last_note_ticket}</TableCell>
              <TableCell>{user.email1}</TableCell>
              <TableCell>{user.phone1}</TableCell>
              <TableCell>{user.netid}</TableCell>
              <TableCell>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <ConfirmButton
                    aria-label={"Delete Note"}
                    color={"error"}
                    onConfirm={async () => {
                      await apiFetch(`/projects/${projectId}/users/${user.id}`, {
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
        <TableRow>
          <TableCell colSpan={8} align="center">
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 2,
                width: "100%",
              }}
            >
              <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 20%" }, minWidth: 0 }}>
                <UserAutocomplete
                  value={selectedUser ?? undefined}
                  onSelect={(user) => setSelectedUser(user || null)}
                />
              </Box>

              <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 15%" }, minWidth: 0 }}>
                <FormControl fullWidth>
                  <InputLabel id="role-select-label">Role</InputLabel>
                  <Select
                    labelId="role-select-label"
                    label="Role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as RoleEnum | "")}
                  >
                    <MenuItem value="">Select Role</MenuItem>
                    <MenuItem value="MEMBER">Member</MenuItem>
                    <MenuItem value="PI">PI</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box
                sx={{
                  flex: { xs: "1 1 100%", md: "1 1 15%" },
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "center" },
                }}
              >
                <FormControlLabel
                  control={<Switch checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
                  label="Primary"
                />
              </Box>

              <Box
                sx={{
                  flex: { xs: "1 1 100%", md: "1 1 25%" },
                  minWidth: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: { xs: "flex-start", md: "flex-end" },
                }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!selectedUser || !role || isSubmitting}
                  onClick={handleAddUser}
                >
                  Add User
                </Button>
              </Box>
            </Box>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};

export default ProjectUserTable;
