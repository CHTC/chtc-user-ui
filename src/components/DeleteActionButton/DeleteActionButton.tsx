import { apiFetch } from "@/src/components/AuthProvider";
import { ConfirmButton } from "@chtc/web-components";
import { Delete } from "@mui/icons-material";

interface DeleteButtonProps {
  url: string;
  onSuccess?: () => void;
  ariaLabel?: string;
}

/**
 * Delete button with confirmation dialog
 * Handles API call and refresh on success
 */
export const DeleteActionButton = ({ url, onSuccess, ariaLabel = "Delete" }: DeleteButtonProps) => {
  const handleDelete = async () => {
    await apiFetch(url, {
      method: "DELETE",
    });
    onSuccess?.();
  };

  return (
    <ConfirmButton aria-label={ariaLabel} color="error" onConfirm={handleDelete}>
      <Delete />
    </ConfirmButton>
  );
};

export default DeleteActionButton;
