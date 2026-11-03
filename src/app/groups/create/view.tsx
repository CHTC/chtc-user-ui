"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { GroupForm } from "@/src/components/Forms/GroupForm/GroupForm";
import { ApiError } from "@/src/utils/formErrors";
import type { GroupCreateUpdate } from "@/types";
import { Alert, Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function View() {
  const router = useRouter();
  const { currentUser } = useAuthClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);

  const handleSubmit = async (payload: GroupCreateUpdate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const groupResponse = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!groupResponse.ok) {
        // Try to parse structured error response
        try {
          const errorData = await groupResponse.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to create group: ${groupResponse.statusText}`);
        }
        return;
      }

      const group = await groupResponse.json();
      router.push(`/groups/edit?id=${group.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create group";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to create a group.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Create Group</Typography>
        </Breadcrumbs>
        {currentUser?.is_admin ? (
          <GroupForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
        ) : (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Only staff can create groups.
          </Alert>
        )}
      </Box>
    </AuthGuard>
  );
}

export default View;
