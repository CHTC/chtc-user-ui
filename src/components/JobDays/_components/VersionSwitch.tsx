"use client";

import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";

/** The two calendar models the job pages can draw. */
export type CalendarVersion = "v1" | "v2";

/** The route segment calendar v2 lives under, on both job routes. */
const V2_SEGMENT = "v2/";

/**
 * A link from either calendar version to the other, on the same route and for
 * the same user and window.
 *
 * Both versions live at parallel paths -- /users/me/jobs/ and /users/me/jobs/v2/,
 * /users/jobs/calendar/ and /users/jobs/calendar/v2/ -- and take the same query
 * parameters, so the other version is the current URL with one segment added or
 * removed. Computed in an effect: the site is a static export, and the URL
 * cannot be read while rendering server HTML.
 */
export default function VersionSwitch({ current }: { current: CalendarVersion }) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    let path = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
    if (current === "v1") {
      path = `${path}${V2_SEGMENT}`;
    } else if (path.endsWith(V2_SEGMENT)) {
      path = path.slice(0, -V2_SEGMENT.length);
    }
    setHref(`${path}${url.search}`);
  }, [current]);

  if (!href) return null;

  return current === "v1" ? (
    <Button component={Link} href={href} size="small" endIcon={<ArrowForwardIcon />}>
      Try calendar v2
    </Button>
  ) : (
    <Button component={Link} href={href} size="small" startIcon={<ArrowBackIcon />}>
      Back to calendar v1
    </Button>
  );
}
