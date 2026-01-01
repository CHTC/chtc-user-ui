"use client";

import { apiFetch, useAuthClient } from "@/src/components/AuthProvider";
import { UserForm } from "@/src/components/Forms/UserForm/UserForm";
import type { UserCreate } from "@/src/util/types";
import { Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function Page() {
  const { isAuthenticated } = useAuthClient();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (payload: UserCreate) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const userResponse = await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!userResponse.ok) {
        throw new Error(`Failed to create user: ${userResponse.statusText}`);
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

  if (!isAuthenticated) {
    return (
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">You must be logged in to create a user.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs>
        <Typography color="text.primary">Create User</Typography>
      </Breadcrumbs>
      <UserForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
    </Box>
  );
}

export default Page;
