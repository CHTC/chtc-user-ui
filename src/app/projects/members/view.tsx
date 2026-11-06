"use client";

import ProjectShell from "@/src/app/projects/_components/ProjectShell";
import ProjectMembersTable from "@/src/components/ProjectMembersTable/ProjectMembersTable";

function View() {
  return <ProjectShell>{(project, id) => <ProjectMembersTable projectId={id} project={project} />}</ProjectShell>;
}

export default View;
