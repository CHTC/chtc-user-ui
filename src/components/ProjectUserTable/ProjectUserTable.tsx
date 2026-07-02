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
      setShowAddForm(false);
      mutate();
    } finally {
      setIsSubmitting(false);
    }
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
                disabled={!selectedUser || !role || isSubmitting}
                onClick={handleAddUser}
                sx={{ minWidth: 120 }}
              >
                Add User
              </Button>
            </Box>
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
