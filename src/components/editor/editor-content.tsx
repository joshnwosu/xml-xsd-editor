import React from 'react';

interface EditorContentProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onInput: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onKeyUp: () => void;
}

export const EditorContent: React.FC<EditorContentProps> = ({
  editorRef,
  onInput,
  onKeyDown,
  onMouseUp,
  onKeyUp,
}) => (
  <div
    ref={editorRef}
    contentEditable
    suppressContentEditableWarning
    className='flex-1 p-4 outline-none overflow-auto min-h-96 bg-white'
    style={{
      lineHeight: '1.5',
      fontSize: '14px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}
    onInput={onInput}
    onKeyDown={onKeyDown}
    onMouseUp={onMouseUp}
    onKeyUp={onKeyUp}
  />
);
