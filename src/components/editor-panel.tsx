// components/editor-panel.tsx (Updated)
import React from 'react';
import { XmlWysiwygEditor } from '@/components/xml-editor/xml-wysiwyg-editor';

export const EditorPanel: React.FC = () => {
  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-white'>
      <XmlWysiwygEditor />
    </div>
  );
};
