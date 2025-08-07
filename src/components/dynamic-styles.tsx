import React from 'react';
import type { ThemeColors, SyntaxColors } from '@/types/code-viewer';

interface DynamicStylesProps {
  theme: string;
  themeColors: ThemeColors;
  syntaxColors: SyntaxColors;
}

export const DynamicStyles: React.FC<DynamicStylesProps> = ({
  theme,
  themeColors,
  syntaxColors,
}) => {
  const styles = `
    .code-viewer-${theme} {
      background: ${themeColors.background} !important;
      color: ${themeColors.color} !important;
    }

    .code-viewer-${theme} pre {
      background: ${themeColors.background} !important;
      color: ${themeColors.color} !important;
    }

    .code-viewer-${theme} code {
      background: ${themeColors.background} !important;
      color: ${themeColors.color} !important;
    }

    /* Custom scrollbar for webkit browsers */
    .code-viewer-${theme} .custom-scrollbar::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }

    .code-viewer-${theme} .custom-scrollbar::-webkit-scrollbar-track {
      background: ${themeColors.scrollbarTrack};
      border-radius: 6px;
    }

    .code-viewer-${theme} .custom-scrollbar::-webkit-scrollbar-thumb {
      background: ${themeColors.scrollbarThumb};
      border-radius: 6px;
      border: 2px solid ${themeColors.scrollbarTrack};
    }

    .code-viewer-${theme} .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${themeColors.scrollbarThumbHover};
    }

    .code-viewer-${theme} .custom-scrollbar::-webkit-scrollbar-corner {
      background: ${themeColors.scrollbarTrack};
    }

    /* For Firefox */
    .code-viewer-${theme} .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: ${themeColors.scrollbarThumb} ${themeColors.scrollbarTrack};
    }

    /* Line numbers styling */
    .code-viewer-${theme} .line-numbers-rows {
      border-right: 1px solid ${themeColors.lineNumberBorder};
    }

    .code-viewer-${theme} .line-numbers-rows > span:before {
      color: ${themeColors.lineNumberColor} !important;
    }

    /* Syntax highlighting for each theme */
    .code-viewer-${theme} .token.comment,
    .code-viewer-${theme} .token.prolog,
    .code-viewer-${theme} .token.doctype,
    .code-viewer-${theme} .token.cdata {
      color: ${syntaxColors.comment} !important;
    }

    .code-viewer-${theme} .token.punctuation {
      color: ${syntaxColors.punctuation} !important;
    }

    .code-viewer-${theme} .token.tag {
      color: ${syntaxColors.tag} !important;
    }

    .code-viewer-${theme} .token.attr-name {
      color: ${syntaxColors.attrName} !important;
    }

    .code-viewer-${theme} .token.attr-value,
    .code-viewer-${theme} .token.string {
      color: ${syntaxColors.attrValue} !important;
    }

    /* Text wrapping styles */
    .code-wrap {
      white-space: pre-wrap !important;
      word-wrap: break-word !important;
      word-break: break-all !important;
      overflow-wrap: break-word !important;
    }

    .code-no-wrap {
      white-space: pre !important;
      word-wrap: normal !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
    }

    /* Ensure line numbers still work with wrapping */
    .line-numbers .code-wrap {
      padding-left: 3.8em !important;
    }
  `;

  return <style>{styles}</style>;
};
