import React from 'react';
import { FileText, Code, FileX, MessageSquare, FileCheck } from 'lucide-react';
import { PdfTab } from './tabs/pdf-tab';
import { XmlTab } from './tabs/xml-tab';
import { XsdTab } from './tabs/xsd-tab';
import { CommentsTab } from './tabs/comments-tab';
import { ValidationPanel } from './validation-panel';
import { CustomTabs } from './tabs/custom-tab';
import { useFileStore } from '@/store/file-store';

export const FileManagerPanel: React.FC = () => {
  const { xmlContent, xsdContent, pdfFile, activeTab, setActiveTab } =
    useFileStore();

  const tabs = [
    {
      id: 'pdf',
      label: 'PDF',
      icon: <FileText className='w-4 h-4 stroke-1' />,
    },
    { id: 'xml', label: 'XML', icon: <Code className='w-4 h-4 stroke-1' /> },
    { id: 'xsd', label: 'XSD', icon: <FileX className='w-4 h-4 stroke-1' /> },
    {
      id: 'validation',
      label: 'Validation',
      icon: <FileCheck className='w-4 h-4 stroke-1' />,
    },
    {
      id: 'comments',
      label: 'Comments',
      icon: <MessageSquare className='w-4 h-4 stroke-1' />,
    },
  ];

  const importFile = useFileStore((state) => state.importFile);

  const handleImportXml = () => {
    importFile('xml');
  };

  const handleImportXsd = () => {
    importFile('xsd');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'pdf':
        return <PdfTab pdfFile={pdfFile} onFileUpload={handleImportXml} />;
      case 'xml':
        return (
          <XmlTab xmlContent={xmlContent} onFileUpload={handleImportXml} />
        );
      case 'xsd':
        return (
          <XsdTab xsdContent={xsdContent} onFileUpload={handleImportXsd} />
        );
      case 'validation':
        return (
          <div className='p-4 h-full overflow-auto'>
            <ValidationPanel />
          </div>
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
