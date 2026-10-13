import { createContext, useContext } from 'react';

export type ValidationStatus = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | null;

export const ValidationContext = createContext<ValidationStatus>(null);

export function useValidation(): ValidationStatus {
  return useContext(ValidationContext);
}
