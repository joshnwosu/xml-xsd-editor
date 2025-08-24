// wysiwyg-editor.tsx
import React, { useEffect, useRef } from 'react';
import { XmlWysiwygConverter } from '@/utils/xml-wysiwyg-converter';
import { useFileStore } from '@/store/file-store';

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
  const {
    xmlContent,
    xsdContent,
    schemaInfo,
    setXmlContent,
    setHasUnsavedChanges,
  } = useFileStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!editorRef.current || !xmlContent) return;

    // Prevent re-initialization if content hasn't changed significantly
    if (isInitialized.current) {
      // Check if we need to re-render (e.g., XML was loaded from file)
      const currentContent =
        editorRef.current.querySelector('.wysiwyg-document');
      if (currentContent) {
        // If WYSIWYG content exists, don't re-initialize unless explicitly needed
        return;
      }
    }

    try {
      // Set up schema if available
      if (Object.keys(schemaInfo).length > 0 && xsdContent) {
        XmlWysiwygConverter.setSchemaInfo(schemaInfo, xsdContent);
      }

      // Set up the callback to update XML in store when changes are made
      XmlWysiwygConverter.onXmlChange((newXml) => {
        setXmlContent(newXml);
        setHasUnsavedChanges(true);
        // Trigger the onInput callback to update word/char counts
        if (onInput) onInput();
      });

      // Convert XML to WYSIWYG HTML
      const wysiwygHtml = XmlWysiwygConverter.xmlToWysiwyg(
        xmlContent,
        isEditable
      );
      editorRef.current.innerHTML = wysiwygHtml;

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing WYSIWYG editor:', error);
      editorRef.current.innerHTML = `
        <div class="wysiwyg-error">
          Error loading XML content: ${
            error instanceof Error ? error.message : 'Unknown error'
          }
        </div>
      `;
    }

    // Cleanup function
    return () => {
      // Don't clear the initialization flag on cleanup to prevent re-renders
    };
  }, [
    xmlContent,
    xsdContent,
    schemaInfo,
    isEditable,
    setXmlContent,
    setHasUnsavedChanges,
    editorRef,
    onInput,
  ]);

  // Reset initialization flag when XML content is explicitly cleared
  useEffect(() => {
    if (!xmlContent) {
      isInitialized.current = false;
    }
  }, [xmlContent]);

  return (
    <div
      ref={editorRef}
      className='wysiwyg-container'
      onInput={onInput}
      onKeyDown={onKeyDown}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
      // style={{
      //   minHeight: '100%',
      //   padding: '0',
      //   outline: 'none',
      // }}

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
