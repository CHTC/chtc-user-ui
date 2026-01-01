import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/hooks/useDebounce/useDebounce";
import { User } from "@/types";
import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

interface UserAutoCompleteProps {
  value: User[];
  dataUrl: string;
  onSelect: (user: User[]) => void;
  defaultFilter?: Record<string, string>;
}

const UserAutocompleteMultiple = ({ value, dataUrl, onSelect, defaultFilter }: UserAutoCompleteProps) => {
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

  const { data: users } = useSWR([`${dataUrl}?page_size=100`, debouncedInputValue], async (): Promise<User[]> => {
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

    const userResponse = await apiFetch(`${dataUrl}?${urlParams.toString()}`);
    return [...(await userResponse.json()), ...value];
  });

  return (
    <Autocomplete
      multiple
      value={value}
      options={users || []}
      getOptionLabel={(option) => option?.name || option?.username || option.email1}
      getOptionKey={(option) => option.id}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        if (newValue) {
          onSelect(newValue);
        }
      }}
      renderInput={(params) => <TextField {...params} label="Select User" variant="outlined" />}
    />
  );
};

export default UserAutocompleteMultiple;
