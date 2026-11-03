"use client";

import BackingStoreSelect from "@/src/components/BackingStoreSelect/BackingStoreSelect";
import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import GroupAutocomplete from "@/src/components/GroupAutocomplete/GroupAutocomplete";
import { ApiError } from "@/src/utils/formErrors";
import { useFormState } from "@/src/utils/useFormState";
import type { DataAccess, DataAccessCreate, DataAccessUpdate, Group } from "@/types";
import { Box, Button, Stack, TextField } from "@mui/material";
import React from "react";

export interface DataAccessFormProps {
  mode: "create" | "edit";
  initialValues?: Partial<DataAccess>;
  /** The entry's group (or the one preloaded from ?group_id=), which the form cannot look up itself */
  initialGroup?: Partial<Group> | null;
  /** False renders every field disabled with no Save button */
  canEdit?: boolean;
  /** Create sends DataAccessCreate, edit sends DataAccessUpdate (store and path are immutable) */
  onSubmit: (payload: DataAccessCreate | DataAccessUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
}

interface Values {
  backing_store_id: number | null;
  path: string;
  group: Partial<Group> | null;
  inode_count: string;
  byte_size: string;
}

const FIELD_NAME_MAP: Record<string, string> = {
  backing_store_id: "Backing store",
  path: "Path",
  group_id: "Group",
  inode_count: "Inode count",
  byte_size: "Byte size",
};

const numberOrNull = (value: string) => (value.trim() === "" ? null : Number(value));

export const DataAccessForm: React.FC<DataAccessFormProps> = ({
  mode,
  initialValues,
  initialGroup,
  canEdit = true,
  onSubmit,
  isSubmitting = false,
  error,
}) => {
  const { values, handleChange } = useFormState<Values>(() => ({
    backing_store_id: initialValues?.backing_store_id ?? null,
    path: initialValues?.path ?? "",
    group: initialGroup ?? null,
    inode_count: initialValues?.inode_count != null ? String(initialValues.inode_count) : "",
    byte_size: initialValues?.byte_size != null ? String(initialValues.byte_size) : "",
  }));
  const disabled = isSubmitting || !canEdit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shared = {
      group_id: values.group?.id ?? null,
      inode_count: numberOrNull(values.inode_count),
      byte_size: numberOrNull(values.byte_size),
    };
    if (mode === "create") {
      await onSubmit({ backing_store_id: values.backing_store_id!, path: values.path.trim(), ...shared });
    } else {
      await onSubmit(shared);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: 600 }}>
      <Stack spacing={2}>
        <FormErrorAlert error={error ?? null} fieldNameMap={FIELD_NAME_MAP} />

        <BackingStoreSelect
          value={values.backing_store_id}
          onChange={(id) => handleChange("backing_store_id", id)}
          required
          disabled={disabled || mode === "edit"}
        />

        <TextField
          label="Path"
          value={values.path}
          onChange={(e) => handleChange("path", e.target.value)}
          required
          fullWidth
          disabled={disabled || mode === "edit"}
          helperText={mode === "edit" ? "The backing store and path cannot be changed" : undefined}
        />

        <GroupAutocomplete
          label="Group"
          value={values.group ?? undefined}
          onSelect={(group) => handleChange("group", group)}
          disabled={disabled}
        />

        <TextField
          label="Inode count"
          type="number"
          value={values.inode_count}
          onChange={(e) => handleChange("inode_count", e.target.value)}
          fullWidth
          disabled={disabled}
        />

        <TextField
          label="Byte size"
          type="number"
          value={values.byte_size}
          onChange={(e) => handleChange("byte_size", e.target.value)}
          fullWidth
          disabled={disabled}
        />

        {canEdit && (
          <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default DataAccessForm;
