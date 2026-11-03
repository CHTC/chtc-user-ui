"use client";

import { fetchList } from "@/src/utils/fetchList";
import type { BackingStore } from "@/types";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import useSWR from "swr";

interface BackingStoreSelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  required?: boolean;
  disabled?: boolean;
}

// Backing stores are a handful of rows, so one fetch fills a plain select instead of a searchable autocomplete
const BackingStoreSelect = ({ value, onChange, required, disabled }: BackingStoreSelectProps) => {
  const { data } = useSWR("/backing_stores?page_size=500", () => fetchList<BackingStore>("/backing_stores?page_size=500"));
  const stores = data?.rows ?? [];

  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel id="backing-store-label">Backing store</InputLabel>
      <Select
        labelId="backing-store-label"
        label="Backing store"
        // An id not in the list yet (still loading) would make MUI warn, so show empty until it arrives
        value={stores.some((store) => store.id === value) ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      >
        {stores.map((store) => (
          <MenuItem key={store.id} value={store.id}>
            {store.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default BackingStoreSelect;
