import React from 'react';

interface WysiwygEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onInput: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onKeyUp: () => void;
  isEditable: boolean;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  editorRef,
  onInput,
  onKeyDown,
  onMouseUp,
  onKeyUp,
  isEditable,
}) => {
  return (
    <div
      ref={editorRef}
      className='focus:outline-none document-editor'
      // Remove contentEditable completely - we'll handle editing through form inputs
      onInput={isEditable ? onInput : undefined}
      onKeyDown={isEditable ? onKeyDown : undefined}
      onMouseUp={isEditable ? onMouseUp : undefined}
      onKeyUp={isEditable ? onKeyUp : undefined}
      data-editable={isEditable}
      style={{
        padding: '4rem 3rem',
        fontFamily: 'inherit',
        fontSize: '16px',
        lineHeight: '1.6',
        backgroundColor: 'white',
        color: '#333',
      }}
    />
  );
};
