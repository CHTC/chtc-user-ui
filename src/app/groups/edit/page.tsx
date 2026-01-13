"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import { GroupForm } from "@/src/components/Forms/GroupForm/GroupForm";
import GroupUserTable from "@/src/components/GroupUserTable/GroupUserTable";
import { ApiError } from "@/src/utils/formErrors";
import type { GroupCreateUpdate } from "@/types";
import { Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

function Page() {
  const handleSubmit = async (
    id: number,
    payload: GroupCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/groups/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to parse structured error response
        try {
          const errorData = await response.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to update group: ${response.statusText}`);
        }
        return;
      }

      update();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update group";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to edit a group.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Update Group</Typography>
        </Breadcrumbs>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <GroupPage handleSubmit={handleSubmit} />
        </Suspense>
      </Box>
    </AuthGuard>
  );
}

// Fetcher function for SWR
const groupFetcher = async (id: number | null) => {
  if (!id) return null;
  const response = await apiFetch(`/groups/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch group with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

const GroupFormSuspense = ({
  id,
  handleSubmit,
}: {
  id: number | null;
  handleSubmit: (
    id: number,
    payload: GroupCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const { data: group, mutate } = useSWR(id ? [`/groups/${id}`] : null, () => groupFetcher(id), { suspense: true });
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!id) {
    return <p>No group ID provided.</p>;
  }

  return (
    <GroupForm
      mode="edit"
      initialValues={group}
      onSubmit={(payload: GroupCreateUpdate) => handleSubmit(id, payload, mutate, setError, setIsSubmitting)}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
};

const GroupPage = ({
  handleSubmit,
}: {
  handleSubmit: (
    id: number,
    payload: GroupCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No group ID provided.</Typography>;
  }

  return (
    <>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100px"} />}>
        <GroupFormSuspense id={id} handleSubmit={handleSubmit} />
      </Suspense>
      <Box>
        <Typography variant={"h4"} component="h3" mt={4}>
          Users
        </Typography>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"100px"} />}>
          <GroupUserTable groupId={id} />
        </Suspense>
      </Box>
    </>
  );
};

export default Page;
