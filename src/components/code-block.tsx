import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';

interface CodeBlockProps {
  decodedCode: string;
  code: string;
  language: string;
  theme: string;
  wrapText: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  decodedCode,
  code,
  language,
  theme,
  wrapText,
}) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current && decodedCode) {
      // Set the code content
      codeRef.current.textContent = decodedCode;

      // Apply PrismJS highlighting
      Prism.highlightElement(codeRef.current);
    }
  }, [decodedCode, language, theme]);

  return (
    <pre
      className={`custom-scrollbar overflow-auto h-full !text-sm !border-0 !m-0 !rounded-none ${
        wrapText ? 'code-wrap' : 'code-no-wrap'
      }`}
    >
      <code
        ref={codeRef}
        className={`language-xml ${wrapText ? 'code-wrap' : 'code-no-wrap'}`}
      >
        {/* Fallback content - will be replaced by useEffect */}
        {decodedCode || code}
      </code>
    </pre>
  );
};
