import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { FieldsOfScience } from "@/types";

interface FieldOfScienceAutocompleteProps {
  value?: Partial<FieldsOfScience>;
  onSelect: (fieldOfScience: FieldsOfScience | null) => void;
  defaultFilter?: Record<string, string>;
  required?: boolean;
  disabled?: boolean;
}

const FieldOfScienceAutocomplete = ({
  value,
  onSelect,
  defaultFilter,
  required,
  disabled,
}: FieldOfScienceAutocompleteProps) => {
  return (
    <GenericAutocomplete<FieldsOfScience>
      endpoint="/fields_of_science"
      label="Field of Science"
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      // fields_of_science is keyed by the string fos_id
      getOptionId={(option) => option.fos_id}
      getOptionLabel={(option) => (option.sed_cip_title ? `${option.fos_id}: ${option.sed_cip_title}` : option.fos_id)}
      searchFields={["fos_id", "sed_cip_title"]}
      required={required}
      disabled={disabled}
    />
  );
};

export default FieldOfScienceAutocomplete;
