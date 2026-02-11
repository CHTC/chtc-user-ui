"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { apiFetch } from "@/src/components/AuthProvider";
import { TokenForm } from "@/src/components/Forms/TokenForm/TokenForm";
import { ApiError } from "@/src/utils/formErrors";
import type { TokenPost } from "@/types";
import { Alert, Box, Breadcrumbs, Typography } from "@mui/material";
import { useState } from "react";

function Page() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | ApiError | null>(null);
  const [tokenValue, setTokenValue] = useState<string | null>(null);

  const handleSubmit = async (payload: TokenPost) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const tokenResponse = await apiFetch("/tokens", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!tokenResponse.ok) {
        // Try to parse structured error response
        try {
          const errorData = await tokenResponse.json();
          setError(errorData as ApiError);
        } catch {
          // Fallback to status text if JSON parsing fails
          setError(`Failed to create token: ${tokenResponse.statusText}`);
        }
        return;
      }

      const tokenData = await tokenResponse.json();
      setTokenValue(tokenData.token);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to create token";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard message="You must be logged in to create a token.">
      <Box>
        <Breadcrumbs>
          <Typography color="text.primary">Create Token</Typography>
        </Breadcrumbs>

        {tokenValue ? (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Token created successfully! Please copy this token now as it will not be shown again.
            </Alert>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                Your Token:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "monospace",
                  wordBreak: "break-all",
                  bgcolor: "background.paper",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                {tokenValue}
              </Typography>
            </Alert>
          </Box>
        ) : (
          <TokenForm mode="create" onSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />
        )}
      </Box>
    </AuthGuard>
  );
}

export default Page;
