import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import type { Group, SubmitNode } from "@/types";

// interface SubmitNodeAutocompleteProps {
//   value?: Partial<SubmitNode>;
//   onSelect: (submitNode: SubmitNode | null) => void;
//   defaultFilter?: Record<string, string>;
//   required?: boolean;
//   disabled?: boolean;
// }

// const SubmitNodeAutocomplete = ({ value, onSelect, defaultFilter, required, disabled }: SubmitNodeAutocompleteProps) => {
//   return (
//     <GenericAutocomplete<SubmitNode>
//       endpoint="/submit_nodes"
//       label="Select Submit Node"
//       value={value}
//       onSelect={onSelect}
//       defaultFilter={defaultFilter}
//       getOptionLabel={(option) => option.name}
//       searchField="name"
//       required={required}
//       disabled={disabled}
//     />
//   );
// };

// export default SubmitNodeAutocomplete;

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