import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { Group } from "@/types";

interface GroupAutocompleteProps {
  label?: string;
  value?: Partial<Group>;
  onSelect: (group: Group | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
}

const GroupAutocomplete = ({ label, value, onSelect, defaultFilter, required, disabled }: GroupAutocompleteProps) => {
  return (
    <GenericAutocomplete<Group>
      endpoint="/groups"
      label={label ?? "Select Group"}
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => option?.name ?? ""}
      searchFields={["name"]}
      required={required}
      disabled={disabled}
    />
  );
};

export default GroupAutocomplete;
