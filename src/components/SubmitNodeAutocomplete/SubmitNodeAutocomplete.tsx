import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/utils/useDebounce";
import type { SubmitNode } from "@/types";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import useSWR from "swr";

interface SubmitNodeAutocompleteProps {
  value?: Partial<SubmitNode>;
  onSelect: (submitNode: SubmitNode | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
}

const SubmitNodeAutocomplete = ({ value, onSelect, defaultFilter, required }: SubmitNodeAutocompleteProps) => {
  const [activeSubmitNode, setActiveSubmitNode] = useState<SubmitNode | null>(null);
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

  const { data: submitNodes } = useSWR(
    ["/submit_nodes?page_size=100", debouncedInputValue],
    async (): Promise<SubmitNode[]> => {
      const urlParams = new URLSearchParams();
      urlParams.append("page_size", "100");

      if (debouncedInputValue) {
        urlParams.append("name", `like.${debouncedInputValue}`);
      }

      if (defaultFilter) {
        for (const [key, value] of Object.entries(defaultFilter)) {
          urlParams.append(key, value);
        }
      }

      const response = await apiFetch(`/submit_nodes?${urlParams.toString()}`);
      return response.json();
    },
  );

  useEffect(() => {
    if (value) {
      const matchedSubmitNode = submitNodes?.find(
        (submitNode) => submitNode.id === value.id || submitNode.name === value.name,
      );
      if (matchedSubmitNode) {
        setActiveSubmitNode(matchedSubmitNode);
        setInputValue(matchedSubmitNode.name);
      }
    } else if (value === null) {
      // Only clear when explicitly set to null (not undefined)
      setActiveSubmitNode(null);
      setInputValue("");
    }
  }, [submitNodes, value]);

  return (
    <Autocomplete
      value={activeSubmitNode}
      options={submitNodes || []}
      getOptionLabel={(option) => option?.name ?? ""}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_event, newValue) => {
        onSelect(newValue);
      }}
      renderInput={(params) => (
        <TextField {...params} label="Select Submit Node" variant="outlined" required={required} />
      )}
    />
  );
};

export default SubmitNodeAutocomplete;
