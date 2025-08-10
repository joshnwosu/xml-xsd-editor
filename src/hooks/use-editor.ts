import { useState, useRef, useCallback, useEffect } from 'react';
import { XmlWysiwygConverter } from '@/utils/xml-wysiwyg-converter';
import { useFileStore } from '@/store/file-store';
import { useEditorCommands } from '@/hooks/use-editor-commands';

export const useEditor = () => {
  const { xmlContent, setXmlContent, schemaInfo, xsdContent, setXsdContent } =
    useFileStore();

  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [viewMode, setViewMode] = useState<'wysiwyg' | 'xml'>('wysiwyg');
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  // Check which formats are currently active
  const updateActiveFormats = useCallback((): void => {
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
  }, []);

  // Update word and character counts
  const updateCounts = useCallback((): void => {
    if (editorRef.current) {
      const textContent = editorRef.current.textContent || '';
      setCharCount(textContent.length);
      const words = textContent.trim()
        ? textContent
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0)
        : [];
      setWordCount(words.length);
    }
  }, []);

  const { execCommand, insertLink, handleImageUpload } = useEditorCommands(
    editorRef,
    updateActiveFormats,
    updateCounts
  );

  // Convert XML to WYSIWYG format
  const loadXmlContent = useCallback(() => {
    if (!xmlContent.trim()) {
      if (editorRef.current) {
        editorRef.current.innerHTML = `
          <div class="no-xml-content">
            <div style="text-align: center; padding: 2rem; color: #666;">
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
      // Set schema info AND XSD content in converter if available
      if (Object.keys(schemaInfo).length > 0 || xsdContent) {
        XmlWysiwygConverter.setSchemaInfo(schemaInfo, xsdContent);
      }

      const wysiwygContent = XmlWysiwygConverter.xmlToWysiwyg(xmlContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = wysiwygContent;
      }
      setError(null);
      updateCounts();
      setHasChanges(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load XML content'
      );
    }
  }, [xmlContent, schemaInfo, xsdContent, updateCounts]);

  // Save WYSIWYG content back to XML
  const saveToXml = useCallback(() => {
    if (!editorRef.current) return;

    try {
      const xmlOutput = XmlWysiwygConverter.wysiwygToXml(
        editorRef.current.innerHTML
      );

      // Store the XML content directly (no HTML escaping for storage)
      setXmlContent(xmlOutput);
      setHasChanges(false);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save XML content'
      );
    }
  }, [setXmlContent]);

  // Handle content changes
  const handleInput = useCallback((): void => {
    setHasChanges(true);
    updateActiveFormats();
    updateCounts();

    // Handle dropdown changes specifically
    const event = window.event as Event;
    if (
      event?.target &&
      (event.target as HTMLElement).classList.contains('doc-enum-select')
    ) {
      setHasChanges(true);
    }
  }, [updateActiveFormats, updateCounts]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>): void => {
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
    },
    [execCommand, saveToXml]
  );

  // Handle view mode toggle
  const toggleViewMode = useCallback(() => {
    if (viewMode === 'wysiwyg' && hasChanges) {
      saveToXml();
    }
    setViewMode((prev) => (prev === 'wysiwyg' ? 'xml' : 'wysiwyg'));
  }, [viewMode, hasChanges, saveToXml]);

  // Load XML content when it changes
  useEffect(() => {
    if (viewMode === 'wysiwyg') {
      loadXmlContent();
    }
  }, [xmlContent, schemaInfo, xsdContent, viewMode, loadXmlContent]);

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
  }, [viewMode, updateActiveFormats]);

  // Add event listener for dropdown changes
  useEffect(() => {
    const handleDropdownChange = (e: Event) => {
      if ((e.target as HTMLElement)?.classList.contains('doc-enum-select')) {
        setHasChanges(true);
      }
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('change', handleDropdownChange, true);
      return () =>
        editor.removeEventListener('change', handleDropdownChange, true);
    }
  }, []);

  return {
    // State
    activeFormats,
    wordCount,
    charCount,
    viewMode,
    hasChanges,
    error,
    xmlContent,
    schemaInfo,
    xsdContent, // Add this if you need access to raw XSD content
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
