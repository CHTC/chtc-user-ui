import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/utils/useDebounce";
import { Autocomplete, TextField } from "@mui/material";
import { useState, useMemo } from "react";
import useSWR from "swr";

interface BaseProps {
  endpoint: string;
  label: string;
  defaultFilter?: Record<string, string>;
  searchFields: string[];
  required?: boolean;
  disabled?: boolean;
}

export type GenericAutocompleteProps<T extends { id: number }> =
  | (BaseProps & {
      multiple?: false;
      value?: Partial<T> | null;
      onSelect: (item: T | null) => void;
      getOptionLabel: (option: T) => string;
    })
  | (BaseProps & {
      multiple: true;
      value?: Partial<T>[] | null;
      onSelect: (item: T[]) => void;
      getOptionLabel: (option: T) => string;
    });

export function GenericAutocomplete<T extends { id: number }>(props: GenericAutocompleteProps<T>) {  
  const [searchInput, setSearchInput] = useState("");
  const debouncedInput = useDebounce(searchInput, 300);

  const { data, isValidating } = useSWR<T[]>(
    [props.endpoint, debouncedInput, JSON.stringify(props.defaultFilter)],
    async () => {
      const params = new URLSearchParams({ page_size: "100", ...props.defaultFilter });
      if (debouncedInput) {
        params.append("or", `(${props.searchFields.map((s) => `${s}.ilike.${debouncedInput}`).join(",")})`);
      }
      return (await apiFetch(`${props.endpoint}?${params}`)).json();
    },
    { keepPreviousData: true }
  );

  const items = useMemo(() => data ?? [], [data]);

  const activeValue = useMemo(() => {
    // We still keep `as T` here because the parent is passing `Partial<T>`, and MUI demands `T`.
    const match = (v: Partial<T>): T => (items.find((i) => i.id === v?.id) || v) as T;

    // TypeScript now natively knows props.value is an Array if props.multiple is true! No casts!
    if (props.multiple) {
      return props.value ? props.value.map(match) : [];
    } else {
      return props.value ? match(props.value) : null;
    }
  }, [props, items]);

  return (
    <Autocomplete
      multiple={props.multiple}
      disabled={props.disabled}
      value={activeValue}
      options={items}
      loading={isValidating}
      inputValue={props.multiple ? searchInput : undefined}
      filterOptions={(opts, state) =>
        opts.filter((opt) =>
          props.getOptionLabel(opt).toLowerCase().includes(state.inputValue.toLowerCase())
        )
      }
      getOptionKey={(opt) => opt.id}
      getOptionLabel={props.getOptionLabel}
      isOptionEqualToValue={(opt, val) => opt.id === val.id}
      onInputChange={(_, val, reason) => {
        if (reason === "input") setSearchInput(val);
        else if (["clear", "blur"].includes(reason) || (!props.multiple && reason === "reset")) {
          setSearchInput("");
        }
      }}
      onChange={(_, newValue) => {
        // By casting ONCE inside the wrapper, we protect all consumer components from casting.
        if (props.multiple) {
          setSearchInput("");
          props.onSelect(newValue as T[]);
        } else {
          props.onSelect(newValue as T | null);
        }
      }}
      renderInput={(params) => (
        <TextField {...params} label={props.label} variant="outlined" required={props.required} />
      )}
    />
  );
}

export default GenericAutocomplete;