"use client";

import { useEffect, useState } from "react";
import { Box, ButtonGroup, Button, Typography } from "@mui/material";
import Link from "next/link";

/** The calendar models the job pages can draw. */
export type CalendarVersion = "v1" | "v2" | "v3";

/** The route segment each version lives under, relative to its route's base. */
const SEGMENTS: Record<CalendarVersion, string> = {
  v1: "",
  v2: "v2/",
  v3: "v3/",
};

/** What each button says, and what it promises. */
const LABELS: Record<CalendarVersion, { short: string; title: string }> = {
  v1: { short: "v1", title: "Bars scaled to the whole month; teal completion ground" },
  v2: { short: "v2", title: "Bars scaled to each day; teal completion ground" },
  v3: { short: "v3", title: "Bars scaled to each day; end-of-day ratio bar on the queue ramp" },
};

/**
 * The base of the current route with any version segment removed: the path v1
 * lives at, which every other version hangs off.
 */
function basePathOf(pathname: string): string {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`;
  for (const segment of [SEGMENTS.v2, SEGMENTS.v3]) {
    if (path.endsWith(segment)) return path.slice(0, -segment.length);
  }
  return path;
}

/**
 * Which versions exist at a given base. v1 and v2 are mirrored on both job
 * routes; v3 was built for the admin calendar only, so offering it under
 * /users/me/jobs/ would link to a 404.
 */
function versionsAt(base: string): CalendarVersion[] {
  return base.endsWith("/users/jobs/calendar/") ? ["v1", "v2", "v3"] : ["v1", "v2"];
}

/**
 * A link from the calendar version on screen to each of the others, on the same
 * route and for the same user and window.
 *
 * The versions live at parallel paths -- /users/jobs/calendar/, .../v2/,
 * .../v3/ -- and take the same query parameters, so another version is the
 * current URL with its version segment swapped. Computed in an effect: the site
 * is a static export, and the URL cannot be read while rendering server HTML.
 */
export default function VersionSwitch({ current }: { current: CalendarVersion }) {
  const [links, setLinks] = useState<{ version: CalendarVersion; href: string }[] | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const base = basePathOf(url.pathname);
    setLinks(
      versionsAt(base).map((version) => ({
        version,
        href: `${base}${SEGMENTS[version]}${url.search}`,
      })),
    );
  }, [current]);

  if (!links) return null;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        Calendar
      </Typography>
      <ButtonGroup size="small" aria-label="Calendar version">
        {links.map(({ version, href }) =>
          version === current ? (
            <Button
              key={version}
              variant="contained"
              disableElevation
              aria-current="page"
              title={LABELS[version].title}
            >
              {LABELS[version].short}
            </Button>
          ) : (
            <Button
              key={version}
              component={Link}
              href={href}
              variant="outlined"
              title={LABELS[version].title}
            >
              {LABELS[version].short}
            </Button>
          ),
        )}
      </ButtonGroup>
    </Box>
  );
}
