"use client";

import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import SubmitNodeAutocomplete from "@/src/components/SubmitNodeAutocomplete/SubmitNodeAutocomplete";
import UserAutocomplete from "@/src/components/UserAutocomplete/UserAutocomplete";
import type { ApiError } from "@/src/components/Forms/UserForm/UserForm";
import type {
  FormStatusEnum,
  PositionEnum,
  Project,
  SubmitNode,
  User,
  UserForm,
  UserFormPatch,
  UserFormPost,
} from "@/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

export type UserApplicationFormMode = "create" | "edit";

interface ManualPiValues {
  name: string;
  email: string;
}

export interface UserApplicationFormProps {
  mode: UserApplicationFormMode;
  initialValues?: UserForm | null;
  onSubmit: (payload: UserFormPost | UserFormPatch) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  submitSuccess?: boolean;
}

function normalizeManualPi(initialValues?: UserForm | null): ManualPiValues {
  return {
    name: initialValues?.pi_name ?? "",
    email: initialValues?.pi_email ?? "",
  };
}

function formatPosition(position: PositionEnum) {
  return position
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function UserApplicationForm({
  mode,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitSuccess = false,
}: UserApplicationFormProps) {
  const [selectedPi, setSelectedPi] = useState<User | null>(
    initialValues?.pi_id ? ({ id: initialValues.pi_id } as User) : null,
  );
  const [manualPi, setManualPi] = useState<ManualPiValues>(() => normalizeManualPi(initialValues));
  const [position, setPosition] = useState<PositionEnum | "">(initialValues?.position ?? "");
  const [showManualPi, setShowManualPi] = useState(Boolean(initialValues?.pi_name || initialValues?.pi_email));

  const [status, setStatus] = useState<FormStatusEnum>(initialValues?.status ?? "PENDING");
  const [project, setProject] = useState<Project | null>(null);
  const [projectPosition, setProjectPosition] = useState<PositionEnum | "">(initialValues?.position ?? "");
  const [selectedSubmitNode, setSelectedSubmitNode] = useState<SubmitNode | null>(null);
  const [submitNodes, setSubmitNodes] = useState<SubmitNode[]>([]);

  const usingAutocompletePi = selectedPi !== null;
  const usingManualPi = showManualPi || manualPi.name.trim().length > 0 || manualPi.email.trim().length > 0;

  const validationMessage = useMemo(() => {
    if (mode === "create") {
      if (usingManualPi && (!manualPi.name.trim() || !manualPi.email.trim())) {
        return "Enter both PI name and PI email before submitting.";
      }

      if (!usingAutocompletePi && !usingManualPi) {
        return 'Select a PI or open "Can\'t find them?" to enter one manually.';
      }

      if (position === "") {
        return "Choose a position before submitting.";
      }
    }

    if (mode === "edit" && status === "APPROVED") {
      if (!project) {
        return "Select a project before approving.";
      }

      if (projectPosition === "") {
        return "Choose a project position before approving.";
      }

      if (submitNodes.length === 0) {
        return "Add at least one submit node before approving.";
      }
    }

    return null;
  }, [
    manualPi.email,
    manualPi.name,
    mode,
    position,
    project,
    projectPosition,
    status,
    submitNodes.length,
    usingAutocompletePi,
    usingManualPi,
  ]);

  const handleAddSubmitNode = () => {
    if (!selectedSubmitNode || submitNodes.some((node) => node.id === selectedSubmitNode.id)) {
      return;
    }
    setSubmitNodes((current) => [...current, selectedSubmitNode]);
    setSelectedSubmitNode(null);
  };

  const handleRemoveSubmitNode = (id: number) => {
    setSubmitNodes((current) => current.filter((node) => node.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) return;

    if (mode === "create") {
      await onSubmit({
        pi_id: selectedPi?.id ?? null,
        pi_name: usingManualPi ? manualPi.name.trim() : null,
        pi_email: usingManualPi ? manualPi.email.trim() : null,
        position: position as PositionEnum,
      });
      return;
    }

    await onSubmit({
      status,
      project_id: project?.id ?? 0,
      project_position: projectPosition as PositionEnum,
      submit_nodes: submitNodes.map((node) => node.name),
    });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        {mode === "create" ? (
          <>
            {submitSuccess ? (
              <Alert severity="success">Application submitted. Thank you!</Alert>
            ) : (
              <>
                <Stack spacing={2}>
                  <UserAutocomplete
                    label="PI"
                    value={selectedPi ?? undefined}
                    onSelect={setSelectedPi}
                    disabled={usingManualPi || isSubmitting}
                  />

                  <Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        type="button"
                        onClick={() => setShowManualPi((expanded) => !expanded)}
                        disabled={usingAutocompletePi || isSubmitting}
                        sx={{
                          p: 0,
                          minWidth: 0,
                          textTransform: "none",
                          color: "text.secondary",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Typography variant="subtitle2">Can&apos;t find them?</Typography>
                          <ExpandMoreIcon
                            fontSize="small"
                            sx={{
                              transform: usingManualPi ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </Stack>
                      </Button>
                    </Box>

                    <Collapse in={usingManualPi}>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                          label="PI Name"
                          value={manualPi.name}
                          onChange={(event) => setManualPi((current) => ({ ...current, name: event.target.value }))}
                          disabled={usingAutocompletePi || isSubmitting}
                          required={usingManualPi}
                        />

                        <TextField
                          label="PI Email"
                          type="email"
                          value={manualPi.email}
                          onChange={(event) => setManualPi((current) => ({ ...current, email: event.target.value }))}
                          disabled={usingAutocompletePi || isSubmitting}
                          required={usingManualPi}
                        />
                      </Stack>
                    </Collapse>
                  </Box>
                </Stack>

                <FormControl fullWidth>
                  <InputLabel id="position-label">Position</InputLabel>
                  <Select
                    labelId="position-label"
                    label="Position"
                    value={position}
                    onChange={(event) => setPosition(event.target.value as PositionEnum | "")}
                    disabled={isSubmitting}
                  >
                    <MenuItem value="">Select Position</MenuItem>
                    <MenuItem value="FACULTY">Faculty</MenuItem>
                    <MenuItem value="STAFF">Staff</MenuItem>
                    <MenuItem value="POSTDOC">Postdoc</MenuItem>
                    <MenuItem value="GRAD_STUDENT">Grad Student</MenuItem>
                    <MenuItem value="UNDERGRADUATE">Undergraduate</MenuItem>
                    <MenuItem value="OTHER">Other</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
          </>
        ) : (
          <>
            <Stack spacing={1}>
              <Typography variant="subtitle1">Submitted By</Typography>
              <Typography>{initialValues?.created_by?.name ?? initialValues?.created_by?.email1 ?? "-"}</Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle1">PI</Typography>
              <Typography>
                {initialValues?.pi_name ??
                  initialValues?.pi_email ??
                  selectedPi?.name ??
                  selectedPi?.email1 ??
                  `User ID ${initialValues?.pi_id ?? "-"}`}
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle1">Requested Position</Typography>
              <Typography>{initialValues?.position ? formatPosition(initialValues.position) : "-"}</Typography>
            </Stack>

            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={status}
                onChange={(event) => setStatus(event.target.value as FormStatusEnum)}
                disabled={isSubmitting || initialValues?.status !== "PENDING"}
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="DENIED">Denied</MenuItem>
              </Select>
            </FormControl>

            <ProjectAutocomplete
              value={project ?? undefined}
              onSelect={setProject}
              required={status === "APPROVED"}
              disabled={isSubmitting || status !== "APPROVED"}
            />

            <FormControl fullWidth>
              <InputLabel id="project-position-label">Project Position</InputLabel>
              <Select
                labelId="project-position-label"
                label="Project Position"
                value={projectPosition}
                onChange={(event) => setProjectPosition(event.target.value as PositionEnum | "")}
                disabled={isSubmitting || status !== "APPROVED"}
              >
                <MenuItem value="">Select Position</MenuItem>
                <MenuItem value="FACULTY">Faculty</MenuItem>
                <MenuItem value="STAFF">Staff</MenuItem>
                <MenuItem value="POSTDOC">Postdoc</MenuItem>
                <MenuItem value="GRAD_STUDENT">Grad Student</MenuItem>
                <MenuItem value="UNDERGRADUATE">Undergraduate</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <Stack spacing={2}>
              <SubmitNodeAutocomplete
                value={selectedSubmitNode ?? undefined}
                onSelect={setSelectedSubmitNode}
                disabled={isSubmitting || status !== "APPROVED"}
              />
              <Box>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleAddSubmitNode}
                  disabled={!selectedSubmitNode || isSubmitting || status !== "APPROVED"}
                >
                  Add Submit Node
                </Button>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {submitNodes.map((node) => (
                  <Chip
                    key={node.id}
                    label={node.name}
                    onDelete={isSubmitting || status !== "APPROVED" ? undefined : () => handleRemoveSubmitNode(node.id)}
                  />
                ))}
              </Stack>
            </Stack>
          </>
        )}

        {validationMessage && !submitSuccess ? <Alert severity="info">{validationMessage}</Alert> : null}
        {error ? <Alert severity="error">{typeof error === "string" ? error : "Failed to submit form."}</Alert> : null}

        {!submitSuccess ? (
          <Button type="submit" variant="contained" disabled={Boolean(validationMessage) || isSubmitting}>
            {isSubmitting ? "Submitting..." : mode === "create" ? "Submit" : "Save"}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export default UserApplicationForm;
