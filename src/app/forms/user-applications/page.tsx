"use client";

import { useAuthClient } from "@/src/components/AuthProvider";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthStatus = "checking" | "guest" | "authenticated";

function UserFormPage() {
  const { client } = useAuthClient();
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        await client.getCurrentUser();
        if (cancelled) return;
        setAuthStatus("authenticated");
        router.replace("/forms/user-applications/create");
      } catch {
        if (!cancelled) {
          setAuthStatus("guest");
        }
      }
    };

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [client, router]);

  if (authStatus === "checking" || authStatus === "authenticated") {
    return (
      <Box sx={{ p: 3 }}>
        <Stack spacing={2} alignItems="flex-start">
          <CircularProgress size={24} />
          <Typography>{authStatus === "checking" ? "Checking login status..." : "Redirecting..."}</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack spacing={2} alignItems="flex-start">
        <Typography variant="h4">User Form</Typography>
        <Button href="/api/login?next=/forms/user-applications/create" variant="contained">
          Login with NetID
        </Button>
      </Stack>
    </Box>
  );
}

export default UserFormPage;
