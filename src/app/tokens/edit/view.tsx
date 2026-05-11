"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import DeleteActionButton from "@/src/components/DeleteActionButton/DeleteActionButton";
import type { TokenGet, TokenPermissionGet } from "@/types";
import {
  Box,
  Breadcrumbs,
  Grid,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";
import { RouteAutocomplete } from "@/src/components/RouteAutocomplete";

function View() {
  return (
    <AuthGuard message="You must be logged in to view token details.">
      <Box>
        <Breadcrumbs>
          <Typography variant={"h4"} color="text.primary">
            Basic Info
          </Typography>
        </Breadcrumbs>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"300px"} />}>
          <TokenPage />
        </Suspense>
      </Box>
    </AuthGuard>
  );
}

// Fetcher function for SWR
const tokenFetcher = async (id: number | null): Promise<TokenGet> => {
  if (!id) return Promise.reject(new Error("No token ID provided"));
  const response = await apiFetch(`/tokens/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch token with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

// Fetcher function for SWR
const tokenPermissionsFetcher = async (id: number | null): Promise<TokenPermissionGet[]> => {
  if (!id) return [];
  const response = await apiFetch(`/tokens/${id}/permissions`);
  if (!response.ok) {
    throw new Error(`Failed to fetch permissions for token with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

const TokenPage = () => {

  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  const { data: token, mutate: mutateToken } = useSWR(id ? [`/tokens/${id}`] : null, () => tokenFetcher(id), {
    suspense: true,
  });

  const { data: permissions, mutate: mutatePermissions } = useSWR(
    id ? [`/tokens/${id}/permissions`] : null,
    () => tokenPermissionsFetcher(id),
    {
      suspense: true,
    },
  );

  if (!id) {
    return <Typography color="error">No token ID provided.</Typography>;
  }

  const tokenData = token as TokenGet;

  return (
    <Grid container>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              ID
            </Typography>
            <Typography variant="body1">{tokenData.id}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">{tokenData.description}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Created By (User ID)
            </Typography>
            <Typography variant="body1">{tokenData.created_by}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Created At
            </Typography>
            <Typography variant="body1">{new Date(tokenData.created_at).toLocaleString()}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="text.secondary">
              Expires At
            </Typography>
            <Typography variant="body1">
              {tokenData.expires_at ? new Date(tokenData.expires_at).toLocaleString() : "Never"}
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <DeleteActionButton url={`/tokens/${id}`} onSuccess={mutateToken} />
          </Box>
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, lg: 6 }}>
        <Typography variant="subtitle1" color="text.secondary">
          Permissions
        </Typography>
        <RouteAutocomplete
          label={"Select a route to add permission"}
          onSelect={async (r) => {
            await apiFetch(`/tokens/${id}/permissions`, {
              method: "POST",
              body: JSON.stringify({
                method: r?.method,
                route: r?.route,
              }),
            });
            mutatePermissions();
          }}
        />
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Method</TableCell>
              <TableCell>Route</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {permissions.map((perm, index) => (
              <TableRow key={index}>
                <TableCell>{perm.method}</TableCell>
                <TableCell>{perm.route}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Grid>
    </Grid>
  );
};

export default View;
