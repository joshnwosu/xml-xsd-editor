import React from 'react';

interface XmlViewerProps {
  xmlContent: string;
}

export const XmlViewer: React.FC<XmlViewerProps> = ({ xmlContent }) => {
  // Decode HTML entities if present
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const decodedContent = xmlContent
    ? decodeHtmlEntities(xmlContent)
    : 'No XML content loaded';

  return (
    <div className='p-8'>
      <pre className='whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded border overflow-x-auto'>
        {decodedContent}
      </pre>
    </div>
  );
};
