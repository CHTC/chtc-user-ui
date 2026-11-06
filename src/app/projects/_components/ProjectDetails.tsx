"use client";

import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { ProjectForm } from "@/src/components/Forms/ProjectForm/ProjectForm";
import { useReadableGroup } from "@/src/utils/groupCache";
import { ApiError } from "@/src/utils/formErrors";
import { useProject } from "@/src/utils/useProject";
import type { Project, ProjectCreateUpdate } from "@/types";
import { Delete } from "@mui/icons-material";
import { Box, Chip, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** The project's own fields, the delete control, and links to the groups behind it */
const ProjectDetails = ({ project, id }: { project: Project; id: number }) => {
  const { mutate } = useProject(id);
  const { currentUser } = useAuthClient();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const piGroup = useReadableGroup(project.pi_group_id);
  const projectGroup = useReadableGroup(project.project_group_id);

  const handleSubmit = async (payload: ProjectCreateUpdate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Try to parse structured error response
        try {
          setError((await response.json()) as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to update project: ${response.statusText}`);
        }
        return;
      }

      await mutate();
      showAlert("UPDATE_PROJECT_SUCCESS");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update project");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {currentUser?.is_admin && (
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography>Delete project</Typography>
          <ActionButton
            method="DELETE"
            icon={<Delete />}
            color="error"
            url={`/projects/${id}`}
            ariaLabel="Delete project"
            onSuccess={() => {
              showAlert("DELETE_PROJECT_SUCCESS", project.name);
              router.push("/projects/");
            }}
          />
        </Box>
      )}
      <ProjectForm
        // The form copies its initial values once, so remount it when the saved project or its groups' names arrive
        key={`${project.pi_group_id}-${project.project_group_id}-${piGroup?.id}-${projectGroup?.id}`}
        mode="edit"
        initialValues={project}
        piGroup={piGroup}
        projectGroup={projectGroup}
        onSubmit={handleSubmit}
        error={error}
        isSubmitting={isSubmitting}
      />
      {(project.pi_group_id || project.project_group_id) && (
        <Stack direction="row" spacing={1} my={4}>
          {project.pi_group_id && (
            <Chip label="PI group" component={NextLink} href={`/groups/details/?id=${project.pi_group_id}`} clickable />
          )}
          {project.project_group_id && (
            <Chip
              label="Project group"
              component={NextLink}
              href={`/groups/details/?id=${project.project_group_id}`}
              clickable
            />
          )}
        </Stack>
      )}
    </>
  );
};

export default ProjectDetails;
