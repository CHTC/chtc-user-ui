"use client";

import { useAlert } from "@/src/components/AlertProvider";
import { useAuthClient } from "@/src/components/AuthProvider";
import { AuthGuard } from "@/src/components/AuthGuard";
import { DataAccessForm } from "@/src/components/Forms/DataAccessForm/DataAccessForm";
import GroupMembersPanel from "@/src/components/GroupMembersPanel";
import { fetchJson, ForbiddenError, submitJson } from "@/src/utils/fetchList";
import { ApiError } from "@/src/utils/formErrors";
import usePageTitle from "@/src/utils/usePageTitle";
import type { DataAccess, DataAccessCreate, DataAccessUpdate, Group } from "@/types";
import { Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

function View() {
  return (
    <AuthGuard message="You must be logged in to view a data access entry.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Data Access</Typography>
        </Breadcrumbs>
        <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
          <DataAccessPage />
        </Suspense>
      </Box>
    </AuthGuard>
  );
}

const entryFetcher = async (id: number): Promise<DataAccess | "forbidden"> => {
  try {
    return await fetchJson<DataAccess>(`/data_access/${id}`);
  } catch (e) {
    if (e instanceof ForbiddenError) return "forbidden";
    throw e;
  }
};

const DataAccessPage = () => {
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const { currentUser } = useAuthClient();
  const isStaff = !!currentUser?.is_admin;
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  const { data: entry, mutate } = useSWR(id ? [`/data_access/${id}`] : null, () => entryFetcher(id!), { suspense: true });
  const groupId = entry && entry !== "forbidden" ? entry.group_id : null;
  // Not suspense: a group the viewer cannot read should leave the field empty, not crash the page
  const { data: group } = useSWR(groupId ? [`/groups/${groupId}`] : null, () => fetchJson<Group>(`/groups/${groupId}`), {
    shouldRetryOnError: false,
  });

  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePageTitle(entry && entry !== "forbidden" ? `Data access: ${entry.path}` : null);

  if (!id) return <Typography color="error">No data access ID provided.</Typography>;
  if (!entry || entry === "forbidden") {
    return <Typography color="error">You do not have access to this data access entry</Typography>;
  }

  const handleSubmit = async (payload: DataAccessCreate | DataAccessUpdate) => {
    setError(null);
    setIsSubmitting(true);
    const result = await submitJson<DataAccess>(`/data_access/${id}`, "PUT", payload, "Failed to update data access entry");
    setIsSubmitting(false);
    if (result.data === null) {
      setError(result.error);
      return;
    }
    await mutate();
    showAlert("UPDATE_DATA_ACCESS_SUCCESS");
  };

  return (
    <>
      {/* key remounts the form with the saved values once the group name arrives */}
      <DataAccessForm
        key={`${entry.updated_at}-${group?.id ?? ""}`}
        mode="edit"
        initialValues={entry}
        initialGroup={group}
        canEdit={isStaff}
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
      />

      <Box mt={5}>
        <Typography variant="h4" component="h3" mb={2}>
          Members
        </Typography>
        {entry.group_id === null ? (
          <Typography>This entry grants access to nobody</Typography>
        ) : (
          <Suspense fallback={<Skeleton variant="rectangular" height="100px" />}>
            {/* Only staff and the group's owners can load this page, so a non-staff viewer here can administer */}
            <GroupMembersPanel groupId={entry.group_id} canAdminister={true} />
          </Suspense>
        )}
      </Box>
    </>
  );
};

export default View;
