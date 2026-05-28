"use client";

import { useAlert } from "@/src/components/AlertProvider";
import {AuthGuard} from "@/src/components/AuthGuard";
import {apiFetch} from "@/src/components/AuthProvider";
import {ProjectForm} from "@/src/components/Forms/ProjectForm/ProjectForm";
import ProjectNoteTable from "@/src/components/ProjectNoteTable/ProjectNoteTable";
import ProjectUserTable from "@/src/components/ProjectUserTable/ProjectUserTable";
import {ApiError} from "@/src/utils/formErrors";
import type {ProjectCreateUpdate} from "@/types";
import {Add} from "@mui/icons-material";
import {Box, Breadcrumbs, Button, Skeleton, Typography} from "@mui/material";
import {useSearchParams} from "next/navigation";
import {Suspense, useState} from "react";
import useSWR from "swr";

function Page() {
  const { showAlert } = useAlert()

  const handleSubmit = async (
    id: number,
    payload: ProjectCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => {
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
          const errorData = await response.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to update project: ${response.statusText}`);
        }
        return;
      }

      update();

      showAlert("UPDATE_PROJECT_SUCCESS")
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to update project";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to edit a project.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Update Project</Typography>
        </Breadcrumbs>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"} />}>
          <ProjectPage handleSubmit={handleSubmit} />
        </Suspense>
      </Box>
    </AuthGuard>
  );
}

// Fetcher function for SWR
const projectFetcher = async (id: number | null) => {
  if (!id) return null;
  const response = await apiFetch(`/projects/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

const ProjectFormSuspense = ({
  id,
  handleSubmit,
}: {
  id: number | null;
  handleSubmit: (
    id: number,
    payload: ProjectCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const { data: project, mutate } = useSWR(id ? [`/projects/${id}`] : null, () => projectFetcher(id), {
    suspense: true,
  });
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!id) {
    return <p>No project ID provided.</p>;
  }

  return (
    <ProjectForm
      mode="edit"
      initialValues={project}
      onSubmit={(payload: ProjectCreateUpdate) => handleSubmit(id, payload, mutate, setError, setIsSubmitting)}
      error={error}
      isSubmitting={isSubmitting}
    />
  );
};

const ProjectPage = ({
  handleSubmit,
}: {
  handleSubmit: (
    id: number,
    payload: ProjectCreateUpdate,
    update: () => void,
    setError: (error: string | ApiError | null) => void,
    setIsSubmitting: (isSubmitting: boolean) => void,
  ) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No project ID provided.</Typography>;
  }

  return (
    <>
      <Box my={3}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <ProjectFormSuspense id={id} handleSubmit={handleSubmit} />
        </Suspense>
      </Box>
      <Box my={4}>
        <Typography variant={"h4"} component="h3">
          Users
        </Typography>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <ProjectUserTable projectId={id} />
        </Suspense>
      </Box>
      <Box my={4}>
        <Typography variant={"h4"} component="h3" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
          Notes
          <Button startIcon={<Add />} href={`/projects/notes/create/?project_id=${id}`} >
            Add Note
          </Button>
        </Typography>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <ProjectNoteTable projectId={id} />
        </Suspense>
      </Box>
    </>
  );
};

export default Page;
