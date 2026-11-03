import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch } from "@/src/components/AuthProvider";
import { fetchJson } from "@/src/utils/fetchList";
import type { BackingStore, DataAccess } from "@/types";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

interface ProjectDataAccessProps {
  projectGroupId: number | null;
}

/**
 * The design's "create a project data access entry" checkbox. An entry can never be removed in the
 * web UI, so once one exists the checkbox is checked and disabled. Staff only (the page decides).
 */
const ProjectDataAccess = ({ projectGroupId }: ProjectDataAccessProps) => {
  const { showAlert } = useAlert();
  const {
    data: entries,
    mutate,
    isLoading,
  } = useSWR(projectGroupId ? `/data_access?group_id=eq.${projectGroupId}` : null, (url: string) =>
    fetchJson<DataAccess[]>(url),
  );
  const { data: stores } = useSWR("/backing_stores?page_size=1000", (url: string) => fetchJson<BackingStore[]>(url));

  const [creating, setCreating] = useState(false);
  const [storeId, setStoreId] = useState<number | "">("");
  const [path, setPath] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!projectGroupId) {
    return (
      <Typography color="text.secondary">This project has no project group, so it cannot have data access.</Typography>
    );
  }

  // Wait for the entry before offering to create one, so an existing entry isn't hidden behind the checkbox
  if (isLoading) {
    return <Skeleton variant="rectangular" height={40} />;
  }

  const storeList = Array.isArray(stores) ? stores : [];
  const entry = Array.isArray(entries) ? entries[0] : undefined;

  if (entry) {
    const storeName = storeList.find((s) => s.id === entry.backing_store_id)?.name ?? `store ${entry.backing_store_id}`;
    return (
      <FormControlLabel
        control={<Checkbox checked disabled />}
        label={
          <>
            Project data access:{" "}
            <MuiLink component={Link} href={`/data-access/edit?id=${entry.id}`}>
              {storeName}:{entry.path}
            </MuiLink>
          </>
        }
      />
    );
  }

  const create = async () => {
    if (storeId === "" || !path.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch("/data_access", {
        method: "POST",
        body: JSON.stringify({ backing_store_id: storeId, group_id: projectGroupId, path: path.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(
          typeof body?.detail === "string" ? body.detail : `Failed to create data access: ${response.statusText}`,
        );
        return;
      }
      showAlert("UPDATE_DATA_ACCESS_SUCCESS");
      setCreating(false);
      await mutate();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={<Checkbox checked={creating} onChange={(e) => setCreating(e.target.checked)} />}
        label="Create a project data access entry"
      />
      {creating && (
        <Box>
          <Stack spacing={2} sx={{ maxWidth: 500 }}>
            <FormControl fullWidth>
              <InputLabel id="project-data-access-store">Backing store</InputLabel>
              <Select
                labelId="project-data-access-store"
                label="Backing store"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value as number | "")}
                disabled={isSubmitting}
              >
                {storeList.map((store) => (
                  <MenuItem key={store.id} value={store.id}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              disabled={isSubmitting}
              helperText="Cannot be changed after the entry is created"
              fullWidth
            />
            {error && <Typography color="error">{error}</Typography>}
            <Box>
              <Button variant="contained" onClick={create} disabled={isSubmitting || storeId === "" || !path.trim()}>
                Create
              </Button>
            </Box>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default ProjectDataAccess;
