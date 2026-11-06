import { useAlert } from "@/src/components/AlertProvider";
import { apiFetch } from "@/src/components/AuthProvider";
import { apiErrorMessage } from "@/src/utils/formErrors";
import { ConfirmButton } from "@chtc/web-components";
import type { ReactNode } from "react";

interface ActionButtonProps {
  url: string;
  method: "DELETE" | "PATCH" | "POST" | "PUT";
  icon: ReactNode;
  color: "error" | "primary";
  ariaLabel: string;
  body?: unknown;
  onSuccess?: () => void;
  /** Called with the API's error detail when the request fails, instead of the default red alert */
  onError?: (detail: string) => void;
  /** Which way the Confirm button opens; deletes open to the left by default */
  growDirection?: "left" | "right";
}

/**
 * Icon button that asks for confirmation before making an API call, e.g. a trash can that
 * sends a DELETE or a star that sends a PATCH.
 * Handles API call and refresh on success
 */
export const ActionButton = ({
  url,
  method,
  icon,
  color,
  ariaLabel,
  body,
  onSuccess,
  onError,
  growDirection = method === "DELETE" ? "left" : "right",
}: ActionButtonProps) => {
  const { showAlert } = useAlert();

  const handleConfirm = async () => {
    const response = await apiFetch(url, {
      method,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    if (!response.ok) {
      const detail = await apiErrorMessage(response, "Request failed");
      (onError ?? ((message: string) => showAlert("ACTION_ERROR", message)))(detail);
      return;
    }
    onSuccess?.();
  };

  return (
    <ConfirmButton aria-label={ariaLabel} color={color} growDirection={growDirection} onConfirm={handleConfirm}>
      {icon}
    </ConfirmButton>
  );
};

export default ActionButton;
