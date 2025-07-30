import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Code, FileX, MessageSquare } from 'lucide-react';
import { PdfTab } from './tabs/pdf-tab';
import { XmlTab } from './tabs/xml-tab';
import { XsdTab } from './tabs/xsd-tab';
import { CommentsTab } from './tabs/comments-tab';

export const FileManagerPanel: React.FC = () => {
  const [xmlContent, setXmlContent] = useState('');
  const [xsdContent, setXsdContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('pdf');

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

  return (
    <Card className='h-full'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-lg'>File Manager</CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='h-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='pdf' className='flex items-center gap-1'>
              <FileText className='w-4 h-4' />
              PDF
            </TabsTrigger>
            <TabsTrigger value='xml' className='flex items-center gap-1'>
              <Code className='w-4 h-4' />
              XML
            </TabsTrigger>
            <TabsTrigger value='xsd' className='flex items-center gap-1'>
              <FileX className='w-4 h-4' />
              XSD
            </TabsTrigger>
            <TabsTrigger value='comments' className='flex items-center gap-1'>
              <MessageSquare className='w-4 h-4' />
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value='pdf' className='mt-4'>
            <PdfTab
              pdfFile={pdfFile}
              onFileUpload={(e) => handleFileUpload(e, 'pdf')}
            />
          </TabsContent>

          <TabsContent value='xml' className='mt-4'>
            <XmlTab
              xmlContent={xmlContent}
              onFileUpload={(e) => handleFileUpload(e, 'xml')}
            />
          </TabsContent>

          <TabsContent value='xsd' className='mt-4'>
            <XsdTab
              xsdContent={xsdContent}
              onFileUpload={(e) => handleFileUpload(e, 'xsd')}
            />
          </TabsContent>

          <TabsContent value='comments' className='mt-4'>
            <CommentsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
