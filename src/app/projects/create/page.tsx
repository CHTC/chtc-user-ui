"use client";

import React, {Suspense, useState} from "react";
import { useRouter } from "next/navigation";
import {Box, Breadcrumbs, Typography} from "@mui/material";
import {apiFetch, useAuthClient} from "@/src/components/AuthProvider";
import { ProjectForm } from "@/src/components/Forms/ProjectForm/ProjectForm";
import type { ProjectCreate } from "@/src/util/types";

function Page() {
  const { isAuthenticated } = useAuthClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: ProjectCreate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const groupResponse = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      })
      const group = await groupResponse.json();
      router.push(`/projects/edit?id=${group.id}`);
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
      <ProjectForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Box>
  );
}

export default Page;

