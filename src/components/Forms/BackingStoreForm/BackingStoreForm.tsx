"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import { ApiError } from "@/src/utils/formErrors";
import { useFormState } from "@/src/utils/useFormState";
import type { BackingStore, BackingStoreCreateUpdate } from "@/types";
import { Box, Button, Stack, TextField } from "@mui/material";
import React from "react";

export interface BackingStoreFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<BackingStore>;
  onSubmit: (payload: BackingStoreCreateUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  /** Rendered after Save, e.g. the delete button */
  extraActions?: React.ReactNode;
}

const FIELD_NAME_MAP: Record<string, string> = { name: "Name", description: "Description" };

export const BackingStoreForm: React.FC<BackingStoreFormProps> = ({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error,
  extraActions,
}) => {
  const { values, handleChange } = useFormState(() => ({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ name: values.name.trim(), description: values.description.trim() || null });
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
          label="Description"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={isSubmitting}
        />
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
          {extraActions}
        </Box>
      </Stack>
    </Box>
  );
};

export default BackingStoreForm;
