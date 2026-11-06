"use client";

import ProjectShell from "@/src/app/projects/_components/ProjectShell";
import ProjectMembersTable from "@/src/components/ProjectMembersTable/ProjectMembersTable";

/** Every user with access to the project and the path it comes through */
function View() {
  return (
    <ProjectShell>
      {(project, id) => <ProjectMembersTable projectId={id} project={project} view="users" />}
    </ProjectShell>
  );
}

export default View;
