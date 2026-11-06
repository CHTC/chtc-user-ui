"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import { useAuthClient } from "@/src/components/AuthProvider";
import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import UserAutocompleteMultiple from "@/src/components/UserAutocompleteMultiple/UserAutocompleteMultiple";
import CollegeDepartmentAutocomplete from "@/src/components/CollegeDepartmentAutocomplete/CollegeDepartmentAutocomplete";
import FieldOfScienceAutocomplete from "@/src/components/FieldOfScienceAutocomplete/FieldOfScienceAutocomplete";
import { ApiError } from "@/src/utils/formErrors";
import { useFormState } from "@/src/utils/useFormState";
import { CollegeAndDepartment, FieldsOfScience, FormMode, Group, Project, ProjectCreateUpdate, User } from "@/types";
import { Box, Button, FormControl, Grid, InputLabel, MenuItem, Select, TextField } from "@mui/material";
import React from "react";

export interface ProjectFormValues {
  name: string;
  display_name: string;
  description: string;
  accounting_group: string;
  pi_group: Partial<Group> | null;
  project_group: Partial<Group> | null;
  pi_ids: User[]; // create only
  staff1: User | null;
  staff2: User | null;
  college_and_department: CollegeAndDepartment | null;
  field_of_science: FieldsOfScience | null;
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
  /**
   * The project's groups, loaded by the page. The group pickers only load the first page of
   * groups, so a group id alone would show as an empty field; these supply the names.
   */
  piGroup?: Partial<Group> | null;
  projectGroup?: Partial<Group> | null;
}

/** The group to show in a picker: the loaded group, or its id under a placeholder name until then */
const groupValue = (id: number | null | undefined, loaded?: Partial<Group> | null): Partial<Group> | null =>
  id ? (loaded?.id === id ? loaded : { id, name: `Group ${id}` }) : null;

function normalizeInitialValues(
  initial?: Partial<Project>,
  piGroup?: Partial<Group> | null,
  projectGroup?: Partial<Group> | null,
): ProjectFormValues {
  return {
    name: initial?.name ?? "",
    display_name: initial?.display_name ?? "",
    description: initial?.description ?? "",
    accounting_group: initial?.accounting_group ?? "",
    pi_group: groupValue(initial?.pi_group_id, piGroup),
    project_group: groupValue(initial?.project_group_id, projectGroup),
    pi_ids: [],
    staff1: initial?.staff1 ?? null,
    staff2: initial?.staff2 ?? null,
    college_and_department: initial?.college_and_department ?? null,
    field_of_science: initial?.field_of_science ?? null,
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
  display_name: "Display Name",
  description: "Description",
  accounting_group: "Accounting Group",
  pi_group_id: "PI Group",
  project_group_id: "Project Group",
  pi_ids: "PIs",
  staff1: "Staff 1",
  staff2: "Staff 2",
  college_and_department_id: "College / Department",
  fos_id: "Field of Science",
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
  piGroup,
  projectGroup,
}) => {
  const { values, handleChange } = useFormState<ProjectFormValues>(() =>
    normalizeInitialValues(initialValues, piGroup, projectGroup),
  );
  const { currentUser } = useAuthClient();
  // Staff-only fields are disabled for a PI and left out of the PUT body: the API 403s if they are present at all
  const isStaff = !!currentUser?.is_admin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: ProjectCreateUpdate = {
      name: values.name.trim(),
      display_name: values.display_name.trim() || null,
      description: values.description || null,
      college_and_department_id: values.college_and_department?.id ?? null,
      fos_id: values.field_of_science?.fos_id ?? null,
      status: values.status || null,
      url: values.url || null,
      date: values.date || null,
      last_contact: values.last_contact || null,
    };

    if (isStaff) {
      payload.ticket = values.ticket ? Number(values.ticket) : null;
      payload.accounting_group = values.accounting_group.trim();
      payload.staff1 = values.staff1?.id ?? null;
      payload.staff2 = values.staff2?.id ?? null;
      // Leaving a group blank on create asks the API to generate all three groups
      if (values.pi_group?.id) payload.pi_group_id = values.pi_group.id;
      if (values.project_group?.id) payload.project_group_id = values.project_group.id;
      if (mode === "create" && values.pi_ids.length > 0) payload.pi_ids = values.pi_ids.map((u) => u.id);
    }

    await onSubmit(payload);
  };

  // Related fields share a row on wide screens and stack on narrow ones
  const half = { xs: 12, md: 6 };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />
      <Grid container spacing={2}>
        <Grid size={half}>
          <TextField
            label="Name"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={half}>
          <TextField
            label="Display Name"
            value={values.display_name}
            onChange={(e) => handleChange("display_name", e.target.value)}
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>

        <Grid size={12}>
          <TextField
            label="Description"
            value={values.description}
            onChange={(e) => handleChange("description", e.target.value)}
            fullWidth
            multiline
            minRows={4}
            maxRows={10}
            disabled={isSubmitting}
            helperText="Accepts plain text or Markdown"
          />
        </Grid>

        <Grid size={half}>
          <TextField
            label="Accounting Group"
            value={values.accounting_group}
            onChange={(e) => handleChange("accounting_group", e.target.value)}
            required={isStaff}
            fullWidth
            disabled={isSubmitting || !isStaff}
          />
        </Grid>
        <Grid size={half}>
          <FormControl fullWidth>
            <InputLabel id="status-select">Status</InputLabel>
            <Select
              labelId="status-select"
              id="status-select"
              value={values.status}
              label="Status"
              onChange={(e) => handleChange("status", e.target.value)}
              disabled={isSubmitting}
            >
              <MenuItem value={"Active"}>Active</MenuItem>
              <MenuItem value={"Inactive"}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid size={half}>
          <UserAutocomplete
            label="Staff 1"
            value={values.staff1 ?? undefined}
            onSelect={(user) => handleChange("staff1", user)}
            defaultFilter={{
              is_admin: "is.true",
            }}
            disabled={isSubmitting || !isStaff}
          />
        </Grid>
        <Grid size={half}>
          <UserAutocomplete
            label="Staff 2"
            value={values.staff2 ?? undefined}
            onSelect={(user) => handleChange("staff2", user)}
            defaultFilter={{
              is_admin: "is.true",
            }}
            disabled={isSubmitting || !isStaff}
          />
        </Grid>

        {mode === "create" && (
          <Grid size={12}>
            <UserAutocompleteMultiple
              value={values.pi_ids}
              dataUrl="/users"
              onSelect={(users) => handleChange("pi_ids", users)}
              disabled={isSubmitting || !isStaff}
            />
          </Grid>
        )}

        <Grid size={half}>
          <GenericAutocomplete<Group>
            endpoint="/groups"
            label="PI Group"
            value={values.pi_group}
            onSelect={(group) => handleChange("pi_group", group)}
            getOptionLabel={(option) => option?.name ?? ""}
            searchFields={["name"]}
            helperText={mode === "create" ? "Leave blank to generate the PI, managers and project groups" : undefined}
            disabled={isSubmitting || !isStaff}
          />
        </Grid>
        <Grid size={half}>
          <GenericAutocomplete<Group>
            endpoint="/groups"
            label="Project Group"
            value={values.project_group}
            onSelect={(group) => handleChange("project_group", group)}
            getOptionLabel={(option) => option?.name ?? ""}
            searchFields={["name"]}
            helperText={mode === "create" ? "Leave blank to generate the PI, managers and project groups" : undefined}
            disabled={isSubmitting || !isStaff}
          />
        </Grid>

        <Grid size={half}>
          <CollegeDepartmentAutocomplete
            value={values.college_and_department ?? undefined}
            onSelect={(collegeAndDepartment) => handleChange("college_and_department", collegeAndDepartment)}
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={half}>
          <FieldOfScienceAutocomplete
            value={values.field_of_science ?? undefined}
            onSelect={(fieldOfScience) => handleChange("field_of_science", fieldOfScience)}
            disabled={isSubmitting}
          />
        </Grid>

        <Grid size={half}>
          <TextField
            label="URL"
            value={values.url}
            onChange={(e) => handleChange("url", e.target.value)}
            fullWidth
            disabled={isSubmitting}
          />
        </Grid>
        <Grid size={half}>
          <TextField
            label="Ticket"
            value={values.ticket}
            onChange={(e) => handleChange("ticket", e.target.value)}
            fullWidth
            disabled={isSubmitting || !isStaff}
            helperText={isStaff ? "Leave blank if not applicable" : "Only staff can change this"}
          />
        </Grid>

        <Grid size={half}>
          <TextField
            label="Date"
            value={values.date}
            onChange={(e) => handleChange("date", e.target.value)}
            fullWidth
            disabled={true}
            type={"datetime-local"}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={half}>
          <TextField
            label="Last Contact"
            value={values.last_contact}
            onChange={(e) => handleChange("last_contact", e.target.value)}
            fullWidth
            disabled={isSubmitting}
            type={"datetime-local"}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={12}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectForm;
