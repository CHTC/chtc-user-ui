"use client";

import React, {useState} from "react";
import {Box, Button, Stack, TextField, Alert} from "@mui/material";
import {FormMode, ProjectCreateUpdate} from "@/types";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";

export interface ProjectFormValues {
  name: string;
  accounting_group: string;
  pi: string; // stringified user ID
  staff1: string;
  staff2: string;
  status: string;
  access: string;
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
  initialValues?: Partial<ProjectCreateUpdate>;
  /**
   * Called with cleaned form values converted to API payload shape.
   * For create, treat it as GroupCreate; for edit, as GroupUpdate.
   */
  onSubmit: (payload: ProjectCreateUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | null;
}

function normalizeInitialValues(initial?: Partial<ProjectCreateUpdate>): ProjectFormValues {
  return {
    name: initial?.name ?? "",
    accounting_group: initial?.accounting_group ?? "",
    pi:
      initial?.pi !== undefined && initial?.pi !== null
        ? String(initial.pi)
        : "",
    staff1: initial?.staff1 ?? "",
    staff2: initial?.staff2 ?? "",
    status: initial?.status ?? "",
    access: initial?.access ?? "",
    url: initial?.url ?? "",
    date: initial?.date ?? "",
    ticket:
      initial?.ticket !== undefined && initial?.ticket !== null
        ? String(initial.ticket)
        : "",
    last_contact: initial?.last_contact ?? "",
  };
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const [values, setValues] = useState<ProjectFormValues>(() => normalizeInitialValues(initialValues));

  const handleChange = (field: keyof ProjectFormValues, value: string) => {
    setValues((prev) => ({...prev, [field]: value}));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: ProjectCreateUpdate = {
      name: values.name.trim(),
      accounting_group: values.accounting_group.trim(),
      pi: values.pi ? Number(values.pi) : null,
      staff1: values.staff1 || null,
      staff2: values.staff2 || null,
      status: values.status || null,
      access: values.access || null,
      url: values.url || null,
      date: values.date || null,
      ticket: values.ticket ? Number(values.ticket) : null,
      last_contact: values.last_contact || null,
    };

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{mt: 2, maxWidth: 600}}>
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

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
          value={{username: values.staff1}}
          onSelect={
            (user) => handleChange("staff1", user?.username || "")
          }
          defaultFilter={{
            is_admin: "is.true"
          }}
        />

        <UserAutocomplete
          value={{username: values.staff2}}
          onSelect={
            (user) => handleChange("staff2", user?.username || "")
          }
          defaultFilter={{
            is_admin: "is.true"
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
          label="Access"
          value={values.access}
          onChange={(e) => handleChange("access", e.target.value)}
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
        />

        <TextField
          label="Last Contact"
          value={values.last_contact}
          onChange={(e) => handleChange("last_contact", e.target.value)}
          fullWidth
          disabled={isSubmitting}
          type={"datetime-local"}
        />

        <Box sx={{display: "flex", gap: 2, mt: 2}}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default ProjectForm;
