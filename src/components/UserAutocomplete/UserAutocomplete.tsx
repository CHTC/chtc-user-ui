import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import { User } from "@/types";

interface UserAutoCompleteProps {
  label?: string;
  value?: Partial<User>;
  onSelect: (user: User | null) => void;
  defaultFilter?: Record<string, string>;
  disabled?: boolean;
}

const UserAutocomplete = ({ label, value, onSelect, defaultFilter, disabled = false }: UserAutoCompleteProps) => {
  return (
    <GenericAutocomplete<User>
      endpoint="/users"
      label={label ?? "Select User"}
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => option?.name ? option.netid ? `${option.name} (${option.netid})` : option.name : option.email1}
      searchFields={["name", "netid"]}
      disabled={disabled}
    />
  );
};

export default UserAutocomplete;
