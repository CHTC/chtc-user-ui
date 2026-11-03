"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import { AuthGuard } from "@/src/components/AuthGuard";
import { BackingStoreForm } from "@/src/components/Forms/BackingStoreForm/BackingStoreForm";
import { submitJson } from "@/src/utils/fetchList";
import { ApiError } from "@/src/utils/formErrors";
import type { BackingStore, BackingStoreCreateUpdate } from "@/types";
import { Alert, Box, Breadcrumbs, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

function View() {
  const router = useRouter();
  const { currentUser } = useAuthClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);

  const handleSubmit = async (payload: BackingStoreCreateUpdate) => {
    setError(null);
    setIsSubmitting(true);
    const result = await submitJson<BackingStore>("/backing_stores", "POST", payload, "Failed to create backing store");
    setIsSubmitting(false);
    if (result.data === null) {
      setError(result.error);
      return;
    }
    router.push(`/data-access/backing-stores/edit?id=${result.data.id}`);
  };

  return (
    <AuthGuard message="You must be logged in to create a backing store.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Create Backing Store</Typography>
        </Breadcrumbs>
        {currentUser?.is_admin ? (
          <BackingStoreForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
        ) : (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Only staff can create backing stores.
          </Alert>
        )}
      </Box>
    </AuthGuard>
  );
}

export default View;
