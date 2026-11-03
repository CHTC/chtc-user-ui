import { useAlert } from '@/src/components/AlertProvider';
import { apiFetch } from '@/src/components/AuthProvider';
import DeleteCell from '@/src/components/Table/DeleteCell/DeleteCell';
import { apiErrorMessage } from '@/src/utils/formErrors';
import {
  ConfirmButton,
  type CellComponentProps,
  type TableData,
} from '@chtc/web-components';

interface MakeDeleteCellProps<R extends TableData> {
  mutate: () => void;
  deleteUrl: (row: R) => string;
  confirmButtonProps?: Partial<
    Omit<React.ComponentProps<typeof ConfirmButton>, 'onConfirm'>
  >;
}

async function apiDelete(endpoint: string): Promise<void> {
  const response = await apiFetch(endpoint, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error(await apiErrorMessage(response, 'Delete failed'));
  }
}

function makeDeleteCell<R extends TableData>({
  mutate,
  deleteUrl,
  confirmButtonProps,
}: MakeDeleteCellProps<R>) {
  const DynamicDeleteCell = ({ row }: CellComponentProps<R, keyof R>) => {
    const { showAlert } = useAlert();
    const url = deleteUrl(row);

    const cellHandleDelete = async () => {
      try {
        await apiDelete(url);
        mutate();
      } catch (error) {
        console.error(error);
        showAlert(
          'ACTION_ERROR',
          `Error Deleting Item: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    };

    return (
      // Table keys rows by index, so after a delete the next row would inherit this row's open
      // Confirm button; keying on the URL resets it per row
      <DeleteCell
        key={url}
        handleDelete={cellHandleDelete}
        confirmButtonProps={confirmButtonProps}
      />
    );
  };

  DynamicDeleteCell.displayName = 'DeleteCell';

  return DynamicDeleteCell;
}

export default makeDeleteCell;
