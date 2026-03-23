import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/utils/useDebounce";
import { Autocomplete, TextField } from "@mui/material";
import { useState } from "react";
import useSWR from "swr";

export interface GenericAutocompleteProps<T extends { id: number }> {
  endpoint: string;
  /** Label for the autocomplete field */
  label: string;
  /** Currently selected value (partial match supported) */
  value?: Partial<T>;
  /** Callback when selection changes */
  onSelect: (item: T | null) => void;
  /** Additional filters to apply to API request */
  defaultFilter?: Record<string, string>;
  /** Function to extract display label from item */
  getOptionLabel: (option: T) => string;
  /** Field name to use for search filtering */
  searchField: string;
  /** Whether the field is required */
  required?: boolean;
}

/**
 * Generic autocomplete component that consolidates UserAutocomplete, ProjectAutocomplete, etc.
 * Handles debounced search, value matching, and SWR data fetching
 */
export function GenericAutocomplete<T extends { id: number }>({
  endpoint,
  label,
  value,
  onSelect,
  defaultFilter,
  getOptionLabel,
  searchField,
  required = false,
}: GenericAutocompleteProps<T>) {
  const [searchInput, setSearchInput] = useState("");
  const debouncedInput = useDebounce(searchInput, 300);

  const { data: items = [], isValidating } = useSWR(
    [endpoint, debouncedInput, JSON.stringify(defaultFilter)],
    async (): Promise<T[]> => {
      const params = new URLSearchParams({ page_size: "100" });
      if (debouncedInput) params.append(searchField, `ilike.${debouncedInput}`);
      if (defaultFilter) {
        for (const [k, v] of Object.entries(defaultFilter)) params.append(k, v);
      }
      const response = await apiFetch(`${endpoint}?${params}`);
      return response.json();
    },
    // Keep previous data so that loading new options doesn't clear the field or dropdown
    { keepPreviousData: true },
  );

  // Prefer a fully-fetched match but also fallback to the provided value for display if it doesn't match any fetched item
  const activeItem: T | null = value ? (items.find((item) => item.id === value.id) ?? (value as T)) : null;

  return (
    <Autocomplete
      value={activeItem}
      options={items}
      loading={isValidating}
      // Custom filtering to emulate ilike
      filterOptions={(options, state) =>
        options.filter((option) => getOptionLabel(option).toLowerCase().includes(state.inputValue.toLowerCase()))
      }
      getOptionKey={(option) => option.id}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      onInputChange={(_event, newValue, reason) => {
        if (reason === "input") setSearchInput(newValue);
        if (reason === "clear" || reason === "reset" || reason === "blur") setSearchInput("");
      }}
      onChange={(_event, newValue) => {
        onSelect(newValue);
      }}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" required={required} />}
    />
  );
}

export default GenericAutocomplete;
