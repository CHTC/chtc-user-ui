"use client";

import SadCondor from "@/src/components/SadCondor/SadCondor";
import { Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect } from "react";
import { useSWRConfig } from "swr";

/**
 * App-wide error boundary. Catches anything thrown while rendering a route, including
 * fetch errors that suspense-mode SWR throws during render.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { cache } = useSWRConfig();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // Suspense-mode SWR rethrows a cached error on the next render, so clear the cache before retrying
  const retry = () => {
    for (const key of Array.from(cache.keys())) {
      cache.delete(key);
    }
    reset();
  };

  return (
    <Stack alignItems="center" spacing={2} sx={{ maxWidth: 480, mx: "auto", py: 6, px: 2, textAlign: "center" }}>
      <SadCondor />
      <Typography variant="h5" component="h1">
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {error.message || "An unexpected error occurred."}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={retry}>
          Try again
        </Button>
        <Button component={Link} href="/">
          Go home
        </Button>
      </Stack>
    </Stack>
  );
}
