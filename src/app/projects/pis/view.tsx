"use client";

import ProjectShell from "@/src/app/projects/_components/ProjectShell";
import ProjectPiTable from "@/src/components/ProjectPiTable/ProjectPiTable";

function View() {
  return <ProjectShell>{(project, id) => <ProjectPiTable projectId={id} project={project} />}</ProjectShell>;
}

export default View;
