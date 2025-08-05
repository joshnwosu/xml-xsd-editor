import { useMemo } from 'react';
import type { ThemeColors } from '@/types/code-viewer';

export const useThemeColors = (theme: string): ThemeColors => {
  return useMemo(() => {
    switch (theme) {
      case 'white':
        return {
          background: '#ffffff',
          color: '#24292e',
          scrollbarTrack: '#ffffff',
          scrollbarThumb: '#d1d5da',
          scrollbarThumbHover: '#959da5',
          lineNumberBorder: '#e1e4e8',
          lineNumberColor: '#6a737d',
        };
      case 'light':
        return {
          background: '#f5f2f0',
          color: '#333',
          scrollbarTrack: '#f1f5f9',
          scrollbarThumb: '#cbd5e0',
          scrollbarThumbHover: '#a0aec0',
          lineNumberBorder: '#e5e7eb',
          lineNumberColor: '#6b7280',
        };
      case 'dark':
        return {
          background: '#1e1e1e',
          color: '#d4d4d4',
          scrollbarTrack: '#2d3748',
          scrollbarThumb: '#4a5568',
          scrollbarThumbHover: '#718096',
          lineNumberBorder: '#555',
          lineNumberColor: '#999',
        };
      case 'tomorrow':
        return {
          background: '#2d2d2d',
          color: '#cccccc',
          scrollbarTrack: '#3c3c3c',
          scrollbarThumb: '#555555',
          scrollbarThumbHover: '#777777',
          lineNumberBorder: '#666',
          lineNumberColor: '#999',
        };
      case 'okaidia':
        return {
          background: '#272822',
          color: '#f8f8f2',
          scrollbarTrack: '#3e3d32',
          scrollbarThumb: '#75715e',
          scrollbarThumbHover: '#8a8a8a',
          lineNumberBorder: '#75715e',
          lineNumberColor: '#75715e',
        };
      default:
        return {
          background: '#ffffff',
          color: '#24292e',
          scrollbarTrack: '#f6f8fa',
          scrollbarThumb: '#d1d5da',
          scrollbarThumbHover: '#959da5',
          lineNumberBorder: '#e1e4e8',
          lineNumberColor: '#6a737d',
        };
    }
  }, [theme]);
};
