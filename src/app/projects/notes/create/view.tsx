"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { NoteForm } from "@/src/components/Forms/NoteForm/NoteForm";
import type { NoteCreate } from "@/types";
import { Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function View() {
  const params = useSearchParams();
  const projectId = params.get("project_id");

  const { isAuthenticated } = useAuthClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">You must be logged in to create a note.</Typography>
      </Box>
    );
  }

  if (projectId == null) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">Page is missing project ID, this is a UI bug.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Create Note</Typography>
      </Breadcrumbs>
      <NoteForm
        mode="create"
        projectId={parseInt(projectId)}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />
    </Box>
  );
}

const ViewSuspended = () => {
  return (
    <Suspense fallback={<Skeleton height={"400px"} />}>
      <View />
    </Suspense>
  );
};

export default ViewSuspended;
