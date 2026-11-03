import { useAlert } from "@/src/components/AlertProvider";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import EditLink from "@/src/components/EditLink/EditLink";
import MembershipPaths from "@/src/components/MembershipPaths/MembershipPaths";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { fetchJson } from "@/src/utils/fetchList";
import type { GroupMembersView, User } from "@/types";
import { Delete } from "@mui/icons-material";
import { Box, Button, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

interface ProjectPiTableProps {
  projectId: number;
}

/** The project's PIs (effective members of its pi group). Only staff add or remove them. */
const ProjectPiTable = ({ projectId }: ProjectPiTableProps) => {
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const { showAlert } = useAlert();
  const {
    data: pis,
    mutate,
    isLoading,
  } = useSWR(`/projects/${projectId}/pis?page_size=10000`, (url: string) => fetchJson<GroupMembersView[]>(url));

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addPi = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch(`/projects/${projectId}/pis`, {
        method: "POST",
        body: JSON.stringify({ user_id: selectedUser.id }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(typeof body?.detail === "string" ? body.detail : "Failed to add PI");
        return;
      }
      showAlert("ADD_MEMBER_SUCCESS", selectedUser.name ?? selectedUser.email1);
      setSelectedUser(null);
      void mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows = Array.isArray(pis) ? pis : [];

  return (
    <Box>
      {isStaff && (
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Box sx={{ flexGrow: 1, maxWidth: 500 }}>
            <UserAutocomplete
              label="Add PI"
              value={selectedUser ?? undefined}
              onSelect={(user) => setSelectedUser(user)}
            />
          </Box>
          <Button variant="contained" disabled={!selectedUser || isSubmitting} onClick={addPi}>
            Add PI
          </Button>
        </Stack>
      )}
      {error && (
        <Typography color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>User</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>NetID</TableCell>
            <TableCell>Access</TableCell>
            {isStaff && <TableCell>Remove</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((pi) => (
            <TableRow key={pi.user_id}>
              <TableCell>
                <EditLink href={`/users/edit/?id=${pi.user_id}`} ariaLabel="Go to user" />
              </TableCell>
              <TableCell>{pi.name}</TableCell>
              <TableCell>{pi.netid}</TableCell>
              <TableCell>
                <MembershipPaths direct={pi.direct} paths={pi.paths} path_names={pi.path_names} linkGroups={isStaff} />
              </TableCell>
              {isStaff && (
                <TableCell>
                  {/* Only direct pi group members can be removed here; the API's 404 explains the rest */}
                  <ActionButton
                    method="DELETE"
                    icon={<Delete />}
                    color="error"
                    url={`/projects/${projectId}/pis/${pi.user_id}`}
                    onSuccess={() => {
                      showAlert("REMOVE_MEMBER_SUCCESS", pi.name ?? pi.netid ?? String(pi.user_id));
                      void mutate();
                    }}
                    ariaLabel="Remove PI"
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {!isLoading && rows.length === 0 && (
        <Typography color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
          No PIs
        </Typography>
      )}
    </Box>
  );
};

export default ProjectPiTable;
