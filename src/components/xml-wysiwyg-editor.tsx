import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, Code, AlertTriangle, Edit3 } from 'lucide-react';
// import { EditorToolbar } from '@/components/toolbar/editor-toolbar';
import { StatusBar } from '@/components/editor/status-bar';
import { useEditorCommands } from '@/hooks/use-editor-commands';
import { XmlWysiwygConverter } from '@/utils/xml-wysiwyg-converter';
import { useFileStore } from '@/store/file-store';

export const XmlWysiwygEditor: React.FC = () => {
  const { xmlContent, setXmlContent } = useFileStore();
  const [_, setActiveFormats] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [viewMode, setViewMode] = useState<'wysiwyg' | 'xml'>('wysiwyg');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string>('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Check which formats are currently active
  const updateActiveFormats = (): void => {
    const formats = new Set<string>();

    // Note: Standard formatting commands don't work well with our custom XML structure
    // We'll focus on basic text editing for XML content
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

  const { execCommand } = useEditorCommands(
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
            <div style="text-align: center; padding: 2rem; color: #666;">
              <div style="font-size: 2rem; margin-bottom: 1rem;">📄</div>
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

  // Handle view mode toggle
  const toggleViewMode = () => {
    if (viewMode === 'wysiwyg' && hasChanges) {
      saveToXml();
    }
    setViewMode(viewMode === 'wysiwyg' ? 'xml' : 'wysiwyg');
  };

  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-white'>
      {/* Custom toolbar for XML editing */}
      <div className='flex items-center justify-between p-3 border-b bg-gray-50'>
        <div className='flex items-center space-x-2'>
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
            disabled={!xmlContent.trim()}
          >
            {viewMode === 'wysiwyg' ? (
              <>
                <Code className='w-4 h-4' />
                <span>XML View</span>
              </>
            ) : (
              <>
                <Edit3 className='w-4 h-4' />
                <span>WYSIWYG</span>
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
                disabled={!xmlContent.trim()}
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

      {/* Editor content */}
      <div className='flex-1 overflow-hidden'>
        {viewMode === 'wysiwyg' ? (
          <div
            ref={editorRef}
            className='h-full overflow-auto p-6 focus:outline-none'
            contentEditable={true}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onMouseUp={updateActiveFormats}
            onKeyUp={updateActiveFormats}
            style={{
              minHeight: '100%',
              backgroundColor: 'white',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          />
        ) : (
          <div className='h-full overflow-auto p-6'>
            <pre className='whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded border'>
              {xmlContent || 'No XML content loaded'}
            </pre>
          </div>
        )}
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

      {/* Custom styles for XML elements */}
      <style>{`
        .xml-document {
          max-width: none;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .xml-header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 1rem;
          margin-bottom: 2rem;
        }
        
        .document-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }
        
        .document-info {
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .root-element {
          background: #f3f4f6;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }
        
        .xml-element {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .xml-element-header {
          background: #f8fafc;
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
        }
        
        .xml-tag-name {
          font-weight: 600;
          color: #1f2937;
          font-family: monospace;
          font-size: 0.875rem;
        }
        
        .xml-attributes {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .xml-attribute {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          font-family: monospace;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .attr-name {
          color: #059669;
          font-weight: 500;
        }
        
        .attr-value {
          color: #dc2626;
          background: #fef2f2;
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
          min-width: 2rem;
        }
        
        .xml-element-content {
          padding: 1rem;
        }
        
        .xml-text-only {
          background: #f9fafb;
          border: 1px dashed #d1d5db;
          border-radius: 0.25rem;
          padding: 0.75rem;
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          min-height: 2rem;
        }
        
        .xml-empty-element {
          color: #9ca3af;
          font-style: italic;
          font-size: 0.875rem;
        }
        
        .xml-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 1rem;
        }
        
        .no-xml-content {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Focus styles for editable content */
        .attr-value:focus,
        .xml-text-only:focus,
        .xml-text-content:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          background: white;
        }
        
        /* Nested element styling */
        .xml-element .xml-element {
          margin-left: 1rem;
          border-left: 3px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
};
