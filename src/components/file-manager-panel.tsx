import React, { useState } from 'react';
import { FileText, Code, FileX, MessageSquare } from 'lucide-react';
import { PdfTab } from './tabs/pdf-tab';
import { XmlTab } from './tabs/xml-tab';
import { XsdTab } from './tabs/xsd-tab';
import { CommentsTab } from './tabs/comments-tab';
import { CustomTabs } from './tabs/custom-tab';
import { useFileStore } from '@/store/file-store';

export const FileManagerPanel: React.FC = () => {
  // const [xmlContent, setXmlContent] = useState('');
  // const [xsdContent, setXsdContent] = useState('');
  // const [pdfFile, setPdfFile] = useState<File | null>(null);
  // const [activeTab, setActiveTab] = useState('pdf');

  const {
    xmlContent,
    xsdContent,
    pdfFile,
    activeTab,
    setXmlContent,
    setXsdContent,
    setPdfFile,
    setActiveTab,
  } = useFileStore();

  const tabs = [
    { id: 'pdf', label: 'PDF', icon: <FileText className='w-4 h-4' /> },
    { id: 'xml', label: 'XML', icon: <Code className='w-4 h-4' /> },
    { id: 'xsd', label: 'XSD', icon: <FileX className='w-4 h-4' /> },
    {
      id: 'comments',
      label: 'Comments',
      icon: <MessageSquare className='w-4 h-4' />,
    },
  ];

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: 'xml' | 'xsd' | 'pdf'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fileType === 'pdf') {
      setPdfFile(file);
      return;
    }

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
        setXmlContent(escapedContent);
      } else if (fileType === 'xsd') {
        setXsdContent(escapedContent);
      }
    };
    reader.readAsText(file);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pdf':
        return (
          <PdfTab
            pdfFile={pdfFile}
            onFileUpload={(e) => handleFileUpload(e, 'pdf')}
          />
        );
      case 'xml':
        return (
          <XmlTab
            xmlContent={xmlContent}
            onFileUpload={(e) => handleFileUpload(e, 'xml')}
          />
        );
      case 'xsd':
        return (
          <XsdTab
            xsdContent={xsdContent}
            onFileUpload={(e) => handleFileUpload(e, 'xsd')}
          />
        );
      case 'comments':
        return <CommentsTab />;
      default:
        return null;
    }
  };

  return (
    <div className='bg-white overflow-hidden h-full flex flex-col'>
      <CustomTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        {renderTabContent()}
      </CustomTabs>
    </div>
  );
};
