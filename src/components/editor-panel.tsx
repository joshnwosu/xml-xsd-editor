// import React from 'react';
// import WysiwygEditor from './wysiwyg-editor';

// export const EditorPanel: React.FC = () => {
//   return (
//     <div className='h-full'>
//       <WysiwygEditor />
//     </div>
//   );
// };

// components/editor-panel.tsx (Updated)
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Code, Edit3 } from 'lucide-react';
import WysiwygEditor from '@/components/wysiwyg-editor';
import { XmlWysiwygEditor } from '@/components/xml-wysiwyg-editor';
import { useFileStore } from '@/store/file-store';

type EditorMode = 'document' | 'xml';

export const EditorPanel: React.FC = () => {
  const [editorMode, setEditorMode] = useState<EditorMode>('xml');
  const { xmlContent } = useFileStore();

  const modes = [
    {
      id: 'document' as EditorMode,
      label: 'Document Editor',
      icon: <FileText className='w-4 h-4' />,
      description: 'Rich text document editing',
    },
    {
      id: 'xml' as EditorMode,
      label: 'XML Editor',
      icon: <Code className='w-4 h-4' />,
      description: 'XML document WYSIWYG editing',
      disabled: !xmlContent.trim(),
    },
  ];

  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-white border rounded-lg'>
      {/* Editor Mode Selector */}
      <div className='flex items-center justify-between p-3 border-b bg-gray-50'>
        <div className='flex items-center space-x-1'>
          {modes.map((mode) => (
            <Button
              key={mode.id}
              variant={editorMode === mode.id ? 'default' : 'outline'}
              size='sm'
              onClick={() => setEditorMode(mode.id)}
              disabled={mode.disabled}
              className='flex items-center space-x-2'
              title={
                mode.disabled
                  ? 'Load an XML file to enable XML editing'
                  : mode.description
              }
            >
              {mode.icon}
              <span>{mode.label}</span>
            </Button>
          ))}
        </div>

        <div className='flex items-center space-x-2'>
          <Edit3 className='w-4 h-4 text-gray-400' />
          <span className='text-sm text-gray-600'>
            {editorMode === 'document'
              ? 'Rich Text Editor'
              : 'XML WYSIWYG Editor'}
          </span>
        </div>
      </div>

      {/* Editor Content */}
      <div className='flex-1 overflow-hidden'>
        {editorMode === 'document' ? <WysiwygEditor /> : <XmlWysiwygEditor />}
      </div>

      {/* Info Panel for XML Mode */}
      {editorMode === 'xml' && !xmlContent.trim() && (
        <div className='p-6 text-center bg-gray-50 border-t hidden'>
          <Code className='w-8 h-8 text-gray-400 mx-auto mb-2' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            XML Editor Ready
          </h3>
          <p className='text-sm text-gray-500 mb-2'>
            Load an XML file from the file manager to start editing in WYSIWYG
            mode
          </p>
          <div className='text-xs text-gray-400'>
            The XML editor provides a visual interface for editing XML structure
            and content
          </div>
        </div>
      )}
    </div>
  );
};
