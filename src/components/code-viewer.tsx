import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';
// Import only the base CSS - we'll handle themes dynamically
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

interface CodeViewerProps {
  code: string;
  language: 'xml' | 'xsd';
  theme?: 'white' | 'light' | 'dark' | 'tomorrow' | 'okaidia';
  wrapText?: boolean;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  theme = 'white',
  wrapText = false,
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // Decode HTML entities if present
      const decodedCode = decodeHtmlEntities(code);

      // Set the code content
      codeRef.current.textContent = decodedCode;

      // Apply PrismJS highlighting
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Get theme-specific colors
  const getThemeColors = () => {
    switch (theme) {
      case 'white':
        return {
          background: '#ffffff',
          color: '#24292e',
          scrollbarTrack: '#f6f8fa',
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
  };

  const themeColors = getThemeColors();

  const dynamicStyles = `
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
      scrollbar-color: ${themeColors.scrollbarThumb} ${
    themeColors.scrollbarTrack
  };
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
      color: ${
        theme === 'white'
          ? '#6a737d'
          : theme === 'light'
          ? '#708090'
          : theme === 'dark'
          ? '#6a9955'
          : theme === 'tomorrow'
          ? '#969896'
          : '#75715e'
      } !important;
    }

    .code-viewer-${theme} .token.punctuation {
      color: ${
        theme === 'white'
          ? '#24292e'
          : theme === 'light'
          ? '#999'
          : theme === 'dark'
          ? '#d4d4d4'
          : theme === 'tomorrow'
          ? '#cccccc'
          : '#f8f8f2'
      } !important;
    }

    .code-viewer-${theme} .token.tag {
      color: ${
        theme === 'white'
          ? '#22863a'
          : theme === 'light'
          ? '#905'
          : theme === 'dark'
          ? '#569cd6'
          : theme === 'tomorrow'
          ? '#cc7832'
          : '#f92672'
      } !important;
    }

    .code-viewer-${theme} .token.attr-name {
      color: ${
        theme === 'white'
          ? '#6f42c1'
          : theme === 'light'
          ? '#690'
          : theme === 'dark'
          ? '#9cdcfe'
          : theme === 'tomorrow'
          ? '#de935f'
          : '#a6e22e'
      } !important;
    }

    .code-viewer-${theme} .token.attr-value,
    .code-viewer-${theme} .token.string {
      color: ${
        theme === 'white'
          ? '#032f62'
          : theme === 'light'
          ? '#07a'
          : theme === 'dark'
          ? '#ce9178'
          : theme === 'tomorrow'
          ? '#b5bd68'
          : '#e6db74'
      } !important;
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

  return (
    <>
      <style>{dynamicStyles}</style>
      <div
        ref={containerRef}
        className={`code-viewer code-viewer-${theme} line-numbers !p-0 !pt-0 !m-0 h-full overflow-hidden !rounded-none`}
      >
        <pre
          className={`custom-scrollbar overflow-auto h-full !text-sm !border-0 !m-0 !rounded-none ${
            wrapText ? 'code-wrap' : 'code-no-wrap'
          }`}
        >
          <code
            ref={codeRef}
            className={`language-xml ${
              wrapText ? 'code-wrap' : 'code-no-wrap'
            }`}
          >
            {code}
          </code>
        </pre>
      </div>
    </>
  );
};
