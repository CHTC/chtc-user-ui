import LinkIcon from '@mui/icons-material/Link';
import { IconButton } from "@mui/material";
import Link from "next/link";

interface EditLinkProps {
  href: string;
  ariaLabel?: string;
}

/**
 * Link component with Link icon
 * Used for navigation to edit pages from table rows
 */
export const EditLink = ({ href, ariaLabel = "Go to edit page" }: EditLinkProps) => {
  return (
    <IconButton component={Link} href={href} size="small" aria-label={ariaLabel}>
      <LinkIcon fontSize="small" />
    </IconButton>
  );
};

export default EditLink;
