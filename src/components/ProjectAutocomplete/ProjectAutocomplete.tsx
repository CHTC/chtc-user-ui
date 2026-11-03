import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { Project } from "@/types";
import type { ReactNode } from "react";

interface ProjectAutocompleteProps {
  value?: Partial<Project>;
  onSelect: (project: Project | null) => void;
  defaultFilter?: Record<string, string>;
  label?: string;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
}

const ProjectAutocomplete = ({ value, onSelect, defaultFilter, label, helperText, required, disabled }: ProjectAutocompleteProps) => {
  return (
    <GenericAutocomplete<Project>
      endpoint="/projects"
      label={label ?? "Select Project"}
      helperText={helperText}
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => option?.name ?? ""}
      searchFields={["name"]}
      required={required}
      disabled={disabled}
    />
  );
};

export default ProjectAutocomplete;
