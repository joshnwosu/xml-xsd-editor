import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css'; // You can choose different themes
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup-templating';

import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

// Optional: Import additional themes
import 'prismjs/themes/prism-dark.css';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/themes/prism-okaidia.css';

interface CodeViewerProps {
  code: string;
  language: 'xml' | 'xsd';
  theme?: 'default' | 'dark' | 'tomorrow' | 'okaidia';
  wrapText?: boolean; // New prop for text wrapping
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  theme = 'default',
  wrapText = true, // Default to wrapping enabled
}) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // Decode HTML entities if present
      const decodedCode = decodeHtmlEntities(code);

      // Set the code content
      codeRef.current.textContent = decodedCode;

      // Apply PrismJS highlighting
      // Both XML and XSD use XML syntax highlighting
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  // Function to decode HTML entities
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  // Apply theme classes
  const getThemeClass = () => {
    switch (theme) {
      case 'dark':
        return 'prism-dark';
      case 'tomorrow':
        return 'prism-tomorrow';
      case 'okaidia':
        return 'prism-okaidia';
      default:
        return ''; // Default theme (white background)
    }
  };

  const customScrollbarStyles = `
    /* Custom scrollbar for webkit browsers */
    .custom-scrollbar::-webkit-scrollbar {
      width: 12px;
      height: 12px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: ${
        theme === 'dark' || theme === 'okaidia' ? '#2d3748' : '#f1f5f9'
      };
      border-radius: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: ${
        theme === 'dark' || theme === 'okaidia' ? '#4a5568' : '#cbd5e0'
      };
      border-radius: 6px;
      border: 2px solid ${
        theme === 'dark' || theme === 'okaidia' ? '#2d3748' : '#f1f5f9'
      };
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${
        theme === 'dark' || theme === 'okaidia' ? '#718096' : '#a0aec0'
      };
    }

    .custom-scrollbar::-webkit-scrollbar-corner {
      background: ${
        theme === 'dark' || theme === 'okaidia' ? '#2d3748' : '#f1f5f9'
      };
    }

    /* For Firefox */
    .custom-scrollbar {
      scrollbar-width: thin;
      scrollbar-color: ${
        theme === 'dark' || theme === 'okaidia'
          ? '#4a5568 #2d3748'
          : '#cbd5e0 #f1f5f9'
      };
    }

    /* Smooth scrolling */
    .custom-scrollbar {
      scroll-behavior: smooth;
    }

    /* Optional: Hide scrollbar but keep functionality */
    .hide-scrollbar {
      -ms-overflow-style: none;  /* Internet Explorer 10+ */
      scrollbar-width: none;  /* Firefox */
    }
    
    .hide-scrollbar::-webkit-scrollbar { 
      display: none;  /* Safari and Chrome */
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

    /* Adjust line number positioning for wrapped text */
    .line-numbers-rows {
      pointer-events: none;
      position: absolute;
      left: 0;
      font-size: 100%;
      width: 3em;
      letter-spacing: -1px;
      border-right: 1px solid #999;
      user-select: none;
      counter-reset: linenumber;
    }

    .line-numbers-rows > span {
      pointer-events: none;
      display: block;
      counter-increment: linenumber;
    }

    .line-numbers-rows > span:before {
      content: counter(linenumber);
      color: #999;
      display: block;
      padding-right: 0.8em;
      text-align: right;
    }
  `;

  return (
    <>
      <style>{customScrollbarStyles}</style>
      <div
        className={`code-viewer ${getThemeClass()} line-numbers !p-0 !pt-0 !m-0 h-full overflow-hidden !rounded-none`}
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
            }`} // Use 'xml' for both XML and XSD
          >
            {code}
          </code>
        </pre>
      </div>
    </>
  );
};
