import {useEffect, useState} from "react";
import useSWR from "swr";
import useDebounce from "@/src/hooks/useDebounce/useDebounce";
import {Autocomplete, TextField} from "@mui/material";
import {apiFetch} from "@/src/components/AuthProvider";
import type {Project} from "@/types";

interface ProjectAutocompleteProps {
  value?: Partial<Project>;
  onSelect: (project: Project | null) => void;
  defaultFilter?: Record<string, string>;
}

const ProjectAutocomplete = ({ value, onSelect, defaultFilter }: ProjectAutocompleteProps) => {
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

  const {data: projects} = useSWR(["/projects?page_size=100", debouncedInputValue], async (): Promise<Project[]> => {
    const urlParams = new URLSearchParams();
    urlParams.append("page_size", "100");

    if (debouncedInputValue) {
      // Assuming backend supports name filtering similar to users
      urlParams.append("name", `like.${debouncedInputValue}`);
    }

    if (defaultFilter) {
      for (const [key, value] of Object.entries(defaultFilter)) {
        urlParams.append(key, value);
      }
    }

    const response = await apiFetch(`/projects?${urlParams.toString()}`);
    return response.json();
  });

  useEffect(() => {
    if (projects && value) {
      const matchedProject = projects.find((project) =>
        project.id === value.id ||
        project.name === value.name
      );
      if (matchedProject) {
        setActiveProject(matchedProject);
        setInputValue(matchedProject.name);
      }
    } else if (!value) {
      setActiveProject(null);
      setInputValue("");
    }
  }, [projects, value]);

  return (
    <Autocomplete
      value={activeProject}
      options={projects || []}
      getOptionLabel={(option) => option?.name ?? ""}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        onSelect(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Project"
          variant="outlined"
        />
      )}
    />
  );
};

export default ProjectAutocomplete;

