"use client";

import type { ApiError } from "@/src/components/Forms/UserForm/UserForm";
import ProjectAutocomplete from "@/src/components/ProjectAutocomplete/ProjectAutocomplete";
import SubmitNodeAutocomplete from "@/src/components/SubmitNodeAutocomplete/SubmitNodeAutocomplete";
import { apiFetch } from "@/src/components/AuthProvider";
import type { FormStatusEnum, Group, PositionEnum, Project, User, UserForm, UserFormPatch } from "@/types"; // TODO: Remove this — removed SubmitNode (submit nodes → SUBMIT_NODE groups)
import {
  Alert, AlertTitle,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import useSWR from "swr";

export interface UserApplicationEditFormProps {
  initialValues?: UserForm | null;
  onSubmit: (payload: UserFormPatch) => Promise<void> | void;
  isSubmitting?: boolean;
  error?: string | ApiError | null;
  submitSuccess?: boolean;
}

function formatPosition(position: PositionEnum) {
  return position
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function ReviewField({ label, value }: { label: string; value: string | null }) {
  if (!value) {
    return null;
  }

  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

type Step = "initial" | "existing-check" | "form";

const userFetcher = async (id: number | null) => {
  if (!id) return null;
  const response = await apiFetch(`/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user with id ${id}: ${response.statusText}`);
  }
  return response.json();
};

export function UserApplicationEditForm({
  initialValues,
  onSubmit,
  isSubmitting = false,
  error = null,
  submitSuccess = false,
}: UserApplicationEditFormProps) {
  const [step, setStep] = useState<Step>("initial");
  const [project, setProject] = useState<Project | null>(null);
  const [userPosition, setUserPosition] = useState<PositionEnum | "">(initialValues?.position ?? "");
  const [selectedSubmitNodeGroup, setSelectedSubmitNodeGroup] = useState<Group | null>(null);
  const [submitNodeGroups, setSubmitNodeGroups] = useState<Group[]>([]);
  const [email, setEmail] = useState<string>(initialValues?.email ?? "");
  const content = initialValues?.content;
  const piDisplay = initialValues?.pi_name ?? `User ID ${initialValues?.pi_id ?? "-"}`;
  const piEmail = initialValues?.pi_email ?? null;

  const applicantId = initialValues?.created_by?.id ?? null;
  const { data: applicant } = useSWR(applicantId ? [`/users/${applicantId}`] : null, () => userFetcher(applicantId) as Promise<User>);

  const needsEmail = !applicant?.email1;

  const userWasPreviouslyActive = useMemo(() => {
    return Boolean(
      (applicant?.groups?.length ?? 0) ||
      (applicant?.projects?.length ?? 0)
      // (applicant?.submit_nodes?.length ?? 0)
    );
  }, [applicant]);

  const validationMessage = useMemo(() => {
    if (needsEmail && !email.trim()) return "Enter the user's email address before approving.";
    if (!project) return "Select a project before approving.";
    if (userPosition === "") return "Choose a project position before approving.";
    if (submitNodeGroups.length === 0) return "Add at least one submit node before approving.";
    return null;
  }, [needsEmail, email, project, userPosition, submitNodeGroups.length]);

  const handleDeny = async () => {
    await onSubmit({ status: "DENIED" });
  };

  const handleApproveClick = () => {
    if (userWasPreviouslyActive) {
      setStep("existing-check");
    } else {
      setStep("form");
    }
  };

  const handleKeepExisting = async () => {
    await onSubmit({ status: "APPROVED", preserve_existing_data: true });
  };

  const handleStartFresh = () => {
    setStep("form");
  };

  const handleAddSubmitNode = () => {
    if (!selectedSubmitNodeGroup || submitNodeGroups.some((node) => node.id === selectedSubmitNodeGroup.id)) {
      return;
    }
    setSubmitNodeGroups((current) => [...current, selectedSubmitNodeGroup]);
    setSelectedSubmitNodeGroup(null);
  };

  const handleRemoveSubmitNode = (id: number) => {
    setSubmitNodeGroups((current) => current.filter((node) => node.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage) return;

    await onSubmit({
      status: "APPROVED",
      email: needsEmail ? email.trim() || undefined : undefined,
      project_id: project?.id ?? 0,
      user_position: userPosition as PositionEnum,
      submit_node_group_ids: submitNodeGroups.map((group) => (group.id)),
    });
  };

  const isPending = initialValues?.status === "PENDING";

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={3} alignItems="flex-start">
        {/* Application Details (always visible) */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Application Details</Typography>
              <ReviewField
                label="Submitted By"
                value={initialValues?.created_by?.name ?? initialValues?.created_by?.email1 ?? "-"}
              />
              <ReviewField label={"Department"} value={content?.department} />
              <ReviewField label="PI Name" value={piDisplay} />
              <ReviewField label="PI Email" value={piEmail} />
              <ReviewField
                label="Requested Position"
                value={initialValues?.position ? formatPosition(initialValues.position) : "-"}
              />
              <ReviewField
                label="Mentor"
                value={
                  [
                    (content?.mentor_name as string | null | undefined) ?? null,
                    (content?.mentor_email as string | null | undefined) ?? null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || null
                }
              />
              <ReviewField label="How They Heard About CHTC" value={(content?.marketing_attribution as string | null | undefined) ?? null} />
              <ReviewField label="How CHTC Can Help" value={(content?.how_chtc_can_help as string | null | undefined) ?? null} />
              <ReviewField label="Research Computing Areas" value={(content?.research_computing_area as string | null | undefined) ?? null} />
              <ReviewField label="Software / Program" value={(content?.software_link as string | null | undefined) ?? null} />
              <ReviewField label="Prior Systems" value={(content?.prior_systems as string | null | undefined) ?? null} />
              <ReviewField label="Computing Type" value={(content?.computing_type as string | null | undefined) ?? null} />
              <ReviewField label="CPU Cores" value={(content?.cpu_cores as string | null | undefined) ?? null} />
              <ReviewField label="Memory (GB)" value={(content?.memory_gb as string | null | undefined) ?? null} />
              <ReviewField label="Disk Space (GB)" value={(content?.disk_space_gb as string | null | undefined) ?? null} />
              <ReviewField label="Runtime (Hours)" value={(content?.calculation_runtime_hours as string | null | undefined) ?? null} />
              <ReviewField label="GPU Needs" value={(content?.gpu_type as string | null | undefined) ?? null} />
              <ReviewField label="Calculation Quantity" value={(content?.calculation_quantity as string | null | undefined) ?? null} />
              <ReviewField label="Special Access" value={(content?.special_access as string | null | undefined) ?? null} />
              <ReviewField label="Additional Information" value={(content?.extra_info as string | null | undefined) ?? null} />
            </Stack>
          </Paper>
        </Grid>

        {/* Review Actions */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, position: { lg: "sticky" }, top: { lg: 88 } }}>
            <Stack spacing={3}>
              <Stack spacing={0.5}>
                <Typography variant="h6">Review Actions</Typography>
                <Typography variant="body2" color="text.secondary">
                  Set the decision and assign the approved account details.
                </Typography>
              </Stack>

              {/* Step: initial — Approve / Deny */}
              {step === "initial" && isPending && !submitSuccess && (
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleApproveClick}
                    disabled={isSubmitting}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleDeny}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Deny"}
                  </Button>
                </Stack>
              )}

              {/* Step: existing-check — user has existing resources */}
              {step === "existing-check" && !submitSuccess && (
                <>
                  <Button
                    variant="text"
                    size="small"
                    sx={{ alignSelf: "flex-start" }}
                    onClick={() => setStep("initial")}
                    disabled={isSubmitting}
                  >
                    ← Back
                  </Button>
                  <Alert severity="warning">
                    <AlertTitle>User Has Existing Authorization</AlertTitle>
                    <Box>
                      This user has existing authorizations in the form of groups, projects, etc. How would you like to proceed?
                    </Box>
                    <Stack direction="row" spacing={2} mt={2}>
                      <Button
                        variant="contained"
                        onClick={handleKeepExisting}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Approve and Keep Existing"}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleStartFresh}
                        disabled={isSubmitting}
                      >
                        Approve and Start Fresh
                      </Button>
                    </Stack>
                    <Box mt={2}>
                      <Typography variant="body2">
                        <b>Approve and Start Fresh</b> will remove ALL of the user&apos;s current projects, groups, and submit nodes.
                      </Typography>
                    </Box>
                  </Alert>
                </>
              )}

              {/* Step: form — full approval form */}
              {step === "form" && !submitSuccess && (
                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={3}>
                    <Button
                      variant="text"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                      onClick={() => setStep(userWasPreviouslyActive ? "existing-check" : "initial")}
                      disabled={isSubmitting}
                    >
                      ← Back
                    </Button>
                    {needsEmail && (
                      <TextField
                        required
                        label="User Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                        helperText="This user has no email on record. Enter one to assign on approval."
                      />
                    )}
                    <ProjectAutocomplete
                      value={project ?? undefined}
                      onSelect={setProject}
                      required
                      disabled={isSubmitting}
                    />

                    <FormControl fullWidth>
                      <InputLabel id="project-position-label">Project Position</InputLabel>
                      <Select
                        labelId="project-position-label"
                        label="Project Position"
                        value={userPosition}
                        onChange={(event) => setUserPosition(event.target.value as PositionEnum | "")}
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

                    <Stack spacing={2}>
                      <SubmitNodeAutocomplete
                        value={selectedSubmitNodeGroup ?? undefined}
                        onSelect={setSelectedSubmitNodeGroup}
                        disabled={isSubmitting}
                      />
                      <Box>
                        <Button
                          type="button"
                          variant="outlined"
                          onClick={handleAddSubmitNode}
                          disabled={!selectedSubmitNodeGroup || isSubmitting}
                        >
                          Add Submit Node
                        </Button>
                      </Box>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {submitNodeGroups.map((node) => (
                          <Chip
                            key={node.id}
                            label={node.name}
                            onDelete={isSubmitting ? undefined : () => handleRemoveSubmitNode(node.id)}
                          />
                        ))}
                      </Stack>
                    </Stack>

                    {validationMessage && <Alert severity="info">{validationMessage}</Alert>}

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={Boolean(validationMessage) || isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Approve"}
                    </Button>
                  </Stack>
                </Box>
              )}

              {error && (
                <Alert severity="error">
                  {typeof error === "string" ? error : "Failed to submit form."}
                </Alert>
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default UserApplicationEditForm;
