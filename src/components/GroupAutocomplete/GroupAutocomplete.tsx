import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { Group } from "@/types";

interface GroupAutocompleteProps {
  value?: Partial<Group>;
  onSelect: (group: Group | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
}

const GroupAutocomplete = ({ value, onSelect, defaultFilter, required, disabled }: GroupAutocompleteProps) => {
  return (
    <GenericAutocomplete<Group>
      endpoint="/groups"
      label="Select Group"
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => option?.name ?? ""}
      searchField="name"
      required={required}
      disabled={disabled}
    />
  );
};

export default GroupAutocomplete;
