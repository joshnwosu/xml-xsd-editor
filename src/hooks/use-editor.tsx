import { useState, useRef, useEffect } from 'react';
import { XmlWysiwygConverter } from '@/utils/xml-wysiwyg-converter';
import { useFileStore } from '@/store/file-store';
import { useEditorCommands } from '@/hooks/use-editor-commands';

export const useEditor = () => {
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
              <p>No XML Content</p>
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

  // Handle view mode toggle
  const toggleViewMode = () => {
    if (viewMode === 'wysiwyg' && hasChanges) {
      saveToXml();
    }
    setViewMode(viewMode === 'wysiwyg' ? 'xml' : 'wysiwyg');
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

  return {
    // State
    activeFormats,
    wordCount,
    charCount,
    viewMode,
    hasChanges,
    error,
    xmlContent,
    editorRef,

    // Actions
    loadXmlContent,
    saveToXml,
    handleInput,
    handleKeyDown,
    toggleViewMode,
    updateActiveFormats,
    updateCounts,
    execCommand,
    insertLink,
    handleImageUpload,
  };
};
