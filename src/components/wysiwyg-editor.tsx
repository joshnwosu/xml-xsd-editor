import React, { useState, useRef, useEffect } from 'react';
import { EditorToolbar } from '@/components/toolbar/editor-toolbar';
import { EditorContent } from '@/components/editor/editor-content';
import { StatusBar } from '@/components/editor/status-bar';
import { useEditorCommands } from '@/hooks/use-editor-commands';

export default function WysiwygEditor() {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  // Check which formats are currently active
  const updateActiveFormats = (): void => {
    const formats = new Set<string>();

    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('justifyLeft')) formats.add('alignLeft');
    if (document.queryCommandState('justifyCenter')) formats.add('alignCenter');
    if (document.queryCommandState('justifyRight')) formats.add('alignRight');
    if (document.queryCommandState('insertUnorderedList'))
      formats.add('bulletList');
    if (document.queryCommandState('insertOrderedList'))
      formats.add('numberedList');

    setActiveFormats(formats);
  };

  // Update word and character counts
  const updateCounts = (): void => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      setCharCount(textContent.length);
      const words = textContent.split(/\s+/).filter((word) => word.length > 0);
      setWordCount(words.length);
    }
  };

  const { execCommand, insertLink, handleImageUpload } = useEditorCommands(
    editorRef,
    updateActiveFormats,
    updateCounts
  );

  // Handle content changes
  const handleInput = (): void => {
    updateActiveFormats();
    updateCounts();
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
      }
    }
  };

  // Handle selection changes
  useEffect(() => {
    const handleSelectionChange = (): void => {
      updateActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = '<p>Start editing your document...</p>';
      updateCounts();
    }
  }, []);

  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-white'>
      <EditorToolbar
        activeFormats={activeFormats}
        onCommand={execCommand}
        onInsertLink={insertLink}
        onInsertImage={() => {}} // This will be handled internally by EditorToolbar
        onImageUpload={handleImageUpload}
      />

      <EditorContent
        editorRef={editorRef}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
      />

      <StatusBar wordCount={wordCount} charCount={charCount} />
    </div>
  );
}
