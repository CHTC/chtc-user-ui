"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import { ApiError } from "@/src/utils/formErrors";
import { useFormState } from "@/src/utils/useFormState";
import type { TokenPost } from "@/types";
import { Box, Button, Stack, TextField } from "@mui/material";
import React from "react";

export type TokenFormMode = "create";

export interface TokenFormValues {
  description: string;
  expires_at: string;
}

export interface TokenFormProps {
  mode: TokenFormMode;
  /**
   * Initial values for the form.
   */
  initialValues?: Partial<TokenPost>;
  /**
   * Called with cleaned form values converted to API payload shape.
   */
  onSubmit: (payload: TokenPost) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
}

function normalizeInitialValues(initial?: Partial<TokenPost>): TokenFormValues {
  return {
    description: initial?.description ?? "",
    expires_at: initial?.expires_at ?? "",
  };
}

// Field name mappings for error display
const FIELD_NAME_MAP: Record<string, string> = {
  description: "Description",
  expires_at: "Expires At",
};

export const TokenForm: React.FC<TokenFormProps> = ({ mode, initialValues, onSubmit, isSubmitting = false, error }) => {
  const { values, handleChange } = useFormState<TokenFormValues>(() => normalizeInitialValues(initialValues));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: TokenPost = {
      description: values.description.trim(),
      expires_at: values.expires_at ? values.expires_at : null,
    };

    await onSubmit(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 600 }}>
      <Stack spacing={2}>
        <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />

        <TextField
          label="Description"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          required
          fullWidth
          disabled={isSubmitting}
          helperText="A brief description of what this token will be used for"
        />

        <TextField
          label="Expires At"
          type="datetime-local"
          value={values.expires_at}
          onChange={(e) => handleChange("expires_at", e.target.value)}
          fullWidth
          disabled={isSubmitting}
          helperText="Leave blank for a token that never expires"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            Create Token
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TokenForm;
