"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import { UserForm } from "@/src/components/Forms/UserForm/UserForm";
import { ApiError } from "@/src/utils/formErrors";
import type { UserCreate, UserUpdate } from "@/types";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function View() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);

  const handleSubmit = async (payload: UserCreate | Partial<UserUpdate>) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const userResponse = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!userResponse.ok) {
        // Try to parse structured error response
        try {
          const errorData = await userResponse.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to create user: ${userResponse.statusText}`);
        }
        return;
      }

      const user = await userResponse.json();
      router.push(`/users/edit?id=${user.id}`);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create user";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to create a user.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Create User</Typography>
        </Breadcrumbs>
        <UserForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} adminView={true} />
      </Box>
    </AuthGuard>
  );
}

export default View;
