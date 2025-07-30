import React, { useRef, useEffect } from 'react';

interface CodeViewerProps {
  code: string;
  language: 'xml' | 'xsd';
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, language }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Simple syntax highlighting for XML/XSD
    if (codeRef.current) {
      let highlightedCode = code;

      // Basic XML/XSD syntax highlighting
      highlightedCode = highlightedCode
        .replace(/(&lt;[^&]*&gt;)/g, '<span style="color: #0066cc;">$1</span>')
        .replace(
          /(&quot;[^&]*&quot;)/g,
          '<span style="color: #008800;">$1</span>'
        )
        .replace(/(=)/g, '<span style="color: #666666;">$1</span>');

      codeRef.current.innerHTML = highlightedCode;
    }
  }, [code]);

  return (
    <pre className='bg-gray-50 p-4 rounded-md overflow-auto max-h-96 text-sm'>
      <code ref={codeRef} className={`language-${language}`}>
        {code}
      </code>
    </pre>
  );
};
