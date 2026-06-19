"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { NoteForm } from "@/src/components/Forms/NoteForm/NoteForm";
import type { NoteCreate } from "@/types";
import { Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";

function Page() {
  const { isAuthenticated } = useAuthClient();

  const handleSubmit = async (
    note_id: number | null,
    project_id: number | null,
    payload: NoteCreate,
    update: () => void,
  ) => {
    try {
      await apiFetch(`/projects/${project_id}/notes/${note_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      update();
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">You must be logged in to create a project.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"} />}>
        <NotePage handleSubmit={handleSubmit} />
      </Suspense>
    </Box>
  );
}

const fetcher = async (url: string) => {
  const response = await apiFetch(url);
  if (!response.ok) throw new Error("Failed to fetch");
  return response.json();
};

const NoteFormSuspense = ({
  note_id,
  project_id,
  handleSubmit,
}: {
  note_id: number | null;
  project_id: number | null;
  handleSubmit: (
    note_id: number | null,
    project_id: number | null,
    payload: NoteCreate,
    update: () => void,
  ) => Promise<void>;
}) => {
  // Fetch both the note (for the form) and the project (for the name)
  const { data: note, mutate } = useSWR(
    note_id && project_id ? `/projects/${project_id}/notes/${note_id}` : null,
    fetcher,
    { suspense: true },
  );

  const { data: project } = useSWR(
    project_id ? `/projects/${project_id}` : null,
    fetcher,
    { suspense: true },
  );

  if (!note_id || !project_id) {
    return <p>No project ID provided.</p>;
  }

  return (
    <>
      <Breadcrumbs>
        <Typography color="text.primary">Update Note in {project?.name}</Typography>
      </Breadcrumbs>
      <Box my={3}>
        <NoteForm
          mode="edit"
          projectId={project_id}
          initialValues={note}
          onSubmit={(payload: NoteCreate) => handleSubmit(note_id, project_id, payload, mutate)}
        />
      </Box>
    </>
  );
};

const NotePage = ({
  handleSubmit,
}: {
  handleSubmit: (
    note_id: number | null,
    project_id: number | null,
    payload: NoteCreate,
    update: () => void,
  ) => Promise<void>;
}) => {
  const searchParams = useSearchParams();
  const note_id = Number.parseInt(searchParams.get("noteId") || "") || null;
  const project_id = Number.parseInt(searchParams.get("projectId") || "") || null;

  return (
    <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
      <NoteFormSuspense note_id={note_id} project_id={project_id} handleSubmit={handleSubmit} />
    </Suspense>
  );
};

export default Page;