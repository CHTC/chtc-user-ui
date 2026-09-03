import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/utils/useDebounce";
import { Autocomplete, TextField } from "@mui/material";
import { type ReactNode, useState, useMemo } from "react";
import useSWR from "swr";

// MUI renders every filtered option into the DOM, so the static reference tables
// (~1650 rows) get a cap on what is rendered. Filtering still runs across all of
// them, so nothing becomes unreachable — only the visible slice is bounded.
const MAX_RENDERED_STATIC_OPTIONS = 100;

interface BaseProps {
  endpoint: string;
  label: string;
  defaultFilter?: Record<string, string>;
  /**
   * Columns to search server-side, as `or=(field.ilike.<input>)`. Unused when
   * `staticOptions` is set, since those lists are filtered in the browser.
   */
  searchFields?: string[];
  /**
   * Set for small reference tables that are seeded by migration and do not change
   * while the page is open. Fetches the whole table once — the API's default
   * page_size is sized to cover it — and filters client-side, instead of querying
   * per keystroke. Also avoids interpolating user input into the `or=` filter,
   * which the API splits on commas.
   */
  staticOptions?: boolean;
  helperText?: ReactNode;
  required?: boolean;
  disabled?: boolean;
}

/**
 * `getOptionId` is optional for option types that carry an `id`, and required for
 * those that do not (e.g. FieldsOfScience, keyed by `fos_id`). Without this, the
 * default accessor would silently return `undefined` for every option, making all
 * options compare equal and duplicating React keys.
 */
type OptionIdProps<T> = T extends { id: string | number }
  ? { getOptionId?: (option: T) => string | number }
  : { getOptionId: (option: T) => string | number };

export type GenericAutocompleteProps<T> =
  | (BaseProps &
      OptionIdProps<T> & {
        multiple?: false;
        value?: Partial<T> | null;
        onSelect: (item: T | null) => void;
        getOptionLabel: (option: T) => string;
      })
  | (BaseProps &
      OptionIdProps<T> & {
        multiple: true;
        value?: Partial<T>[] | null;
        onSelect: (item: T[]) => void;
        getOptionLabel: (option: T) => string;
      });

export function GenericAutocomplete<T>(props: GenericAutocompleteProps<T>) {
  // Cast once here so consumers never have to: `getOptionId` sits behind a
  // conditional type, which TypeScript cannot narrow while `T` is still generic.
  const { getOptionId: getOptionIdProp } = props as { getOptionId?: (option: T) => string | number };
  const getOptionId = getOptionIdProp ?? ((option: T) => (option as unknown as { id: number | string }).id);

  const [searchInput, setSearchInput] = useState("");
  const debouncedInput = useDebounce(searchInput, 300);

  // Static lists are fetched whole and filtered in the browser, so the search text
  // is deliberately not part of the cache key.
  const searchKey = props.staticOptions ? "" : debouncedInput;

  const { data, isValidating } = useSWR<T[]>(
    [props.endpoint, searchKey, JSON.stringify(props.defaultFilter)],
    async () => {
      const params = new URLSearchParams({ ...props.defaultFilter });

      if (!props.staticOptions) {
        params.set("page_size", "100");
        if (debouncedInput && props.searchFields?.length) {
          params.append("or", `(${props.searchFields.map((s) => `${s}.ilike.${debouncedInput}`).join(",")})`);
        }
      }

      const query = params.toString();
      const response = await apiFetch(query ? `${props.endpoint}?${query}` : props.endpoint);

      if (!response.ok) {
        throw new Error(`Failed to load ${props.endpoint}: ${response.status} ${response.statusText}`);
      }

      // A non-array body (e.g. an error payload) would otherwise reach MUI's
      // `options` and blow up in `filterOptions`.
      const body = await response.json();
      return Array.isArray(body) ? body : [];
    },
    {
      keepPreviousData: true,
      // Reference tables do not change while the page is open, so don't refetch
      // the whole list on every remount or window focus.
      ...(props.staticOptions && { revalidateOnFocus: false, revalidateIfStale: false }),
    },
  );

  const items = useMemo(() => data ?? [], [data]);

  const activeValue = useMemo(() => {
    // We still keep `as T` here because the parent is passing `Partial<T>`, and MUI demands `T`.
    const match = (v: Partial<T>): T => (items.find((i) => getOptionId(i) === getOptionId(v as T)) || v) as T;

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
      filterOptions={(opts, state) => {
        const query = state.inputValue.toLowerCase();
        const matches = opts.filter((opt) => props.getOptionLabel(opt).toLowerCase().includes(query));
        return props.staticOptions ? matches.slice(0, MAX_RENDERED_STATIC_OPTIONS) : matches;
      }}
      getOptionKey={(opt) => getOptionId(opt)}
      getOptionLabel={props.getOptionLabel}
      isOptionEqualToValue={(opt, val) => getOptionId(opt) === getOptionId(val)}
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
        <TextField
          {...params}
          label={props.label}
          variant="outlined"
          required={props.required}
          helperText={props.helperText}
        />
      )}
    />
  );
}

export default GenericAutocomplete;
