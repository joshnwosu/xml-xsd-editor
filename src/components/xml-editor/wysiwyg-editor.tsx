// import React from 'react';

// interface WysiwygEditorProps {
//   editorRef: React.RefObject<HTMLDivElement | null>;
//   onInput: () => void;
//   onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
//   onMouseUp: () => void;
//   onKeyUp: () => void;
//   isEditable: boolean;
// }

// export const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
//   editorRef,
//   onInput,
//   onKeyDown,
//   onMouseUp,
//   onKeyUp,
//   isEditable,
// }) => {
//   return (
//     <div
//       ref={editorRef}
//       className='focus:outline-none document-editor'
//       // Remove contentEditable completely - we'll handle editing through form inputs
//       onInput={isEditable ? onInput : undefined}
//       onKeyDown={isEditable ? onKeyDown : undefined}
//       onMouseUp={isEditable ? onMouseUp : undefined}
//       onKeyUp={isEditable ? onKeyUp : undefined}
//       data-editable={isEditable}
//       style={{
//         padding: '4rem 3rem',
//         fontFamily: 'inherit',
//         fontSize: '16px',
//         lineHeight: '1.6',
//         backgroundColor: 'white',
//         color: '#333',
//       }}
//     />
//   );
// };

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
  const processingRef = useRef(false);

  useEffect(() => {
    if (!editorRef.current || !xmlContent || processingRef.current) return;

    // Prevent re-initialization if content hasn't changed significantly
    if (isInitialized.current) {
      const currentContent =
        editorRef.current.querySelector('.wysiwyg-document');
      if (currentContent) {
        return;
      }
    }

    const initializeEditor = async () => {
      processingRef.current = true;

      try {
        // Show loading state
        editorRef.current!.innerHTML = `
          <div style="display: flex; justify-content: center; align-items: center; height: 200px; color: #666;">
            <div style="text-align: center;">
              <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
              <div>Processing XML document...</div>
            </div>
          </div>
        `;

        // Set up schema if available
        if (Object.keys(schemaInfo).length > 0 && xsdContent) {
          XmlWysiwygConverter.setSchemaInfo(schemaInfo, xsdContent);
        }

        // Set up the callback to update XML in store when changes are made
        XmlWysiwygConverter.onXmlChange((newXml) => {
          setXmlContent(newXml);
          setHasUnsavedChanges(true);
          if (onInput) onInput();
        });

        // Convert XML to WYSIWYG HTML asynchronously
        const wysiwygHtml = await XmlWysiwygConverter.xmlToWysiwygAsync(
          xmlContent,
          isEditable
        );

        // Use requestAnimationFrame to avoid blocking
        requestAnimationFrame(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = wysiwygHtml;
            isInitialized.current = true;
          }
          processingRef.current = false;
        });
      } catch (error) {
        console.error('Error initializing WYSIWYG editor:', error);
        if (editorRef.current) {
          editorRef.current.innerHTML = `
            <div class="wysiwyg-error">
              Error loading XML content: ${
                error instanceof Error ? error.message : 'Unknown error'
              }
            </div>
          `;
        }
        processingRef.current = false;
      }
    };

    initializeEditor();

    return () => {
      // Cleanup - don't clear initialization flag to prevent re-renders
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
      processingRef.current = false;
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
