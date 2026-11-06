"use client";

import { Link, Typography } from "@mui/material";
import { usePathname, useSearchParams } from "next/navigation";
import { type ReactNode, Suspense } from "react";

interface SectionHeaderProps {
  title: string;
  href: string;
  /** e.g. an Add button */
  action?: ReactNode;
}

/**
 * A section's big heading (Users, Projects, ...). Pages about one record (/users/details/?id=N and
 * its siblings) show breadcrumbs back to the list instead, so the heading is left off there.
 */
const SectionHeader = (props: SectionHeaderProps) => (
  // Reading the URL needs a Suspense boundary for static export
  <Suspense fallback={null}>
    <Header {...props} />
  </Suspense>
);

// trailingSlash is on, but compare without it so "/users" and "/users/" match
const normalize = (path: string) => path.replace(/\/+$/, "");

const Header = ({ title, href, action }: SectionHeaderProps) => {
  const hasId = useSearchParams().has("id");
  const pathname = usePathname();
  const isRecordPage = hasId && normalize(pathname) !== normalize(href);
  if (isRecordPage) return null;

  return (
    <Typography variant={"h3"} component="h1" sx={{ mb: 2, display: "flex", justifyContent: "space-between" }}>
      <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
        {title}
      </Link>
      {action}
    </Typography>
  );
};

export default SectionHeader;
