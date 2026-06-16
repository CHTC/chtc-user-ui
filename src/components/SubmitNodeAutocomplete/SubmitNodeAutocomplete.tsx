import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { Group } from "@/types";

interface SubmitNodeAutocompleteProps {
  value?: Partial<Group>;
  onSelect: (submitNode: Group | null) => void;
  required?: boolean;
  disabled?: boolean;
}

const SubmitNodeAutocomplete = ({ value, onSelect, required, disabled }: SubmitNodeAutocompleteProps) => {
  return (
    <GenericAutocomplete<Group>
      endpoint="/groups"
      label="Select Submit Node"
      value={value}
      onSelect={onSelect}
      defaultFilter={{
        "type": "eq.SUBMIT_NODE"
      }}
      getOptionLabel={(option) => option.name}
      searchField="name"
      required={required}
      disabled={disabled}
    />
  );
};

export default SubmitNodeAutocomplete;