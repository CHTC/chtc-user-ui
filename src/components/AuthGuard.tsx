"use client";

import { Box, Typography } from "@mui/material";
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
      <Box sx={{ width: "100%", padding: 2 }}>
        <Typography variant="h6">{message}</Typography>
      </Box>
    );
  }

  return <>{children}</>;
}
