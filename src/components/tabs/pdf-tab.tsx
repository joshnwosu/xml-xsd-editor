// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { FileText, Upload } from 'lucide-react';

// interface PdfTabProps {
//   pdfFile: File | null;
//   xmlContent: string;
//   onFileUpload: () => void;
// }

// export const PdfTab: React.FC<PdfTabProps> = ({
//   pdfFile,
//   xmlContent,
//   onFileUpload,
// }) => {
//   return (
//     <div className='flex flex-col h-full overflow-hidden'>
//       {!xmlContent && (
//         <div className='flex-1 flex items-center justify-center'>
//           <div className='text-center p-8'>
//             <FileText className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
//             <p className='text-lg font-medium text-gray-900 mb-2'>
//               No PDF to display
//             </p>
//             <p className='text-sm text-gray-500 mb-6'>
//               Import an XML file using the menu bar or upload one directly
//             </p>

//             <Button
//               variant='outline'
//               className='cursor-pointer'
//               onClick={onFileUpload}
//             >
//               <Upload className='w-4 h-4 mr-2' />
//               Upload XML File
//             </Button>
//           </div>
//         </div>
//       )}
//       {pdfFile && (
//         <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
//           <p className='text-sm text-green-800'>
//             <strong>Uploaded:</strong> {pdfFile.name}
//           </p>
//           <p className='text-xs text-green-600'>
//             Size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download, Printer } from 'lucide-react';
import { XmlPdfConverter } from '@/utils/xml-pdf-converter';

interface PdfTabProps {
  pdfFile: File | null;
  xmlContent: string;
  schemaInfo?: any; // Schema info from your store
  onFileUpload: () => void;
}

export const PdfTab: React.FC<PdfTabProps> = ({
  pdfFile,
  xmlContent,
  schemaInfo = {},
  onFileUpload,
}) => {
  const [pdfHtml, setPdfHtml] = useState<string>('');

  useEffect(() => {
    if (xmlContent) {
      // Set schema info if available
      if (schemaInfo && Object.keys(schemaInfo).length > 0) {
        XmlPdfConverter.setSchemaInfo(schemaInfo);
      }

      // Convert XML to PDF-style HTML
      const html = XmlPdfConverter.xmlToPdf(xmlContent);
      setPdfHtml(html);
    }
  }, [xmlContent, schemaInfo]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a blob with the HTML content
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Document</title>
        <style>
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        ${pdfHtml}
      </body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {!xmlContent && (
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center p-8'>
            <FileText className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
            <p className='text-lg font-medium text-gray-900 mb-2'>
              No PDF to display
            </p>
            <p className='text-sm text-gray-500 mb-6'>
              Import an XML file using the menu bar or upload one directly
            </p>

            <Button
              variant='outline'
              className='cursor-pointer'
              onClick={onFileUpload}
            >
              <Upload className='w-4 h-4 mr-2' />
              Upload XML File
            </Button>
          </div>
        </div>
      )}

      {xmlContent && (
        <>
          {/* Toolbar */}
          <div className='flex justify-between items-center p-4 border-b bg-gray-50'>
            <div className='flex items-center gap-2'>
              <FileText className='h-5 w-5 text-gray-600' />
              <span className='font-medium text-gray-700'>PDF Preview</span>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handlePrint}
                className='flex items-center gap-2'
              >
                <Printer className='h-4 w-4' />
                Print
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleDownload}
                className='flex items-center gap-2'
              >
                <Download className='h-4 w-4' />
                Download
              </Button>
            </div>
          </div>

          {/* PDF Content */}
          <div
            className='flex-1 overflow-auto bg-gray-100'
            style={{ padding: '20px' }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: pdfHtml }}
              className='pdf-container'
            />
          </div>
        </>
      )}

      {pdfFile && !xmlContent && (
        <div className='bg-green-50 border border-green-200 rounded-lg p-4 m-4'>
          <p className='text-sm text-green-800'>
            <strong>Uploaded:</strong> {pdfFile.name}
          </p>
          <p className='text-xs text-green-600'>
            Size: {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );
};
