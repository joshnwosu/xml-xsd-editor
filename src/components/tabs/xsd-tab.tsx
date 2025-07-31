import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileX } from 'lucide-react';
import { CodeViewer } from '../code-viewer';

interface XsdTabProps {
  xsdContent: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const XsdTab: React.FC<XsdTabProps> = ({ xsdContent, onFileUpload }) => {
  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {!xsdContent ? (
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center p-8'>
            <FileX className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No XSD File Loaded
            </h3>
            <p className='text-sm text-gray-500 mb-6'>
              Import an XSD file using the menu bar or upload one directly
            </p>
            <input
              type='file'
              accept='.xsd'
              onChange={onFileUpload}
              className='hidden'
              id='xsd-upload-direct'
            />
            <Button variant='outline' asChild>
              <label htmlFor='xsd-upload-direct' className='cursor-pointer'>
                <Upload className='w-4 h-4 mr-2' />
                Upload XSD File
              </label>
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex-1 overflow-hidden'>
          <CodeViewer code={xsdContent} language='xsd' />
        </div>
      )}
    </div>
  );
};
