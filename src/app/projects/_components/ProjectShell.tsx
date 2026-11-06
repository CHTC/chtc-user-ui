"use client";

import { AuthGuard } from "@/src/components/AuthGuard";
import { useAuthClient } from "@/src/components/AuthProvider";
import DetailFrame, { type DetailPage } from "@/src/components/DetailFrame/DetailFrame";
import usePageTitle from "@/src/utils/usePageTitle";
import { ProjectForbiddenError, useProject } from "@/src/utils/useProject";
import type { Project } from "@/types";
import { Skeleton, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { Component, type ReactNode, Suspense } from "react";

/** Shows a short message for a 403 on the project; any other error is rethrown to the app's boundary */
class ForbiddenBoundary extends Component<{ children: ReactNode }, { forbidden: boolean }> {
  state = { forbidden: false };
  static getDerivedStateFromError(error: unknown) {
    if (error instanceof ProjectForbiddenError) return { forbidden: true };
    throw error;
  }
  render() {
    if (this.state.forbidden) return <Typography color="error">You do not have access to this project.</Typography>;
    return this.props.children;
  }
}

type ProjectPage = (project: Project, id: number) => ReactNode;

/**
 * The frame every page of one project shares: login check, the project from ?id=, its name and
 * the tabs between its pages. The page itself is a function of the loaded project.
 */
const ProjectShell = ({ children }: { children: ProjectPage }) => (
  <AuthGuard message="You must be logged in to view a project.">
    <ForbiddenBoundary>
      <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
        <ProjectFrame>{children}</ProjectFrame>
      </Suspense>
    </ForbiddenBoundary>
  </AuthGuard>
);

const ProjectFrame = ({ children }: { children: ProjectPage }) => {
  const searchParams = useSearchParams();
  const id = Number.parseInt(searchParams.get("id") || "") || null;

  if (!id) {
    return <Typography color="error">No project ID provided.</Typography>;
  }
  return <ProjectLoaded id={id}>{children}</ProjectLoaded>;
};

const ProjectLoaded = ({ id, children }: { id: number; children: ProjectPage }) => {
  const { data: project } = useProject(id);
  const { currentUser } = useAuthClient();

  usePageTitle(project ? "Project: " + project.name : null);

  const pages: DetailPage[] = [
    { label: "Details", path: "/projects/details/" },
    {
      label: "Members",
      path: "/projects/members/",
      children: [
        { label: "Direct", path: "/projects/members/" },
        { label: "Users", path: "/projects/members/users/" },
      ],
    },
    { label: "PIs", path: "/projects/pis/" },
    // Notes are staff only
    ...(currentUser?.is_admin ? [{ label: "Notes", path: "/projects/notes/" }] : []),
  ];

  return (
    <DetailFrame
      section={{ label: "Projects", href: "/projects/" }}
      title={project?.display_name || project?.name}
      pages={pages}
      id={id}
    >
      <Suspense fallback={<Skeleton variant="rectangular" height="400px" />}>
        {project && children(project, id)}
      </Suspense>
    </DetailFrame>
  );
};

export default ProjectShell;
