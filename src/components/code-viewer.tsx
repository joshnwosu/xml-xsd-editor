import React, { useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-xml-doc';
import 'prismjs/components/prism-markup-templating';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

// Make Prism globally available if needed
window.Prism = Prism;

import { useThemeColors } from '@/hooks/use-theme-color';
import { useSyntaxColors } from '@/hooks/use-snytax-colors';
import { useCodeDecoder } from '@/hooks/use-code-decoder';
import { DynamicStyles } from './dynamic-styles';
import { EmptyCodeDisplay } from './empty-code-display';
import { CodeBlock } from './code-block';
import type { CodeViewerProps } from '@/types/code-viewer';

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language,
  theme = 'white',
  wrapText = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const decodedCode = useCodeDecoder(code);
  const themeColors = useThemeColors(theme);
  const syntaxColors = useSyntaxColors(theme);

  // Handle empty code
  if (!code && !decodedCode) {
    return <EmptyCodeDisplay />;
  }

  return (
    <>
      <DynamicStyles
        theme={theme}
        themeColors={themeColors}
        syntaxColors={syntaxColors}
      />
      <div
        ref={containerRef}
        className={`code-viewer code-viewer-${theme} line-numbers !p-0 !pt-0 !m-0 h-full overflow-hidden !rounded-none`}
      >
        <CodeBlock
          decodedCode={decodedCode}
          code={code}
          language={language}
          theme={theme}
          wrapText={wrapText}
        />
      </div>
    </>
  );
};
