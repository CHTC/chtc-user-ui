"use client";

import ProjectDetails from "@/src/app/projects/_components/ProjectDetails";
import ProjectShell from "@/src/app/projects/_components/ProjectShell";

function View() {
  return <ProjectShell>{(project, id) => <ProjectDetails project={project} id={id} />}</ProjectShell>;
}

export default View;
