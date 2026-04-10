"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import UserApplicationForm from "@/src/components/Forms/UserApplicationForm/UserApplicationForm";
import type { UserFormPost } from "@/types";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useState } from "react";

function CreateUserFormPage() {
  const { isAuthenticated } = useAuthClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (payload: UserFormPost) => {
    setSubmitError(null);
    setSubmitSuccess(false);
    setIsSubmitting(true);

    try {
      const response = await apiFetch("/forms/user-applications", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = `Failed to submit form: ${response.statusText}`;
        try {
          const errorData = (await response.json()) as { detail?: string };
          if (typeof errorData.detail === "string" && errorData.detail.length > 0) {
            message = errorData.detail;
          }
        } catch {
          // Keep the fallback status text message.
        }
        setSubmitError(message);
        return;
      }

      setSubmitSuccess(true);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Alert severity="warning">You must be logged in to access this form.</Alert>
          <Button href="/api/login?next=/forms/user/create" variant="contained">
            Login with NetID
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 640 }}>
      <Stack spacing={3}>
        <Typography variant="h4">Account Request Form</Typography>

        {/* <Typography variant="body1">Currently logged in as: ...</Typography> */}

        <Typography variant="body1">
          Thank you for applying for an account at the Center for High Throughput Computing (CHTC). To request an
          account, please fill out the information below.
        </Typography>

        <UserApplicationForm
          mode="create"
          onSubmit={(payload) => handleSubmit(payload as UserFormPost)}
          isSubmitting={isSubmitting}
          error={submitError}
          submitSuccess={submitSuccess}
        />
      </Stack>
    </Box>
  );
}

export default CreateUserFormPage;
