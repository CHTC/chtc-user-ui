"use client";

import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { NoteForm } from "@/src/components/Forms/NoteForm/NoteForm";
import type { NoteCreate } from "@/types";
import { Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import useSWR from "swr";

function Page() {
  const { isAuthenticated } = useAuthClient();
  const { showAlert } = useAlert();

  const handleSubmit = async (
    note_id: number | null,
    project_id: number | null,
    payload: NoteCreate,
    update: () => void,
  ) => {
    try {
      const response = await apiFetch(`/projects/${project_id}/notes/${note_id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update note: ${response.statusText}`);
      }

      update();
      showAlert("UPDATE_NOTE_SUCCESS")
    } catch (error) {
      // TODO: error handling here
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
      <Breadcrumbs>
        <Typography color="text.primary">Update Note</Typography>
      </Breadcrumbs>
      <Suspense fallback={<Skeleton variant={"rectangular"} height={"100"} />}>
        <NotePage handleSubmit={handleSubmit} />
      </Suspense>
    </Box>
  );
}

// Fetcher function for SWR
const projectFetcher = async (note_id: number | null, project_id: number | null) => {
  if (!note_id || !project_id) return null;
  const response = await apiFetch(`/projects/${project_id}/notes/${note_id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch project with id ${note_id}: ${response.statusText}`);
  }
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
  const { data: project, mutate } = useSWR(
    note_id && project_id ? [`/projects/${project_id}/notes/${note_id}`] : null,
    () => projectFetcher(note_id, project_id),
    { suspense: true },
  );

  if (!note_id || !project_id) {
    return <p>No project ID provided.</p>;
  }

  return (
    <NoteForm
      mode="edit"
      projectId={project_id}
      initialValues={project}
      onSubmit={(payload: NoteCreate) => handleSubmit(note_id, project_id, payload, mutate)}
    />
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
    <>
      <Box my={3}>
        <Suspense fallback={<Skeleton variant={"rectangular"} height={"400px"} />}>
          <NoteFormSuspense note_id={note_id} project_id={project_id} handleSubmit={handleSubmit} />
        </Suspense>
      </Box>
    </>
  );
};

export default Page;
