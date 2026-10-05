"use client";

import { Breadcrumbs, Link as MuiLink, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";

import { readOwnerParam } from "../params";

/**
 * The trail back to the user table, naming whose calendar this is once the
 * URL has been read.
 *
 * Starts as a plain "Job calendar" so the trail is on screen from the first
 * paint, before anything on the page has loaded; the first client render then
 * fills in the netid from the link. Read from the URL rather than waited for
 * from the data, since the link already says whose jobs these are and the
 * reader should not have to wait a minute of fetching to be told.
 */
export default function CalendarBreadcrumbs() {
  const [owner, setOwner] = useState<string | null>(null);
  useEffect(() => {
    setOwner(readOwnerParam());
  }, []);

  return (
    <Breadcrumbs aria-label="Back to the user table" sx={{ mb: 2 }}>
      <MuiLink component={Link} href="/users/jobs/" underline="hover" color="inherit">
        User Job Table
      </MuiLink>
      <Typography color="text.primary">
        {owner ? `${owner}'s Job Calendar` : "Job calendar"}
      </Typography>
    </Breadcrumbs>
  );
}
