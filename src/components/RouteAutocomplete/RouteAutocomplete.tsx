import { apiFetch } from "@/src/components/AuthProvider";
import useDebounce from "@/src/utils/useDebounce";
import type { RouteGet } from "@/types";
import { Autocomplete, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import useSWR from "swr";

interface RouteAutocompleteProps {
  value?: Partial<RouteGet>;
  onSelect: (route: RouteGet | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
  label?: string;
}

/**
 * Autocomplete component for selecting API routes.
 * Routes are identified by the combination of method and route (no ID field).
 */
const RouteAutocomplete = ({
  value,
  onSelect,
  defaultFilter,
  required = false,
  label = "Select Route",
}: RouteAutocompleteProps) => {
  const [activeRoute, setActiveRoute] = useState<RouteGet | null>(null);
  const [inputValue, setInputValue] = useState("");
  const debouncedInputValue = useDebounce(inputValue, 300);

  const { data: routes } = useSWR([`/routes?page_size=100`, debouncedInputValue], async (): Promise<RouteGet[]> => {
    const urlParams = new URLSearchParams();
    urlParams.append("page_size", "100");

    if (debouncedInputValue) {
      // Search in both route and method fields
      urlParams.append("or", `(route.ilike.${debouncedInputValue},method.ilike.${debouncedInputValue})`);
    }

    if (defaultFilter) {
      for (const [key, filterValue] of Object.entries(defaultFilter)) {
        urlParams.append(key, filterValue);
      }
    }

    const response = await apiFetch(`/routes?${urlParams.toString()}`);
    return response.json();
  });

  useEffect(() => {
    if (value && value.method !== undefined && value.route !== undefined) {
      const matchedRoute = routes?.find((route) => route.method === value.method && route.route === value.route);
      if (matchedRoute) {
        setActiveRoute(matchedRoute);
        setInputValue(`${matchedRoute.method} ${matchedRoute.route}`);
      }
    } else if (value === null) {
      // Only clear when explicitly set to null (not undefined)
      setActiveRoute(null);
      setInputValue("");
    }
  }, [routes, value]);

  const getOptionLabel = (option: RouteGet) => `${option.method} ${option.route}`;

  const isOptionEqualToValue = (option: RouteGet, val: RouteGet) =>
    option.method === val.method && option.route === val.route;

  return (
    <Autocomplete
      size={"small"}
      value={activeRoute}
      options={routes || []}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_event, newValue) => {
        onSelect(newValue);
        setActiveRoute(null);
      }}
      renderInput={(params) => <TextField {...params} label={label} variant="outlined" required={required} />}
      sx={{
        minWidth: 300,
      }}
    />
  );
};

export default RouteAutocomplete;
