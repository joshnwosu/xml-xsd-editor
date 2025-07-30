import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { CodeViewer } from './code-viewer';

interface XmlTabProps {
  xmlContent: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const XmlTab: React.FC<XmlTabProps> = ({ xmlContent, onFileUpload }) => {
  return (
    <div className='space-y-4'>
      <input
        type='file'
        accept='.xml'
        onChange={onFileUpload}
        className='hidden'
        id='xml-upload'
      />
      <Button asChild className='w-full'>
        <label htmlFor='xml-upload' className='cursor-pointer'>
          <Upload className='w-4 h-4 mr-2' />
          Upload XML File
        </label>
      </Button>
      {xmlContent && (
        <div>
          <h4 className='text-sm font-medium mb-2'>XML Content:</h4>
          <CodeViewer code={xmlContent} language='xml' />
        </div>
      )}
    </div>
  );
};
