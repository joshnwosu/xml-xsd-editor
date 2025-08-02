import React, { useRef, useEffect, useMemo } from 'react';
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

  // Memoize decoded code to avoid recalculating on every render
  const decodedCode = useMemo(() => {
    if (!code) return '';

    // Function to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      return textarea.value;
    };

    return decodeHtmlEntities(code);
  }, [code]);

  // Memoize theme colors to avoid recalculating
  const themeColors = useMemo(() => {
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
  }, [theme]);

  // Memoize syntax highlighting colors
  const syntaxColors = useMemo(() => {
    const getColor = (colors: string[]) =>
      colors[
        theme === 'white'
          ? 0
          : theme === 'light'
          ? 1
          : theme === 'dark'
          ? 2
          : theme === 'tomorrow'
          ? 3
          : 4
      ];

    return {
      comment: getColor([
        '#6a737d',
        '#708090',
        '#6a9955',
        '#969896',
        '#75715e',
      ]),
      punctuation: getColor([
        '#24292e',
        '#999',
        '#d4d4d4',
        '#cccccc',
        '#f8f8f2',
      ]),
      tag: getColor(['#22863a', '#905', '#569cd6', '#cc7832', '#f92672']),
      attrName: getColor(['#6f42c1', '#690', '#9cdcfe', '#de935f', '#a6e22e']),
      attrValue: getColor(['#032f62', '#07a', '#ce9178', '#b5bd68', '#e6db74']),
    };
  }, [theme]);

  // Memoize dynamic styles
  const dynamicStyles = useMemo(
    () => `
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
  `,
    [theme, themeColors, syntaxColors]
  );

  useEffect(() => {
    if (codeRef.current && decodedCode) {
      // Set the code content
      codeRef.current.textContent = decodedCode;

      // Apply PrismJS highlighting
      Prism.highlightElement(codeRef.current);
    }
  }, [decodedCode, language, theme]); // Include theme in dependencies

  // Handle empty code
  if (!code && !decodedCode) {
    return (
      <div className='flex items-center justify-center h-full bg-gray-50 text-gray-500'>
        <div className='text-center'>
          <div className='text-4xl mb-2'>📄</div>
          <p>No code to display</p>
        </div>
      </div>
    );
  }

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
            {/* Fallback content - will be replaced by useEffect */}
            {decodedCode || code}
          </code>
        </pre>
      </div>
    </>
  );
};
