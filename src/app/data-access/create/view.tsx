"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import { AuthGuard } from "@/src/components/AuthGuard";
import { DataAccessForm } from "@/src/components/Forms/DataAccessForm/DataAccessForm";
import { fetchJson, submitJson } from "@/src/utils/fetchList";
import { ApiError } from "@/src/utils/formErrors";
import type { DataAccess, DataAccessCreate, DataAccessUpdate, Group } from "@/types";
import { Alert, Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";

const CreateForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupId = Number.parseInt(searchParams.get("group_id") || "") || null;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);

  // Preloads the group the "create data access entry for this group" link came from
  const { data: group } = useSWR(groupId ? [`/groups/${groupId}`] : null, () => fetchJson<Group>(`/groups/${groupId}`), {
    shouldRetryOnError: false,
  });

  const handleSubmit = async (payload: DataAccessCreate | DataAccessUpdate) => {
    setError(null);
    setIsSubmitting(true);
    const result = await submitJson<DataAccess>("/data_access", "POST", payload, "Failed to create data access entry");
    setIsSubmitting(false);
    if (result.data === null) {
      setError(result.error);
      return;
    }
    router.push(`/data-access/edit?id=${result.data.id}`);
  };

  return (
    <DataAccessForm key={group?.id ?? "none"} mode="create" initialGroup={group} onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
  );
};

function View() {
  const { currentUser } = useAuthClient();

  return (
    <AuthGuard message="You must be logged in to create a data access entry.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Create Data Access</Typography>
        </Breadcrumbs>
        {currentUser?.is_admin ? (
          <CreateForm />
        ) : (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Only staff can create data access entries.
          </Alert>
        )}
      </Box>
    </AuthGuard>
  );
}

export default View;
