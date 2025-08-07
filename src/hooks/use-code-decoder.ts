import { useMemo } from 'react';

export const useCodeDecoder = (code: string): string => {
  return useMemo(() => {
    if (!code) return '';

    // Function to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    return decodeHtmlEntities(code);
  }, [code]);
};
