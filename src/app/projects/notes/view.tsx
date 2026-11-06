"use client";

import ProjectShell from "@/src/app/projects/_components/ProjectShell";
import AddAccordion from "@/src/components/AddAccordion/AddAccordion";
import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { NoteForm } from "@/src/components/Forms/NoteForm/NoteForm";
import ProjectNoteTable from "@/src/components/ProjectNoteTable/ProjectNoteTable";
import { useServerTableRefresh } from "@/src/components/Table/ServerTable";
import { ApiError, apiErrorMessage } from "@/src/utils/formErrors";
import type { NoteCreate } from "@/types";
import { Alert } from "@mui/material";
import { useState } from "react";

function View() {
  const { currentUser } = useAuthClient();

  return (
    <ProjectShell>
      {(_project, id) =>
        currentUser?.is_admin ? (
          <ProjectNotes projectId={id} />
        ) : (
          <Alert severity="warning">Only staff can view a project&apos;s notes.</Alert>
        )
      }
    </ProjectShell>
  );
}

const ProjectNotes = ({ projectId }: { projectId: number }) => {
  const { showAlert } = useAlert();
  const refreshNotes = useServerTableRefresh(`/projects/${projectId}/notes`);
  const [open, setOpen] = useState(false);
  // Bumped after each saved note so the form starts empty again
  const [formKey, setFormKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);

  const handleSubmit = async (payload: NoteCreate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/projects/${projectId}/notes`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError(await apiErrorMessage(response, "Failed to create note"));
        return;
      }
      showAlert("CREATE_NOTE_SUCCESS");
      setOpen(false);
      setFormKey((key) => key + 1);
      await refreshNotes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AddAccordion title="Add note" expanded={open} onChange={setOpen}>
        <NoteForm
          key={formKey}
          mode="create"
          projectId={projectId}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
          showBack={false}
        />
      </AddAccordion>
      <ProjectNoteTable projectId={projectId} />
    </>
  );
};

export default View;
