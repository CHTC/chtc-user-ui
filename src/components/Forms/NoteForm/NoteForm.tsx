"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import UserAutocompleteMultiple from "@/src/components/UserAutocompleteMultiple/UserAutocompleteMultiple";
import { ApiError } from "@/src/utils/formErrors";
import type { NoteCreate, User } from "@/types";
import { Box, Button, Stack, TextField } from "@mui/material";
import React, { useState } from "react";

export type NoteFormMode = "create" | "edit";

export interface NoteFormValues {
  ticket: string;
  note: string;
  author: string;
  date: string;
  users: User[]; // selected users in the UI
}

export interface NoteFormProps {
  mode: NoteFormMode;
  projectId?: number;
  /**
   * Initial values for the form. Can come from either a NoteCreate payload
   * (e.g. when editing unsaved data) or a Note API response mapped into this shape.
   */
  initialValues?: Partial<NoteFormValues>;
  /**
   * Called with cleaned form values converted to API payload shape.
   */
  onSubmit: (payload: NoteCreate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
}

function normalizeInitialValues(initial?: Partial<NoteFormValues>): NoteFormValues {
  return {
    author: initial?.author ?? "",
    date: initial?.date ?? "",
    ticket: initial?.ticket ?? "",
    note: initial?.note ?? "",
    users: initial?.users ?? [],
  };
}

// Field name mappings for error display
const FIELD_NAME_MAP: Record<string, string> = {
  ticket: "Ticket",
  note: "Note",
  author: "Author",
  date: "Date",
  users: "Users",
};

export const NoteForm: React.FC<NoteFormProps> = ({
  mode,
  projectId,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const [values, setValues] = useState<NoteFormValues>(() => normalizeInitialValues(initialValues));

  const handleChange = (field: keyof NoteFormValues, value: string | User[]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: NoteCreate = {
      ticket: values.ticket || null,
      note: values.note || null,
      users: values.users.map((u) => u.id),
    };

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 600 }}>
      <Stack spacing={2}>
        <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />

        <TextField
          label="Note"
          value={values.note}
          onChange={(e) => handleChange("note", e.target.value)}
          fullWidth
          multiline
          minRows={6}
          disabled={isSubmitting}
        />

        <UserAutocompleteMultiple
          // Allow selecting multiple users by re-rendering the component
          // and appending to the users array on each selection
          dataUrl={`/projects/${projectId}/users`}
          onSelect={(users) => handleChange("users", users)}
          value={values.users}
        />

        <TextField
          label="Ticket"
          value={values.ticket}
          onChange={(e) => handleChange("ticket", e.target.value)}
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Author"
          value={values.author}
          onChange={(e) => handleChange("author", e.target.value)}
          fullWidth
          disabled={true}
          helperText={"Automatically set to current user on creation/update"}
        />

        <TextField
          label="Date"
          value={values.date}
          onChange={(e) => handleChange("date", e.target.value)}
          fullWidth
          disabled={true}
          helperText={"Automatically set to current date on creation"}
        />

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default NoteForm;
