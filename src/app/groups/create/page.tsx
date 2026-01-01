"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { GroupForm } from "@/src/components/Forms/GroupForm/GroupForm";
import type { GroupCreate } from "@/types";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Page() {
  const { isAuthenticated } = useAuthClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: GroupCreate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const groupResponse = await apiFetch("/groups", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const group = await groupResponse.json();
      router.push(`/groups/edit?id=${group.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create group";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">You must be logged in to create a group.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Create Group</Typography>
      </Breadcrumbs>
      <GroupForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
    </Box>
  );
}

export default Page;
