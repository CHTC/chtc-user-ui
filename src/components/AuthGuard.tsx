"use client";

import { Alert, Box } from "@mui/material";
import { ReactNode } from "react";
import { useAuthClient } from "./AuthProvider";

export interface AuthGuardProps {
  children: ReactNode;
  message: string;
}

/**
 * AuthGuard component that prevents rendering children unless user is authenticated.
 * Displays a message when user is not authenticated.
 */
export function AuthGuard({ children, message }: AuthGuardProps) {
  const { isAuthenticated } = useAuthClient();

  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">{message}</Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
