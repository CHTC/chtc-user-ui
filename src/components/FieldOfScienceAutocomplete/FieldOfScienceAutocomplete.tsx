import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { FieldsOfScience } from "@/types";
import { Link } from "@mui/material";

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
      staticOptions
      helperText={
        <>
          Uses the NSF{" "}
          <Link
            href="https://ncses.nsf.gov/pubs/nsf24300/assets/technical-notes/nsf24300-technical-notes.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            SED-CIP field of science codes
          </Link>
          .
        </>
      }
      required={required}
      disabled={disabled}
    />
  );
};

export default FieldOfScienceAutocomplete;
