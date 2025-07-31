import { useCallback } from 'react';

export const useEditorCommands = (
  editorRef: React.RefObject<HTMLDivElement | null>,
  updateActiveFormats: () => void,
  updateCounts: () => void
) => {
  // Execute document commands
  const execCommand = useCallback(
    (command: string, value?: string): void => {
      document.execCommand(command, false, value);
      editorRef.current?.focus();
      updateActiveFormats();
      updateCounts();
    },
    [editorRef, updateActiveFormats, updateCounts]
  );

  // Insert link
  const insertLink = useCallback((): void => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  // Handle image upload
  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>): void => {
          if (event.target?.result && typeof event.target.result === 'string') {
            execCommand('insertImage', event.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [execCommand]
  );

  return {
    execCommand,
    insertLink,
    handleImageUpload,
  };
};
