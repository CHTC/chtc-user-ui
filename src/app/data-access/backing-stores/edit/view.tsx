"use client";

import { useAlert } from "@/src/components/AlertProvider";
import ActionButton from "@/src/components/ActionButton/ActionButton";
import { useAuthClient } from "@/src/components/AuthProvider";
import { AuthGuard } from "@/src/components/AuthGuard";
import { BackingStoreForm } from "@/src/components/Forms/BackingStoreForm/BackingStoreForm";
import { fetchJson, ForbiddenError, submitJson } from "@/src/utils/fetchList";
import { ApiError } from "@/src/utils/formErrors";
import usePageTitle from "@/src/utils/usePageTitle";
import type { BackingStore, BackingStoreCreateUpdate } from "@/types";
import { Delete } from "@mui/icons-material";
import { Alert, Box, Breadcrumbs, Skeleton, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR from "swr";

function View() {
  const { currentUser } = useAuthClient();

  return (
    <AuthGuard message="You must be logged in to edit a backing store.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Backing Store</Typography>
        </Breadcrumbs>
        {currentUser?.is_admin ? (
          <Suspense fallback={<Skeleton variant="rectangular" height="300px" />}>
            <BackingStorePage />
          </Suspense>
        ) : (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Only staff can manage backing stores.
          </Alert>
        )}
      </Box>
    </AuthGuard>
  );
}

const storeFetcher = async (id: number): Promise<BackingStore | "forbidden"> => {
  try {
    return await fetchJson<BackingStore>(`/backing_stores/${id}`);
  } catch (e) {
    if (e instanceof ForbiddenError) return "forbidden";
    throw e;
  }
};

const BackingStorePage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showAlert } = useAlert();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  const { data: store, mutate } = useSWR(id ? [`/backing_stores/${id}`] : null, () => storeFetcher(id!), {
    suspense: true,
  });
  const [error, setError] = useState<string | ApiError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  usePageTitle(store && store !== "forbidden" ? "Backing store: " + store.name : null);

  if (!id) return <Typography color="error">No backing store ID provided.</Typography>;
  if (!store || store === "forbidden") return <Typography color="error">You do not have access to this backing store</Typography>;

  const handleSubmit = async (payload: BackingStoreCreateUpdate) => {
    setError(null);
    setIsSubmitting(true);
    const result = await submitJson<BackingStore>(`/backing_stores/${id}`, "PUT", payload, "Failed to update backing store");
    setIsSubmitting(false);
    if (result.data === null) {
      setError(result.error);
      return;
    }
    await mutate();
    showAlert("UPDATE_BACKING_STORE_SUCCESS");
  };

  return (
    <BackingStoreForm
      key={store.updated_at}
      mode="edit"
      initialValues={store}
      onSubmit={handleSubmit}
      error={error}
      isSubmitting={isSubmitting}
      extraActions={
        // ActionButton shows the API's 409 ("referenced by data access entries") as an error alert
        <ActionButton
          method="DELETE"
          icon={<Delete />}
          color="error"
          url={`/backing_stores/${id}`}
          ariaLabel="Delete backing store"
          onSuccess={() => router.push("/data-access/backing-stores")}
        />
      }
    />
  );
};

export default View;
