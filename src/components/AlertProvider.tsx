'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';
export type AlertPreset = {
  message: (...args: never[]) => string;
  severity: AlertSeverity;
};

export const AlertMessages = {
  UPDATE_USER_SUCCESS: { message: () => `Successfully updated user`, severity: 'success' },
  UPDATE_PROJECT_SUCCESS: { message: () => `Successfully updated project`, severity: 'success' },
  UPDATE_NOTE_SUCCESS: { message: () => `Successfully updated note`, severity: 'success' },
  UPDATE_GROUP_SUCCESS: { message: () => `Successfully updated group`, severity: 'success' },

} satisfies Record<string, AlertPreset>;

export type AlertMessageKey = keyof typeof AlertMessages;

interface AlertState {
  open: boolean;
  message: string;
  severity: AlertSeverity;
}

type AlertAction =
  | { type: 'SHOW'; message: string; severity: AlertSeverity }
  | { type: 'HIDE' };

const initialState: AlertState = {
  open: false,
  message: '',
  severity: 'info',
};

function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case 'SHOW':
      return { open: true, message: action.message, severity: action.severity };
    case 'HIDE':
      return { ...state, open: false };
    default:
      return state;
  }
}

interface AlertContextValue {
  showAlert: <K extends AlertMessageKey>(key: K, ...params: Parameters<typeof AlertMessages[K]['message']>) => void;
  hide: () => void;
  state: AlertState;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(alertReducer, initialState);

  const showAlert = <K extends AlertMessageKey>(
    key: K,
    ...params: Parameters<typeof AlertMessages[K]['message']>
  ) => {
    const message = (AlertMessages[key].message as (...args: unknown[]) => string)(...params);
    dispatch({ type: 'SHOW', message, severity: AlertMessages[key].severity });
  };

  const hide = () => dispatch({ type: 'HIDE' });

  return (
    <AlertContext.Provider value={{ showAlert, hide, state }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error('useAlert must be used within an AlertProvider');
  return ctx;
}