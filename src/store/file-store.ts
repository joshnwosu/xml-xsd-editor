import { create } from 'zustand';

interface FileState {
  xmlContent: string;
  xsdContent: string;
  pdfFile: File | null;
  activeTab: string;
  setXmlContent: (content: string) => void;
  setXsdContent: (content: string) => void;
  setPdfFile: (file: File | null) => void;
  setActiveTab: (tab: string) => void;
  importFile: (fileType: 'xml' | 'xsd') => void;
}

export const useFileStore = create<FileState>((set, get) => ({
  xmlContent: '',
  xsdContent: '',
  pdfFile: null,
  activeTab: 'xml',
  setXmlContent: (content) => set({ xmlContent: content }),
  setXsdContent: (content) => set({ xsdContent: content }),
  setPdfFile: (file) => set({ pdfFile: file }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  importFile: (fileType) => {
    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileType === 'xml' ? '.xml' : '.xsd';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        // Escape HTML for display
        const escapedContent = content
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

        if (fileType === 'xml') {
          set({ xmlContent: escapedContent, activeTab: 'xml' });
        } else if (fileType === 'xsd') {
          set({ xsdContent: escapedContent, activeTab: 'xsd' });
        }
      };
      reader.readAsText(file);
    };

    // Trigger the file picker
    input.click();
  },
}));
