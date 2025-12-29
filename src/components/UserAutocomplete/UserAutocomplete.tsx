import { Suspense, useEffect, useState } from "react";
import useSWR from "swr";
import useDebounce from "@/src/hooks/useDebounce/useDebounce";
import { Autocomplete, Skeleton, TextField } from "@mui/material";
import { apiFetch } from "@/src/components/AuthProvider";
import { User } from "@/types";

interface UserAutoCompleteProps {
  value?: Partial<User>;
  onSelect: (user: User | null) => void;
  defaultFilter?: Record<string, string>;
}

const UserAutocomplete = ({ value, onSelect, defaultFilter }: UserAutoCompleteProps) => {
  console.log(value);

  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

  const { data: users } = useSWR([`/users?page_size=100`, debouncedInputValue], async (): Promise<User[]> => {
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

    const userResponse = await apiFetch(`/users?${urlParams.toString()}`);
    return userResponse.json();
  });

  useEffect(() => {
    // Sort through all the users and find the one that matches the value prop by id, username, or email1
    if (users && value) {
      const matchedUser = users.find(
        (user) => user.id === value.id || user.username === value.username || user.email1 === value.email1,
      );
      if (matchedUser) {
        setActiveUser(matchedUser);
        setInputValue(matchedUser.name || matchedUser.username || matchedUser.email1);
      }
    } else {
      setActiveUser(null);
      setInputValue("");
    }
  }, [users, value]);

  return (
    <Autocomplete
      value={activeUser}
      options={users || []}
      getOptionLabel={(option) => option?.name || option?.username || option.email1}
      getOptionKey={(option) => option.id}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, newValue) => {
        onSelect(newValue);
      }}
      renderInput={(params) => <TextField {...params} label="Select User" variant="outlined" />}
    />
  );
};

export default UserAutocomplete;
