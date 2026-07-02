'use client';

import { Alert, Snackbar, SnackbarCloseReason } from '@mui/material';
import { useAlert } from './AlertProvider';

export function SnackbarAlert() {
  const { state, hide } = useAlert();

  const handleClose = (_event: unknown, reason?: SnackbarCloseReason) => {
    if (reason === 'clickaway') return;
    hide();
  };

  return (
    <Snackbar
      open={state.open}
      autoHideDuration={3000}
      onClose={handleClose}
    >
      <Alert
        onClose={hide}
        severity={state.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {state.message}
      </Alert>
    </Snackbar>
  );
}