"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { NoteForm } from "@/src/components/Forms/NoteForm/NoteForm";
import type { NoteCreate } from "@/types";
import { Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

const projectFetcher = async (project_id: number | null) => {
  if (!project_id) return null;
  const response = await apiFetch(`/projects/${project_id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project with id ${project_id}: ${response.statusText}`);
  }
  return response.json();
};

const CreateNoteSuspense = ({ projectId }: { projectId: number }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: project } = useSWR(
    projectId ? [`/projects/${projectId}`] : null,
    () => projectFetcher(projectId),
    { suspense: true }
  );

  const handleSubmit = async (payload: NoteCreate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const noteResponse = await apiFetch(`/projects/${projectId}/notes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const note = await noteResponse.json();
      router.push(`/projects/notes/edit?noteId=${note.id}&projectId=${projectId}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create note";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Create Note for {project?.name}</Typography>
      </Breadcrumbs>
      <NoteForm
        mode="create"
        projectId={projectId}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Box>
  );
};

// 3. Segment for URL Parameters
const NotePage = () => {
  const params = useSearchParams();
  const projectId = params.get("project_id");

  if (projectId == null) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">Page is missing project ID, this is a UI bug.</Typography>
      </Box>
    );
  }

  return (
    <Box my={3}>
      <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
        <CreateNoteSuspense projectId={parseInt(projectId)} />
      </Suspense>
    </Box>
  );
};

// 4. Main Page Component containing the auth check and outer Suspense boundary
function Page() {
  const { isAuthenticated } = useAuthClient();

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">You must be logged in to create a note.</Typography>
      </Box>
    );
  }

  return (
    // Outer Suspense boundary satisfies Next.js requirements for useSearchParams
    <Suspense fallback={<Skeleton variant="rectangular" height="100px" />}>
      <NotePage />
    </Suspense>
  );
}

export default Page;