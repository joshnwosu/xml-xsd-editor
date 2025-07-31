// hooks/use-validation.ts
import { useState, useCallback } from 'react';
import { XMLValidator, type ValidationResult } from '../utils/xml-validator';

export interface ValidationState {
  isValidating: boolean;
  lastValidation: ValidationResult | null;
  validationTimestamp: Date | null;
}

export const useValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    lastValidation: null,
    validationTimestamp: null,
  });

  const validateFiles = useCallback(
    async (xmlContent: string, xsdContent: string) => {
      if (!xmlContent.trim() || !xsdContent.trim()) {
        setValidationState({
          isValidating: false,
          lastValidation: {
            isValid: false,
            errors: ['Both XML and XSD files must be loaded before validation'],
            warnings: [],
          },
          validationTimestamp: new Date(),
        });
        return;
      }

      setValidationState((prev) => ({
        ...prev,
        isValidating: true,
      }));

      try {
        const result = await XMLValidator.validateXMLAgainstXSD(
          xmlContent,
          xsdContent
        );

        setValidationState({
          isValidating: false,
          lastValidation: result,
          validationTimestamp: new Date(),
        });
      } catch (error) {
        setValidationState({
          isValidating: false,
          lastValidation: {
            isValid: false,
            errors: [
              `Validation failed: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
            ],
            warnings: [],
          },
          validationTimestamp: new Date(),
        });
      }
    },
    []
  );

  const clearValidation = useCallback(() => {
    setValidationState({
      isValidating: false,
      lastValidation: null,
      validationTimestamp: null,
    });
  }, []);

  return {
    ...validationState,
    validateFiles,
    clearValidation,
  };
};
