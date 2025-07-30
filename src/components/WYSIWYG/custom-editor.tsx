import React, { useRef, useEffect, useState } from 'react';

interface WYSIWYGEditorProps {
  editableContent: string;
  showWysiwygEditor: boolean;
  onChange?: (value: string) => void;
  defaultFontFamily?: string;
}

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  editableContent,
  showWysiwygEditor,
  onChange,
  defaultFontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const executeCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      if (onChange) onChange(editorRef.current.innerHTML);
    }
  };

  // Custom font family command handler
  const setFontFamily = (fontFamily: string) => {
    if (!fontFamily || !editorRef.current) return;

    editorRef.current.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);

      if (!range.collapsed) {
        // Text is selected - wrap it in a span with font-family
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;

        try {
          // Try to surround the selection
          range.surroundContents(span);
        } catch (e) {
          // If that fails (e.g., selection spans multiple elements), extract and wrap
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }

        // Clear selection and position cursor after the span
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        selection.addRange(newRange);
      } else {
        // No text selected - set font for future typing
        // Create a temporary span to hold the font style
        const span = document.createElement('span');
        span.style.fontFamily = fontFamily;
        span.innerHTML = '&nbsp;'; // Non-breaking space as placeholder

        range.insertNode(span);

        // Position cursor inside the span
        const newRange = document.createRange();
        newRange.setStart(span.firstChild!, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }

    if (onChange) onChange(editorRef.current.innerHTML);
  };

  const handleEditorInput = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Initialize content only once when editor becomes visible
  useEffect(() => {
    if (editorRef.current && showWysiwygEditor && !isInitialized) {
      editorRef.current.innerHTML = editableContent || '';
      setIsInitialized(true);
      if (onChange) onChange(editableContent);
    }

    // Reset initialization when editor is hidden
    if (!showWysiwygEditor) {
      setIsInitialized(false);
    }
  }, [showWysiwygEditor, editableContent, onChange, isInitialized]);

  // Handle paste events to maintain formatting
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleEditorInput();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle common shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          executeCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          executeCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            executeCommand('redo');
          } else {
            e.preventDefault();
            executeCommand('undo');
          }
          break;
      }
    }
  };

  return (
    <div className='wysiwyg-editor border rounded-lg overflow-hidden'>
      {/* Toolbar */}
      <div className='bg-gray-100 border-b p-2 flex flex-wrap gap-1'>
        <button
          type='button'
          onClick={() => executeCommand('bold')}
          className='p-2 hover:bg-gray-200 rounded border text-sm font-bold'
          title='Bold (Ctrl+B)'
        >
          B
        </button>
        <button
          type='button'
          onClick={() => executeCommand('italic')}
          className='p-2 hover:bg-gray-200 rounded border text-sm italic'
          title='Italic (Ctrl+I)'
        >
          I
        </button>
        <button
          type='button'
          onClick={() => executeCommand('underline')}
          className='p-2 hover:bg-gray-200 rounded border text-sm underline'
          title='Underline (Ctrl+U)'
        >
          U
        </button>

        <div className='w-px h-8 bg-gray-300 mx-1'></div>

        <button
          type='button'
          onClick={() => executeCommand('justifyLeft')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Align Left'
        >
          ←
        </button>
        <button
          type='button'
          onClick={() => executeCommand('justifyCenter')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Center'
        >
          ↔
        </button>
        <button
          type='button'
          onClick={() => executeCommand('justifyRight')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Align Right'
        >
          →
        </button>

        <div className='w-px h-8 bg-gray-300 mx-1'></div>

        {/* Font Family Dropdown */}
        <select
          onChange={(e) => {
            setFontFamily(e.target.value);
            e.target.value = ''; // Reset dropdown after selection
          }}
          className='p-1 border rounded text-sm'
          defaultValue=''
          title='Font Family'
        >
          <option value=''>Font Family</option>
          <option value='system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'>
            System Default
          </option>
          <option value='Arial, sans-serif'>Arial</option>
          <option value='"Times New Roman", serif'>Times New Roman</option>
          <option value='Helvetica, sans-serif'>Helvetica</option>
          <option value='Georgia, serif'>Georgia</option>
          <option value='Verdana, sans-serif'>Verdana</option>
          <option value='"Courier New", monospace'>Courier New</option>
          <option value='Impact, sans-serif'>Impact</option>
          <option value='"Comic Sans MS", cursive'>Comic Sans MS</option>
          <option value='"Trebuchet MS", sans-serif'>Trebuchet MS</option>
          <option value='Palatino, serif'>Palatino</option>
          <option value='Garamond, serif'>Garamond</option>
          <option value='Bookman, serif'>Bookman</option>
        </select>

        <select
          onChange={(e) => executeCommand('formatBlock', e.target.value)}
          className='p-1 border rounded text-sm'
          defaultValue=''
        >
          <option value=''>Format</option>
          <option value='h1'>Heading 1</option>
          <option value='h2'>Heading 2</option>
          <option value='h3'>Heading 3</option>
          <option value='p'>Paragraph</option>
        </select>

        <select
          onChange={(e) => executeCommand('fontSize', e.target.value)}
          className='p-1 border rounded text-sm'
          defaultValue='3'
        >
          <option value='1'>8pt</option>
          <option value='2'>10pt</option>
          <option value='3'>12pt</option>
          <option value='4'>14pt</option>
          <option value='5'>18pt</option>
          <option value='6'>24pt</option>
          <option value='7'>36pt</option>
        </select>

        <input
          type='color'
          onChange={(e) => executeCommand('foreColor', e.target.value)}
          className='w-8 h-8 border rounded cursor-pointer'
          title='Text Color'
        />

        <div className='w-px h-8 bg-gray-300 mx-1'></div>

        <button
          type='button'
          onClick={() => executeCommand('insertUnorderedList')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Bullet List'
        >
          •
        </button>
        <button
          type='button'
          onClick={() => executeCommand('insertOrderedList')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Numbered List'
        >
          1.
        </button>

        <button
          type='button'
          onClick={() => executeCommand('indent')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Indent'
        >
          →|
        </button>
        <button
          type='button'
          onClick={() => executeCommand('outdent')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Outdent'
        >
          |←
        </button>

        <div className='w-px h-8 bg-gray-300 mx-1'></div>

        <button
          type='button'
          onClick={() => executeCommand('undo')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Undo (Ctrl+Z)'
        >
          ↶
        </button>
        <button
          type='button'
          onClick={() => executeCommand('redo')}
          className='p-2 hover:bg-gray-200 rounded border text-sm'
          title='Redo (Ctrl+Shift+Z)'
        >
          ↷
        </button>

        <div className='w-px h-8 bg-gray-300 mx-1'></div>

        <button
          type='button'
          onClick={() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = '';
              if (onChange) onChange('');
            }
          }}
          className='p-2 hover:bg-gray-200 rounded border text-sm text-red-600'
          title='Clear All'
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorInput}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        className='min-h-96 p-4 focus:outline-none text-black font-sans'
        style={{
          maxHeight: '400px',
          overflowY: 'auto',
          lineHeight: '1.6',
          fontFamily: defaultFontFamily,
        }}
        data-placeholder='Start editing...'
      />
    </div>
  );
};

export default WYSIWYGEditor;
