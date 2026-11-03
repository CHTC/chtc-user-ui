import { useAlert } from "@/src/components/AlertProvider";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import EditLink from "@/src/components/EditLink/EditLink";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import MembershipPaths from "@/src/components/MembershipPaths/MembershipPaths";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { fetchJson } from "@/src/utils/fetchList";
import type { GroupMembersView, JoinedProjectView, Project, User } from "@/types";
import { ArrowDropDown, ArrowDropUp, Check, Delete, Star, StarBorder } from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

interface ProjectMembersTableProps {
  projectId: number;
  project: Project;
}

// Large enough that one request covers any project; the table has no paging controls
const ALL_ROWS = "page_size=10000";

/**
 * Everyone with access through the project group, and how. The members route carries the
 * access paths; /projects/{id}/users adds the PI and primary flags, so the two are merged by user id.
 * Controls are shown to everyone who can load the page; the API rejects what the viewer may not do.
 */
const ProjectMembersTable = ({ projectId, project }: ProjectMembersTableProps) => {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const { showAlert } = useAlert();
  const groupId = project.project_group_id;

  const {
    data: members,
    mutate: mutateMembers,
    isLoading,
  } = useSWR(groupId ? `/groups/${groupId}/members?${ALL_ROWS}` : null, (url: string) =>
    fetchJson<GroupMembersView[]>(url),
  );
  const { data: projectUsers, mutate: mutateUsers } = useSWR(
    `/projects/${projectId}/users?${ALL_ROWS}`,
    (url: string) => fetchJson<JoinedProjectView[]>(url),
  );

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    void mutateMembers();
    void mutateUsers();
  };

  if (!groupId) {
    return <Typography color="text.secondary">This project has no project group, so it has no members.</Typography>;
  }

  const flags = new Map((projectUsers ?? []).map((u) => [u.id, u]));
  const rows = Array.isArray(members)
    ? members.map((m) => ({
        ...m,
        is_pi: flags.get(m.user_id)?.is_pi ?? false,
        is_primary: flags.get(m.user_id)?.is_primary ?? false,
      }))
    : [];
  rows.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

  const addUser = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch(`/projects/${projectId}/users`, {
        method: "POST",
        body: JSON.stringify({ user_id: selectedUser.id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(typeof body?.detail === "string" ? body.detail : "Failed to add user to project");
        return;
      }
      showAlert("ADD_MEMBER_SUCCESS", selectedUser.name ?? selectedUser.email1);
      setSelectedUser(null);
      setShowAddForm(false);
      refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Project Members</Typography>
        <Button
          variant="contained"
          startIcon={showAddForm ? <ArrowDropUp /> : <ArrowDropDown />}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Hide Form" : "Add Member"}
        </Button>
      </Box>

      <Collapse in={showAddForm}>
        <Box sx={{ mb: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
          <Stack spacing={2}>
            <UserAutocomplete value={selectedUser ?? undefined} onSelect={(user) => setSelectedUser(user)} />
            <Box>
              <Button variant="contained" disabled={!selectedUser || isSubmitting} onClick={addUser}>
                Add User
              </Button>
            </Box>
            {error && <Typography color="error">{error}</Typography>}
          </Stack>
        </Box>
      </Collapse>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>NetID</TableCell>
            <TableCell>Access</TableCell>
            <TableCell>PI</TableCell>
            <TableCell>Primary</TableCell>
            {isStaff && <TableCell>Managed By</TableCell>}
            <TableCell>Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.user_id}>
              <TableCell>
                <EditLink href={`/users/edit/?id=${row.user_id}`} ariaLabel="Go to user" />
              </TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.netid}</TableCell>
              <TableCell>
                <MembershipPaths
                  direct={row.direct}
                  paths={row.paths}
                  path_names={row.path_names}
                  linkGroups={isStaff}
                />
              </TableCell>
              <TableCell>{row.is_pi && <Check aria-label="PI" color="success" />}</TableCell>
              <TableCell>
                {row.is_primary ? (
                  // Same 48px box and padding as ConfirmButton so the stars line up
                  <Box sx={{ width: 48, height: 48, p: 0.5 }}>
                    <IconButton aria-label="Primary project" color="error" disableRipple sx={{ cursor: "default" }}>
                      <Star />
                    </IconButton>
                  </Box>
                ) : (
                  isStaff && (
                    <ActionButton
                      url={`/users/${row.user_id}`}
                      method="PATCH"
                      body={{ primary_project_id: projectId }}
                      icon={<StarBorder />}
                      color="error"
                      ariaLabel={`Make ${project.name} the primary project of ${row.name ?? "this user"}`}
                      onSuccess={() => {
                        showAlert("UPDATE_PRIMARY_PROJECT_SUCCESS", project.name);
                        refresh();
                      }}
                      onError={(detail) => showAlert("UPDATE_PRIMARY_PROJECT_ERROR", detail)}
                    />
                  )
                )}
              </TableCell>
              {isStaff && (
                <TableCell>
                  {row.direct && row.managed_by && (
                    <ManagedBySelect
                      value={row.managed_by}
                      patchUrl={`/groups/${groupId}/members/users/${row.user_id}`}
                      onSuccess={refresh}
                    />
                  )}
                </TableCell>
              )}
              <TableCell>
                {row.direct && (
                  <ActionButton
                    method="DELETE"
                    icon={<Delete />}
                    color="error"
                    url={`/projects/${projectId}/users/${row.user_id}`}
                    onSuccess={() => {
                      showAlert("REMOVE_MEMBER_SUCCESS", row.name ?? row.netid ?? String(row.user_id));
                      refresh();
                    }}
                    ariaLabel="Remove User"
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!isLoading && rows.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
          No members
        </Typography>
      )}
    </Box>
  );
};

export default ProjectMembersTable;
