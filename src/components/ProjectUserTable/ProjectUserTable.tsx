import { apiFetch } from "@/src/components/AuthProvider";
import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { JoinedProjectView, RoleEnum, User } from "@/types";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import EmptyTableMessage from "../EmptyTableMessage/EmptyTableMessage";

interface ProjectUserTableProps {
  projectId: number;
}

const ProjectUserTable = ({ projectId }: ProjectUserTableProps) => {
  const { data: users, mutate } = useTableFetch<JoinedProjectView[]>(`/projects/${projectId}/users?netid=order_by.asc`);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [role, setRole] = useState<RoleEnum | "">("");
  const [isPrimary, setIsPrimary] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [oldPrimary, setOldPrimary] = useState<JoinedProjectView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setPrimary = (userId: number, otherProjectId: number, value: boolean) =>
    apiFetch(`/projects/${otherProjectId}/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ is_primary: value }),
    });

  const addUser = async (userId: number, demote: JoinedProjectView | null) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (demote) {
        const demoteResponse = await setPrimary(userId, demote.project_id, false);
        if (!demoteResponse.ok) {
          setError(`Failed to remove primary from ${demote.project_name}`);
          return;
        }
      }
      const addResponse = await apiFetch(`/projects/${projectId}/users`, {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          role,
          is_primary: isPrimary,
        }),
      });
      if (!addResponse.ok) {
        // Put the old primary project back so the user is not left without one
        if (demote) await setPrimary(userId, demote.project_id, true);
        setOldPrimary(null);
        setError("Failed to add user to project");
        return;
      }
      setSelectedUser(null);
      setRole("");
      setIsPrimary(false);
      setOldPrimary(null);
      setShowAddForm(false);
      mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser || !role) return;
    if (isPrimary) {
      setIsSubmitting(true);
      setError(null);
      try {
        const response = await apiFetch(`/users/${selectedUser.id}/projects`);
        if (!response.ok) {
          setError("Failed to check the user's current primary project");
          return;
        }
        const projects: JoinedProjectView[] = await response.json();
        const current = projects.find((p) => p.is_primary && p.project_id !== projectId);
        if (current) {
          setOldPrimary(current);
          return;
        }
      } finally {
        setIsSubmitting(false);
      }
    }
    await addUser(selectedUser.id, null);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Project Members</Typography>
        <Button startIcon={showAddForm ? <ArrowDropUp /> : <ArrowDropDown />} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Hide Form" : "Add Member"}
        </Button>
      </Box>

      <Collapse in={showAddForm}>
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Add Project Member
          </Typography>
          <Stack spacing={2}>
            <UserAutocomplete value={selectedUser ?? undefined} onSelect={(user) => setSelectedUser(user || null)} />

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControl sx={{ flex: 1, minWidth: 200 }}>
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

              <FormControlLabel
                control={<Switch checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />}
                label="Primary"
                sx={{ ml: 1 }}
              />

              <Button
                variant="contained"
                color="primary"
                disabled={!selectedUser || !role || isSubmitting || !!oldPrimary}
                onClick={handleAddUser}
                sx={{ minWidth: 120 }}
              >
                Add User
              </Button>
            </Box>

            {oldPrimary && selectedUser && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography color="error" sx={{ flex: 1, minWidth: 0 }}>
                  {selectedUser.name} already has a different primary project: {oldPrimary.project_name}. Make this
                  project their primary project instead? They will stay a member of {oldPrimary.project_name}.
                </Typography>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button variant="contained" disabled={isSubmitting} onClick={() => addUser(selectedUser.id, oldPrimary)}>
                    Confirm
                  </Button>
                  <Button variant="outlined" disabled={isSubmitting} onClick={() => setOldPrimary(null)}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}

            {error && <Typography color="error">{error}</Typography>}
          </Stack>
        </Box>
      </Collapse>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Tickets Assigned</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>NetID</TableCell>
            <TableCell>Active</TableCell>
            <TableCell>Managed By</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users && users.length > 0 ?
            (users || []).map((user) => (
              <TableRow key={user.id}>
                <TableCell><EditLink href={`/users/edit/?id=${user.id}`} ariaLabel="Go to user" />{" "}{user.name}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.last_note_ticket}</TableCell>
                <TableCell>{user.email1}</TableCell>
                <TableCell>{user.netid}</TableCell>
                <TableCell>{user.active == null ? "" : user.active ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <ManagedBySelect
                    value={user.managed_by}
                    patchUrl={`/projects/${projectId}/users/${user.id}`}
                    onSuccess={mutate}
                  />
                </TableCell>
                <TableCell>
                  <DeleteActionButton
                    url={`/projects/${projectId}/users/${user.id}`}
                    onSuccess={mutate}
                    ariaLabel="Remove User"
                  />
                </TableCell>
              </TableRow>
            )) : <EmptyTableMessage message="No users" />}
        </TableBody>
      </Table>
    </Box>
  );
};

export default ProjectUserTable;
