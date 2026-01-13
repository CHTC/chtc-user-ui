import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { Project } from "@/types";

interface ProjectAutocompleteProps {
  value?: Partial<Project>;
  onSelect: (project: Project | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
}

const ProjectAutocomplete = ({ value, onSelect, defaultFilter, required }: ProjectAutocompleteProps) => {
  return (
    <GenericAutocomplete<Project>
      endpoint="/projects"
      label="Select Project"
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => option?.name ?? ""}
      matchItem={(project, val) => project.id === val.id || project.name === val.name}
      searchField="name"
      required={required}
    />
  );
};

export default ProjectAutocomplete;
