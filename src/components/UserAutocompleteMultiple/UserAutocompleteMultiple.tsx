import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import { User } from "@/types";

interface UserAutoCompleteProps {
  value: User[];
  dataUrl: string;
  onSelect: (user: User[]) => void;
  defaultFilter?: Record<string, string>;
  disabled?: boolean;
}

const UserAutocompleteMultiple = ({ 
  value, 
  dataUrl, 
  onSelect, 
  defaultFilter, 
  disabled = false 
}: UserAutoCompleteProps) => {
  return (
    <GenericAutocomplete<User>
      multiple
      endpoint={dataUrl}
      label="Select Users"
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => 
        option?.name ? option.netid ? `${option.name} (${option.netid})` : option.name : option.email1 || ""
      }
      searchFields={["name", "netid"]}
      disabled={disabled}
    />
  );
};

export default UserAutocompleteMultiple;