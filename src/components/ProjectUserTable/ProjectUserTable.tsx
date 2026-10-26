import { apiFetch } from "@/src/components/AuthProvider";
import makeDeleteCell from "@/src/components/Table/DeleteCell/makeDeleteCell";
import ServerTable, {
  ServerTableColumns,
  ServerTableFilter,
  useServerTableRefresh,
} from "@/src/components/Table/ServerTable";
import type { SortState } from "@/src/components/Table/types";
import { makeLinkedTextCell, makeManagedByCell } from "@/src/components/TableCells/TableCells";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { apiDelete, apiPageFetcher } from "@/src/utils/tableQuery";
import { JoinedProjectView, RoleEnum, User } from "@/types";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
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
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const activeFilter: ServerTableFilter[] = [
  {
    id: "active",
    label: "Active",
    options: [
      { value: "true", label: "Active" },
      { value: "false", label: "Inactive" },
    ],
  },
];

// Active members first, then alphabetical
const defaultSort: SortState<keyof JoinedProjectView & string> = { columnId: "active", direction: "desc" };

const fetchOptions = {
  searchFields: ["name", "netid", "email1"],
  tiebreakers: [
    { columnId: "name", direction: "asc" },
    { columnId: "id", direction: "asc" },
  ] satisfies SortState[],
  filterOperators: { active: "is" } as const,
};

interface ProjectUserTableProps {
  projectId: number;
}

const ProjectUserTable = ({ projectId }: ProjectUserTableProps) => {
  const cacheKey = `/projects/${projectId}/users`;
  const refresh = useServerTableRefresh(cacheKey);
  const fetchPage = useMemo(() => apiPageFetcher<JoinedProjectView>(cacheKey, fetchOptions), [cacheKey]);

  const columns = useMemo(
    (): ServerTableColumns<JoinedProjectView> => ({
      name: {
        id: "name",
        name: "Name",
        sortable: true,
        CellComponent: makeLinkedTextCell<JoinedProjectView>({ href: (user) => `/users/edit/?id=${user.id}`, ariaLabel: "Go to user" }),
      },
      role: { id: "role", name: "Role", sortable: true },
      last_note_ticket: { id: "last_note_ticket", name: "Tickets Assigned", sortable: true },
      email1: { id: "email1", name: "Email", sortable: true },
      netid: { id: "netid", name: "NetID", sortable: true },
      active: {
        id: "active",
        name: "Active",
        sortable: true,
        value: (user) => (user.active == null ? "" : user.active ? "Yes" : "No"),
      },
      managed_by: {
        id: "managed_by",
        name: "Managed By",
        CellComponent: makeManagedByCell<JoinedProjectView>({
          patchUrl: (user) => `/projects/${projectId}/users/${user.id}`,
          onSuccess: refresh,
        }),
      },
      remove: {
        id: "remove",
        name: "Action",
        CellComponent: makeDeleteCell<JoinedProjectView>({
          mutate: refresh,
          handleDelete: (user) => apiDelete(`/projects/${projectId}/users/${user.id}`),
          confirmButtonProps: { "aria-label": "Remove User" },
        }),
      },
    }),
    [projectId, refresh],
  );

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
      refresh();
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

      <ServerTable
        cacheKey={cacheKey}
        fetchPage={fetchPage}
        columns={columns}
        defaultSort={defaultSort}
        defaultPageSize={10}
        urlPrefix="users."
        searchLabel="Search by Name, NetID, or Email"
        filters={activeFilter}
        emptyMessage="No users"
      />
    </Box>
  );
};

export default ProjectUserTable;
