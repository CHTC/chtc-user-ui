import { apiFetch } from "@/src/components/AuthProvider";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import EditLink from "@/src/components/EditLink/EditLink";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import { useTableFetch } from "@/src/utils/useTableFetch";
import { JoinedProjectView, RoleEnum, User } from "@/types";
import { ArrowDropDown, ArrowDropUp, Delete } from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
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

  // The API demotes the user's other primary project when this one is added as primary
  const addUser = async (userId: number) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch(`/projects/${projectId}/users`, {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          role,
          is_primary: isPrimary,
        }),
      });
      if (!response.ok) {
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
    await addUser(selectedUser.id);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Project Members</Typography>
        <Button variant="contained" startIcon={showAddForm ? <ArrowDropUp /> : <ArrowDropDown />} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? "Hide Form" : "Add Member"}
        </Button>
      </Box>

      <Collapse in={showAddForm}>
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Add Project Member
          </Typography>
          <Stack spacing={2}>
            {/* Changing the user or the Primary switch clears the old primary warning, since it no longer applies */}
            <UserAutocomplete
              value={selectedUser ?? undefined}
              onSelect={(user) => {
                setSelectedUser(user || null);
                setOldPrimary(null);
              }}
            />

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
                control={
                  <Switch
                    checked={isPrimary}
                    onChange={(e) => {
                      setIsPrimary(e.target.checked);
                      setOldPrimary(null);
                    }}
                  />
                }
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
              <Alert
                severity="warning"
                sx={{ "& .MuiAlert-action": { alignSelf: "center", pt: 0 } }}
                action={
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" disabled={isSubmitting} onClick={() => addUser(selectedUser.id)}>
                      Confirm
                    </Button>
                    <Button variant="outlined" disabled={isSubmitting} onClick={() => setOldPrimary(null)}>
                      Cancel
                    </Button>
                  </Stack>
                }
              >
                <AlertTitle>User Already Has a Primary Project</AlertTitle>
                <Box>
                  {selectedUser.name} already has a different primary project: {oldPrimary.project_name}. Make this
                  project their primary project instead? They will stay a member of {oldPrimary.project_name}.
                </Box>
              </Alert>
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
                  <ActionButton
                    method="DELETE"
                    icon={<Delete />}
                    color="error"
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
