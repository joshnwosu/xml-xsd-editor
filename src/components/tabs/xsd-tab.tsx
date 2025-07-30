import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { CodeViewer } from '../code-viewer';

interface XsdTabProps {
  xsdContent: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const XsdTab: React.FC<XsdTabProps> = ({ xsdContent, onFileUpload }) => {
  return (
    <div className='space-y-4'>
      <input
        type='file'
        accept='.xsd'
        onChange={onFileUpload}
        className='hidden'
        id='xsd-upload'
      />
      <Button asChild className='w-full'>
        <label htmlFor='xsd-upload' className='cursor-pointer'>
          <Upload className='w-4 h-4 mr-2' />
          Upload XSD File
        </label>
      </Button>
      {xsdContent && (
        <div>
          <h4 className='text-sm font-medium mb-2'>XSD Content:</h4>
          <CodeViewer code={xsdContent} language='xsd' />
        </div>
      )}
    </div>
  );
};
