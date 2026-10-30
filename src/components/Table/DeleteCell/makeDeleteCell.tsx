import { useAlert } from '@/src/components/AlertProvider';
import { CellComponentProps, TableData } from '@/src/components/Table/types';
import DeleteCell from '@/src/components/Table/DeleteCell/DeleteCell';
import ConfirmButton from '@chtc/web-components/ConfirmButton';

interface MakeDeleteCellProps<R extends TableData> {
  mutate: () => void;
  handleDelete: (row: R) => Promise<void>;
  confirmButtonProps?: Partial<
    Omit<React.ComponentProps<typeof ConfirmButton>, 'onConfirm'>
  >;
}

function makeDeleteCell<R extends TableData>({
  mutate,
  handleDelete,
  confirmButtonProps,
}: MakeDeleteCellProps<R>) {
  const DynamicDeleteCell = ({ row }: CellComponentProps<R, keyof R>) => {
    const { showAlert } = useAlert();

    const cellHandleDelete = async () => {
      try {
        await handleDelete(row);
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
      <DeleteCell
        handleDelete={cellHandleDelete}
        confirmButtonProps={confirmButtonProps}
      />
    );
  };

  DynamicDeleteCell.displayName = 'DeleteCell';

  return DynamicDeleteCell;
}

export default makeDeleteCell;
