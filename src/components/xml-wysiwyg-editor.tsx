import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Code, AlertTriangle, Edit3 } from 'lucide-react';
import { EditorToolbar } from '@/components/toolbar/editor-toolbar';
import { StatusBar } from '@/components/editor/status-bar';
import { useEditorCommands } from '@/hooks/use-editor-commands';
import { XmlWysiwygConverter } from '@/utils/xml-wysiwyg-converter';
import { useFileStore } from '@/store/file-store';

export const XmlWysiwygEditor: React.FC = () => {
  const { xmlContent, setXmlContent } = useFileStore();
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [viewMode, setViewMode] = useState<'wysiwyg' | 'xml'>('wysiwyg');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string>('');
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

  // Convert XML to WYSIWYG format
  const loadXmlContent = () => {
    if (!xmlContent.trim()) {
      if (editorRef.current) {
        editorRef.current.innerHTML = `
          <div class="no-xml-content">
            <div style="text-align: center; padding: rem; color: #666;">
              <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
              <h3>No XML Content</h3>
              <p>Load an XML file to start editing in WYSIWYG mode</p>
            </div>
          </div>
        `;
      }
      return;
    }

    try {
      const wysiwygContent = XmlWysiwygConverter.xmlToWysiwyg(xmlContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = wysiwygContent;
      }
      setError('');
      updateCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Save WYSIWYG content back to XML
  const saveToXml = () => {
    if (!editorRef.current) return;

    try {
      const xmlOutput = XmlWysiwygConverter.wysiwygToXml(
        editorRef.current.innerHTML
      );

      // Escape HTML for storage
      const escapedXml = xmlOutput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

      setXmlContent(escapedXml);
      setHasChanges(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving XML');
    }
  };

  // Handle content changes
  const handleInput = (): void => {
    setHasChanges(true);
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
        case 's':
          e.preventDefault();
          saveToXml();
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

  // Load XML content when it changes
  useEffect(() => {
    if (viewMode === 'wysiwyg') {
      loadXmlContent();
      setHasChanges(false);
    }
  }, [xmlContent, viewMode]);

  // Handle selection changes for active formats
  useEffect(() => {
    const handleSelectionChange = (): void => {
      if (viewMode === 'wysiwyg') {
        updateActiveFormats();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () =>
      document.removeEventListener('selectionchange', handleSelectionChange);
  }, [viewMode]);

  // Handle view mode toggle
  const toggleViewMode = () => {
    if (viewMode === 'wysiwyg' && hasChanges) {
      saveToXml();
    }
    setViewMode(viewMode === 'wysiwyg' ? 'xml' : 'wysiwyg');
  };

  return (
    <div className='w-full h-full flex flex-col bg-gray-50'>
      {/* EditorToolbar - only show in WYSIWYG mode */}
      {viewMode === 'wysiwyg' && (
        <EditorToolbar
          activeFormats={activeFormats}
          onCommand={execCommand}
          onInsertLink={insertLink}
          onInsertImage={() => {}} // This will be handled internally by EditorToolbar
          onImageUpload={handleImageUpload}
        />
      )}

      {/* Simplified header toolbar */}
      <div className='flex items-center justify-between p-4 bg-white border-b shadow-sm'>
        <div className='flex items-center space-x-3'>
          <span className='font-medium text-gray-900'>XML Document Editor</span>
          {hasChanges && (
            <span className='text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded'>
              Unsaved changes
            </span>
          )}
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={toggleViewMode}
            className='flex items-center space-x-2'
          >
            {viewMode === 'wysiwyg' ? (
              <>
                <Code className='w-4 h-4' />
                <span>XML View</span>
              </>
            ) : (
              <>
                <Edit3 className='w-4 h-4' />
                <span>Document View</span>
              </>
            )}
          </Button>

          {viewMode === 'wysiwyg' && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={loadXmlContent}
                className='flex items-center space-x-2'
              >
                <RefreshCw className='w-4 h-4' />
                <span>Refresh</span>
              </Button>

              <Button
                size='sm'
                onClick={saveToXml}
                disabled={!hasChanges}
                className='flex items-center space-x-2'
              >
                <Save className='w-4 h-4' />
                <span>Save</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className='bg-red-50 border-l-4 border-red-400 p-3'>
          <div className='flex items-center'>
            <AlertTriangle className='w-5 h-5 text-red-400 mr-2' />
            <span className='text-red-700 text-sm'>{error}</span>
          </div>
        </div>
      )}

      {/* Main editor area with document-like styling */}
      <div className='flex-1 overflow-auto bg-gray-100 p-8'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg'>
          {viewMode === 'wysiwyg' ? (
            <div
              ref={editorRef}
              className='focus:outline-none document-editor'
              contentEditable={true}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onMouseUp={updateActiveFormats}
              onKeyUp={updateActiveFormats}
              style={{
                minHeight: '700px',
                padding: '4rem 3rem',
                fontFamily: '"Times New Roman", Times, san-serif',
                fontSize: '16px',
                lineHeight: '1.6',
                backgroundColor: 'white',
                color: '#333',
              }}
            />
          ) : (
            <div className='p-8'>
              <pre className='whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded border overflow-x-auto'>
                {xmlContent || 'No XML content loaded'}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <StatusBar
        wordCount={wordCount}
        charCount={charCount}
        additionalInfo={
          viewMode === 'wysiwyg' && hasChanges ? (
            <span className='text-orange-600'>• Unsaved changes</span>
          ) : undefined
        }
      />

      {/* Enhanced document-style CSS */}
      <style>{`
        /* Document container styling */
        .xml-document {
          max-width: none;
          font-family: "Times New Roman", Times, serif;
          line-height: 1.6;
          color: #1a1a1a;
          background: white;
        }
        
        .document-editor {
          background: white !important;
        }
        
        /* Hide all XML structural elements completely */
        .xml-element,
        .xml-element-header,
        .xml-element-content,
        .xml-tag-name,
        .xml-attributes,
        .xml-attribute {
          display: none !important;
        }
        
        /* Document content elements - clean, document-like appearance */
        
        /* Headings */
        .doc-heading,
        h1, h2, h3, h4, h5, h6 {
          font-family: "Times New Roman", Times, serif;
          font-weight: bold;
          color: #111827;
          margin: 2rem 0 1rem 0;
          line-height: 1.2;
          page-break-after: avoid;
        }
        
        h1, .doc-heading[data-level="1"] {
          font-size: 2rem;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        
        h2, .doc-heading[data-level="2"] {
          font-size: 1.75rem;
        }
        
        h3, .doc-heading[data-level="3"] {
          font-size: 1.5rem;
        }
        
        h4, .doc-heading[data-level="4"] {
          font-size: 1.25rem;
        }
        
        h5, h6 {
          font-size: 1.125rem;
        }
        
        /* Document title from your preview */
        .doc-title {
          font-size: 24px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 20px;
          text-align: center;
          border-bottom: 2px solid #3498db;
          padding-bottom: 10px;
        }
        
        .doc-section {
          font-size: 18px;
          font-weight: bold;
          color: #34495e;
          margin: 20px 0 10px 0;
          border-left: 4px solid #3498db;
          padding-left: 10px;
        }
        
        .doc-subsection {
          font-size: 16px;
          font-weight: bold;
          color: #5d6d7e;
          margin: 15px 0 8px 0;
        }
        
        .doc-metadata {
          background: #f8f9fa;
          padding: 8px 12px;
          border-radius: 4px;
          margin: 8px 0;
          border-left: 3px solid #6c757d;
          font-size: 14px;
        }
        
        .doc-attr {
          color: #495057;
          margin-right: 15px;
        }
        
        .doc-field {
          margin: 8px 0;
          padding: 4px 0;
        }
        
        .doc-paragraph {
          margin: 12px 0;
          padding: 10px 0;
          text-align: justify;
        }
        
        .doc-email {
          margin: 8px 0;
          padding: 6px 0;
        }
        
        .doc-email a {
          color: #007bff;
          text-decoration: none;
        }
        
        .doc-email a:hover {
          text-decoration: underline;
        }
        
        .doc-phone {
          margin: 8px 0;
          padding: 6px 0;
          font-family: monospace;
        }
        
        .doc-date {
          margin: 8px 0;
          padding: 6px 0;
          font-style: italic;
        }
        
        .doc-number {
          margin: 8px 0;
          padding: 6px 0;
          font-weight: 500;
        }
        
        .doc-content {
          margin-left: 0px;
          margin-top: 10px;
        }
        
        /* Paragraphs */
        .doc-paragraph {
          font-size: 16px;
          line-height: 1.6;
          margin: 1rem 0;
          color: #374151;
          text-align: justify;
          text-indent: 0;
          background: transparent;
          border: none;
          outline: none;
          padding: 0;
          font-family: "Times New Roman", Times, serif;
        }
        
        .doc-paragraph:focus {
          background: #f9fafb;
          padding: 0.5rem;
          border-radius: 0.25rem;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Lists */
        .doc-list {
          margin: 1.5rem 0;
          padding-left: 0;
        }
        
        .doc-item {
          margin: 0.75rem 0 0.75rem 2rem;
          position: relative;
          line-height: 1.6;
          font-size: 16px;
          color: #374151;
          list-style: none;
        }
        
        .doc-item:before {
          content: "•";
          position: absolute;
          left: -1.5rem;
          color: #6b7280;
          font-weight: bold;
          font-size: 1.2em;
        }
        
        .doc-list[data-type="ordered"] {
          counter-reset: list-counter;
        }
        
        .doc-list[data-type="ordered"] .doc-item {
          counter-increment: list-counter;
        }
        
        .doc-list[data-type="ordered"] .doc-item:before {
          content: counter(list-counter) ".";
          left: -2rem;
          width: 1.5rem;
          text-align: right;
        }
        
        .doc-item:focus {
          background: #f9fafb;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Sections */
        .doc-section {
          margin: 2rem 0;
        }
        
        /* Quotes */
        .doc-quote {
          border-left: 4px solid #d1d5db;
          padding-left: 2rem;
          margin: 2rem 0;
          font-style: italic;
          color: #4b5563;
          font-size: 1.125rem;
          position: relative;
        }
        
        .doc-quote:before {
          content: """;
          font-size: 4rem;
          color: #d1d5db;
          position: absolute;
          left: -0.5rem;
          top: -1rem;
          font-family: Georgia, serif;
        }
        
        .doc-quote:focus {
          background: #f9fafb;
          padding: 1rem 1rem 1rem 2rem;
          border-radius: 0.5rem;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Code blocks */
        .doc-code {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin: 2rem 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          color: #1f2937;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        
        .doc-code:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Tables */
        .doc-table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          overflow: hidden;
        }
        
        .doc-table th,
        .doc-table td {
          padding: 0.75rem 1rem;
          border-right: 1px solid #e5e7eb;
          text-align: left;
          vertical-align: top;
        }
        
        .doc-table th {
          background: #f9fafb;
          font-weight: bold;
        }
        
        .doc-table tr {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .doc-table tr:last-child {
          border-bottom: none;
        }
        
        .doc-table th:last-child,
        .doc-table td:last-child {
          border-right: none;
        }
        
        .doc-table td:focus {
          background: #f3f4f6;
          outline: 2px solid #3b82f6;
          outline-offset: -2px;
        }
        
        /* Links */
        .doc-link {
          color: #2563eb;
          text-decoration: underline;
          text-decoration-color: #bfdbfe;
          text-underline-offset: 0.2em;
          transition: all 0.2s ease;
        }
        
        .doc-link:hover {
          color: #1d4ed8;
          text-decoration-color: #2563eb;
        }
        
        .doc-link:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          border-radius: 0.125rem;
        }
        
        /* Images */
        .doc-image {
          max-width: 100%;
          height: auto;
          margin: 2rem 0;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .doc-image:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        /* Emphasis */
        .doc-emphasis,
        em {
          font-style: italic;
          color: #374151;
        }
        
        .doc-strong,
        strong {
          font-weight: bold;
          color: #111827;
        }
        
        /* Focus states for better accessibility */
        [contenteditable]:focus {
          outline: none;
        }
        
        [contenteditable] *:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          border-radius: 0.25rem;
        }
        
        /* Print styles */
        @media print {
          .document-editor {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 1in !important;
          }
          
          .doc-heading,
          h1, h2, h3, h4, h5, h6 {
            page-break-after: avoid;
          }
          
          .doc-paragraph,
          .doc-item {
            orphans: 3;
            widows: 3;
          }
          
          .doc-section {
            page-break-inside: avoid;
          }
        }
        
        /* No content state */
        .no-xml-content {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 400px;
        }
        
        .no-xml-content h3 {
          color: #6b7280;
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .no-xml-content p {
          color: #9ca3af;
          font-size: 1rem;
        }
        
        .error {
          color: #dc3545;
          font-style: italic;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};
