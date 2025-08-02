import React from 'react';

interface WysiwygEditorProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onInput: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onKeyUp: () => void;
}

export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  editorRef,
  onInput,
  onKeyDown,
  onMouseUp,
  onKeyUp,
}) => {
  return (
    <div
      ref={editorRef}
      className='focus:outline-none document-editor'
      contentEditable={true}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
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
