"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { ApiError } from "@/src/utils/formErrors";
import { useFormState } from "@/src/utils/useFormState";
import { FormMode, Project, ProjectCreateUpdate, User } from "@/types";
import { Box, Button, Stack, TextField } from "@mui/material";
import React from "react";

export interface ProjectFormValues {
  name: string;
  accounting_group: string;
  pi: string; // stringified user ID
  staff1: User | null;
  staff2: User | null;
  status: string;
  url: string;
  date: string;
  ticket: string; // stringified ticket number
  last_contact: string;
}

export interface ProjectFormProps {
  mode: FormMode;
  /**
   * Initial values for the form. Can come from either a GroupCreate payload
   * (e.g. when editing unsaved data) or a GroupUpdate/group API response.
   */
  initialValues?: Partial<Project>;
  /**
   * Called with cleaned form values converted to API payload shape.
   * For create, treat it as GroupCreate; for edit, as GroupUpdate.
   */
  onSubmit: (payload: ProjectCreateUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
}

function normalizeInitialValues(initial?: Partial<Project>): ProjectFormValues {
  return {
    name: initial?.name ?? "",
    accounting_group: initial?.accounting_group ?? "",
    pi: initial?.pi !== undefined && initial?.pi !== null ? String(initial.pi) : "",
    staff1: initial?.staff1 ?? null,
    staff2: initial?.staff2 ?? null,
    status: initial?.status ?? "",
    url: initial?.url ?? "",
    date: initial?.date ?? "",
    ticket: initial?.ticket !== undefined && initial?.ticket !== null ? String(initial.ticket) : "",
    last_contact: initial?.last_contact ?? "",
  };
}

// Field name mappings for error display
const FIELD_NAME_MAP: Record<string, string> = {
  name: "Name",
  accounting_group: "Accounting Group",
  pi: "PI",
  staff1: "Staff 1",
  staff2: "Staff 2",
  status: "Status",
  url: "URL",
  date: "Date",
  ticket: "Ticket",
  last_contact: "Last Contact",
};

export const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const { values, handleChange } = useFormState<ProjectFormValues>(() => normalizeInitialValues(initialValues));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: ProjectCreateUpdate = {
      name: values.name.trim(),
      accounting_group: values.accounting_group.trim(),
      pi: values.pi ? Number(values.pi) : null,
      staff1: values.staff1?.id ?? null,
      staff2: values.staff2?.id ?? null,
      status: values.status || null,
      url: values.url || null,
      date: values.date || null,
      ticket: values.ticket ? Number(values.ticket) : null,
      last_contact: values.last_contact || null,
    };

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 600 }}>
      <Stack spacing={2}>
        <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />

        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Accounting Group"
          value={values.accounting_group}
          onChange={(e) => handleChange("accounting_group", e.target.value)}
          required
          fullWidth
          disabled={isSubmitting}
        />

        <UserAutocomplete
          label="Staff 1"
          value={values.staff1 ?? undefined}
          onSelect={(user) => handleChange("staff1", user)}
          defaultFilter={{
            is_admin: "is.true",
          }}
        />

        <UserAutocomplete
          label="Staff 2"
          value={values.staff2 ?? undefined}
          onSelect={(user) => handleChange("staff2", user)}
          defaultFilter={{
            is_admin: "is.true",
          }}
        />

        <TextField
          label="Status"
          value={values.status}
          onChange={(e) => handleChange("status", e.target.value)}
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="URL"
          value={values.url}
          onChange={(e) => handleChange("url", e.target.value)}
          fullWidth
          disabled={isSubmitting}
        />

        <TextField
          label="Ticket"
          value={values.ticket}
          onChange={(e) => handleChange("ticket", e.target.value)}
          fullWidth
          disabled={isSubmitting}
          helperText="Leave blank if not applicable"
        />

        <TextField
          label="Date"
          value={values.date}
          onChange={(e) => handleChange("date", e.target.value)}
          fullWidth
          disabled={true}
          type={"datetime-local"}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <TextField
          label="Last Contact"
          value={values.last_contact}
          onChange={(e) => handleChange("last_contact", e.target.value)}
          fullWidth
          disabled={isSubmitting}
          type={"datetime-local"}
          slotProps={{ inputLabel: { shrink: true } }}
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

export default ProjectForm;
