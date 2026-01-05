"use client";

import { ApiError, formatErrorMessage } from "@/src/utils/formErrors";
import { Alert } from "@mui/material";
import React, { useEffect, useRef } from "react";

export interface FormErrorAlertProps {
  error: string | ApiError | null;
  fieldNameMap: Record<string, string>;
}

export const FormErrorAlert: React.FC<FormErrorAlertProps> = ({ error, fieldNameMap }) => {
  const errorRef = useRef<HTMLDivElement>(null);

  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

  if (!error) return null;

  return (
    <Alert ref={errorRef} severity="error">
      {formatErrorMessage(error, fieldNameMap)}
    </Alert>
  );
};

export default FormErrorAlert;
