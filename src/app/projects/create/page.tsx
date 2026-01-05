"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import { ProjectForm } from "@/src/components/Forms/ProjectForm/ProjectForm";
import { ApiError } from "@/src/utils/formErrors";
import type { ProjectCreateUpdate } from "@/types";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Page() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);

  const handleSubmit = async (payload: ProjectCreateUpdate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const projectResponse = await apiFetch("/projects", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!projectResponse.ok) {
        // Try to parse structured error response
        try {
          const errorData = await projectResponse.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to create project: ${projectResponse.statusText}`);
        }
        return;
      }

      const project = await projectResponse.json();
      router.push(`/projects/edit?id=${project.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create project";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to create a project.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Create Project</Typography>
        </Breadcrumbs>
        <ProjectForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
      </Box>
    </AuthGuard>
  );
}

export default Page;
