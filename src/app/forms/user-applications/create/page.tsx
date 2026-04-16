"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import UserApplicationCreateForm from "@/src/components/Forms/UserApplicationForm/UserApplicationCreateForm";
import { UserFormPost } from "@/types";
import {Alert, Box, Skeleton } from "@mui/material";
import { useState } from "react";
import LandingPage from "@/src/app/forms/user-applications/create/_components/LandingPage";

function CreateUserFormPage() {
  const { isAuthenticated, currentUser, loading } = useAuthClient();
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

  if (loading) {
    return <Box>
      <Skeleton variant={"rounded"} height={"800px"} sx={{ minHeight: "80vh" }} />
    </Box>
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (currentUser?.active) {
    return <Alert severity="info">Your account is already active. No need to submit another application.</Alert>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <UserApplicationCreateForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={submitError}
        submitSuccess={submitSuccess}
      />
    </Box>
  );
}

export default CreateUserFormPage;
