import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/utils/useDebounce";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
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
  /** Function to match value prop with fetched items */
  matchItem?: (item: T, value: Partial<T>) => boolean;
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
  matchItem,
  searchField,
  required = false,
}: GenericAutocompleteProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

  const { data: items } = useSWR([`${endpoint}?page_size=100`, debouncedInputValue], async (): Promise<T[]> => {
    const urlParams = new URLSearchParams();
    urlParams.append("page_size", "100");

    if (debouncedInputValue) {
      urlParams.append(searchField, `ilike.${debouncedInputValue}`);
    }

    if (defaultFilter) {
      for (const [key, filterValue] of Object.entries(defaultFilter)) {
        urlParams.append(key, filterValue);
      }
    }

    const response = await apiFetch(`${endpoint}?${urlParams.toString()}`);
    return response.json();
  });

  useEffect(() => {
    if (value) {
      const defaultMatcher = (item: T, val: Partial<T>) => item.id === val.id;
      const matcher = matchItem || defaultMatcher;

      const matchedItem = items?.find((item) => matcher(item, value));
      if (matchedItem) {
        setActiveItem(matchedItem);
        setInputValue(getOptionLabel(matchedItem));
      }
    } else if (value === null) {
      // Only clear when explicitly set to null (not undefined)
      setActiveItem(null);
      setInputValue("");
    }
  }, [items, value, matchItem, getOptionLabel]);

  return (
    <Autocomplete
      value={activeItem}
      options={items || []}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_event, newValue) => {
        onSelect(newValue);
      }}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" required={required} />}
    />
  );
}

export default GenericAutocomplete;
