"use client";

import FormErrorAlert from "@/src/components/FormErrorAlert/FormErrorAlert";
import GroupAutocomplete from "@/src/components/GroupAutocomplete/GroupAutocomplete";
import ManagedBySelect from "@/src/components/ManagedBySelect/ManagedBySelect";
import { ApiError } from "@/src/utils/formErrors";
import { useFormState } from "@/src/utils/useFormState";
import { useAuthClient } from "@/src/components/AuthProvider";
import type { EntityManagerEnum, Group, GroupAdministration, GroupCreateUpdate } from "@/types";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
} from "@mui/material";
import React from "react";

export type GroupFormMode = "create" | "edit";

/** "existing" is form-only: it sends owner_group_id instead of administration */
type AdministrationChoice = GroupAdministration | "existing";

export interface GroupFormValues {
  name: string;
  description: string;
  unix_gid: string;
  managed_by: EntityManagerEnum;
  owner_group: Partial<Group> | null;
  administration: AdministrationChoice;
}

export interface GroupFormProps {
  mode: GroupFormMode;
  initialValues?: Partial<Group>;
  /** Edit mode: the group named by initialValues.owner_group_id, which the form cannot look up itself */
  ownerGroup?: Partial<Group> | null;
  /** False renders every field disabled with no Save button (non-staff view the page, only staff edit metadata) */
  canEdit?: boolean;
  onSubmit: (payload: GroupCreateUpdate) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  /** Rendered next to the GID field, e.g. the "Allocate GID" button */
  gidAction?: React.ReactNode;
  /** Rendered after Save, e.g. the delete button */
  extraActions?: React.ReactNode;
}

function normalizeInitialValues(initial?: Partial<Group>, ownerGroup?: Partial<Group> | null): GroupFormValues {
  return {
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    unix_gid: initial?.unix_gid !== undefined && initial?.unix_gid !== null ? String(initial.unix_gid) : "",
    managed_by: initial?.managed_by ?? "APPLICATION",
    owner_group: ownerGroup ?? (initial?.owner_group_id ? { id: initial.owner_group_id, name: `Group ${initial.owner_group_id}` } : null),
    administration: "none",
  };
}

const FIELD_NAME_MAP: Record<string, string> = {
  name: "Name",
  description: "Description",
  unix_gid: "Unix GID",
  managed_by: "Managed by",
  owner_group_id: "Owner group",
  administration: "Administration",
};

export const GroupForm: React.FC<GroupFormProps> = ({
  mode,
  initialValues,
  ownerGroup,
  canEdit = true,
  onSubmit,
  isSubmitting = false,
  error,
  gidAction,
  extraActions,
}) => {
  const { values, handleChange } = useFormState<GroupFormValues>(() => normalizeInitialValues(initialValues, ownerGroup));
  const { currentUser } = useAuthClient();
  const disabled = isSubmitting || !canEdit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: GroupCreateUpdate = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      unix_gid: values.unix_gid ? Number(values.unix_gid) : null,
    };

    // Only staff may set managed_by, so other users never send it
    if (currentUser?.is_admin) {
      payload.managed_by = values.managed_by;
    }

    if (mode === "create") {
      // The API rejects a body carrying both, so exactly one of the two is sent
      if (values.administration === "existing") {
        payload.owner_group_id = values.owner_group?.id ?? null;
      } else {
        payload.administration = values.administration;
      }
    } else {
      // Always sent on edit: null means staff only
      payload.owner_group_id = values.owner_group?.id ?? null;
    }

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
          disabled={disabled}
        />

        <TextField
          label="Description"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={disabled}
        />

        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <TextField
            label="Unix GID"
            value={values.unix_gid}
            onChange={(e) => handleChange("unix_gid", e.target.value)}
            fullWidth
            disabled={disabled}
            helperText={
              mode === "create"
                ? "Leave blank for no unix group; you can allocate one from the group page"
                : undefined
            }
          />
          {mode === "edit" && !values.unix_gid && gidAction}
        </Box>

        <ManagedBySelect
          value={values.managed_by}
          onChange={(value) => handleChange("managed_by", value)}
          disabled={disabled || !currentUser?.is_admin}
          helperText={currentUser?.is_admin ? undefined : "Only staff can change this"}
        />

        {mode === "create" ? (
          <FormControl>
            <FormLabel id="group-administration-label">Administration</FormLabel>
            <RadioGroup
              aria-labelledby="group-administration-label"
              value={values.administration}
              onChange={(e) => handleChange("administration", e.target.value as AdministrationChoice)}
            >
              <FormControlLabel value="none" control={<Radio />} label="Staff only" disabled={disabled} />
              <FormControlLabel value="owners" control={<Radio />} label="Owners group" disabled={disabled} />
              <FormControlLabel
                value="owners_and_managers"
                control={<Radio />}
                label="Owners and managers groups"
                disabled={disabled}
              />
              <FormControlLabel value="existing" control={<Radio />} label="Existing owner group" disabled={disabled} />
            </RadioGroup>
            {values.administration === "existing" && (
              <Box sx={{ mt: 1 }}>
                <GroupAutocomplete
                  label="Owner group"
                  value={values.owner_group ?? undefined}
                  onSelect={(group) => handleChange("owner_group", group)}
                  required
                  disabled={disabled}
                />
              </Box>
            )}
          </FormControl>
        ) : (
          <GroupAutocomplete
            label="Owner group (clear for staff only)"
            value={values.owner_group ?? undefined}
            onSelect={(group) => handleChange("owner_group", group)}
            disabled={disabled}
          />
        )}

        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          {canEdit && (
            <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
              {mode === "create" ? "Create" : "Save"}
            </Button>
          )}
          {extraActions}
        </Box>
      </Stack>
    </Box>
  );
};

export default GroupForm;
