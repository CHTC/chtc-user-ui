import { GenericAutocomplete } from "@/src/components/GenericAutocomplete/GenericAutocomplete";
import { User } from "@/types";

interface UserAutoCompleteProps {
  value?: Partial<User>;
  onSelect: (user: User | null) => void;
  defaultFilter?: Record<string, string>;
}

const UserAutocomplete = ({ value, onSelect, defaultFilter }: UserAutoCompleteProps) => {
  return (
    <GenericAutocomplete<User>
      endpoint="/users"
      label="Select User"
      value={value}
      onSelect={onSelect}
      defaultFilter={defaultFilter}
      getOptionLabel={(option) => option?.name || option?.username || option.email1}
      matchItem={(user, val) => user.id === val.id || user.username === val.username || user.email1 === val.email1}
      searchField="name"
    />
  );
};

export default UserAutocomplete;
