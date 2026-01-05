"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import { ApiError } from "@/src/utils/formErrors";
import type { GroupCreateUpdate } from "@/types";
import { Box, Button, Checkbox, FormControlLabel, Stack, TextField } from "@mui/material";
import React, { useState } from "react";

export type GroupFormMode = "create" | "edit";

export interface GroupFormValues {
  name: string;
  point_of_contact: string;
  unix_gid: string;
  has_groupdir: boolean;
}

export interface GroupFormProps {
  mode: GroupFormMode;
  /**
   * Initial values for the form. Can come from either a GroupCreate payload
   * (e.g. when editing unsaved data) or a GroupUpdate/group API response.
   */
  initialValues?: Partial<GroupCreateUpdate>;
  /**
   * Called with cleaned form values converted to API payload shape.
   * For create, treat it as GroupCreate; for edit, as GroupUpdate.
   */
  onSubmit: (payload: GroupCreateUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
}

function normalizeInitialValues(initial?: Partial<GroupCreateUpdate>): GroupFormValues {
  return {
    name: initial?.name ?? "",
    point_of_contact: initial?.point_of_contact ?? "",
    unix_gid: initial?.unix_gid !== undefined && initial?.unix_gid !== null ? String(initial.unix_gid) : "",
    has_groupdir: initial?.has_groupdir ?? true,
  };
}

// Field name mappings for error display
const FIELD_NAME_MAP: Record<string, string> = {
  name: "Name",
  point_of_contact: "Point of Contact",
  unix_gid: "Unix GID",
  has_groupdir: "Has Group Directory",
};

export const GroupForm: React.FC<GroupFormProps> = ({ mode, initialValues, onSubmit, isSubmitting = false, error }) => {
  const [values, setValues] = useState<GroupFormValues>(() => normalizeInitialValues(initialValues));

  const handleChange = (field: keyof GroupFormValues, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: GroupCreateUpdate = {
      name: values.name.trim(),
      point_of_contact: values.point_of_contact || null,
      unix_gid: values.unix_gid ? Number(values.unix_gid) : null,
      has_groupdir: values.has_groupdir,
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

        <UserAutocomplete
          value={{ username: values.point_of_contact }}
          onSelect={(user) => handleChange("point_of_contact", user?.username || "")}
          defaultFilter={{
            is_admin: "is.true",
          }}
        />

        <TextField
          label="Unix GID"
          value={values.unix_gid}
          onChange={(e) => handleChange("unix_gid", e.target.value)}
          fullWidth
          disabled={isSubmitting}
          helperText={"Leave blank to auto-assign"}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={values.has_groupdir}
              onChange={(e) => handleChange("has_groupdir", e.target.checked)}
              disabled={isSubmitting}
            />
          }
          label="Has Group Directory"
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

export default GroupForm;
