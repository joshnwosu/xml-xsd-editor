import React from 'react';
import WysiwygEditor from './wysiwyg-editor';
// import { WysiwygEditor } from './wysiwyg-editor';

export const EditorPanel: React.FC = () => {
  return (
    <div className='h-full'>
      <WysiwygEditor />
    </div>
  );
};
