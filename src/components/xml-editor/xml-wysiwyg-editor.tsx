import React from 'react';
import { EditorToolbar } from '@/components/toolbar/editor-toolbar';
import { StatusBar } from '@/components/editor/status-bar';
import { EditorHeader } from './editor-header';
import { ErrorDisplay } from './error-display';
import { WysiwygEditor } from './wysiwyg-editor';
import { XmlViewer } from './xml-viewer';
import { EditorStyles } from './editor-styles';
import { useEditor } from '@/hooks/use-editor';
import { useFileStore } from '@/store/file-store';

export const XmlWysiwygEditor: React.FC = () => {
  const { activeTab } = useFileStore();
  const {
    activeFormats,
    wordCount,
    charCount,
    viewMode,
    hasChanges,
    error,
    xmlContent,
    editorRef,
    loadXmlContent,
    saveToXml,
    handleInput,
    handleKeyDown,
    toggleViewMode,
    updateActiveFormats,
    execCommand,
    insertLink,
    handleImageUpload,
  } = useEditor();

  return (
    <div className='w-full h-full flex flex-col'>
      {/* EditorToolbar - only show in WYSIWYG mode AND when activeTab is 'pdf' */}
      {viewMode === 'wysiwyg' && activeTab === 'pdf' && (
        <EditorToolbar
          activeFormats={activeFormats}
          onCommand={execCommand}
          onInsertLink={insertLink}
          onInsertImage={() => {}} // This will be handled internally by EditorToolbar
          onImageUpload={handleImageUpload}
        />
      )}

      {/* Header */}
      <EditorHeader
        hasChanges={hasChanges}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        onRefresh={loadXmlContent}
        onSave={saveToXml}
      />

      {/* Error display */}
      <ErrorDisplay error={error} />

      {/* Main editor area with document-like styling */}
      <div className='flex-1 overflow-auto bg-gray-100 p-8'>
        <div className='max-w-4xl mx-auto bg-white rounded-lg min-h-full'>
          {viewMode === 'wysiwyg' ? (
            <WysiwygEditor
              editorRef={editorRef}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onMouseUp={updateActiveFormats}
              onKeyUp={updateActiveFormats}
              isEditable={activeTab === 'pdf'}
            />
          ) : (
            <XmlViewer xmlContent={xmlContent} />
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
      <EditorStyles />
    </div>
  );
};
