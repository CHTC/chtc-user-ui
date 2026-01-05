import { Box } from "@mui/material";
import React from "react";

export interface ValidationError {
  type: string;
  loc: string[];
  msg: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface ApiError {
  detail?: ValidationError[] | string;
}

export function formatErrorMessage(
  error: string | ApiError | null,
  fieldNameMap: Record<string, string>,
): React.ReactNode {
  if (!error) return null;

  if (typeof error === "string") {
    return error;
  }

  // Handle ApiError with detail
  if (error.detail) {
    // If detail is a string, return it
    if (typeof error.detail === "string") {
      return error.detail;
    }

    // If detail is an array of validation errors, format them
    if (Array.isArray(error.detail)) {
      return (
        <Box>
          <Box sx={{ mb: 1, fontWeight: 500 }}>Validation errors:</Box>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {error.detail.map((err, idx) => {
              // Extract field name from location (e.g., ["body", "name"] -> "name")
              const field = err.loc.length > 1 ? err.loc[err.loc.length - 1] : err.loc[0];
              const fieldName = fieldNameMap[String(field)] || String(field);

              return (
                <li key={idx}>
                  <strong>{fieldName}:</strong> {err.msg}
                </li>
              );
            })}
          </ul>
        </Box>
      );
    }
  }

  return "An error occurred";
}
