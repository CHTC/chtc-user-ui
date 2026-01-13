import { OpenInNew } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import Link from "next/link";

interface EditLinkProps {
  href: string;
  ariaLabel?: string;
}

/**
 * Link component with OpenInNew icon
 * Used for navigation to edit pages from table rows
 */
export const EditLink = ({ href, ariaLabel = "Go to edit page" }: EditLinkProps) => {
  return (
    <IconButton component={Link} href={href} size="small" aria-label={ariaLabel}>
      <OpenInNew fontSize="small" />
    </IconButton>
  );
};

export default EditLink;
