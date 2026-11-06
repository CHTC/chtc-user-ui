"use client";

import { LinearProgress } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/** The user pages moved to /users/details/?id=N; this keeps old links and bookmarks working */
function View() {
  // Reading the id needs a Suspense boundary for static export
  return (
    <Suspense fallback={<LinearProgress />}>
      <Redirect />
    </Suspense>
  );
}

const Redirect = () => {
  const router = useRouter();
  const id = useSearchParams().get("id");

  useEffect(() => {
    router.replace(id ? `/users/details/?id=${encodeURIComponent(id)}` : "/users/");
  }, [router, id]);

  return <LinearProgress />;
};

export default View;
