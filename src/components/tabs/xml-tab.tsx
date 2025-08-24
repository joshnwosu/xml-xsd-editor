// import React from 'react';
// import { Button } from '@/components/ui/button';
// import { Upload, FileCode } from 'lucide-react';
// import { CodeViewer } from '../code-viewer';

// interface XmlTabProps {
//   xmlContent: string;
//   onFileUpload: () => void;
// }

// export const XmlTab: React.FC<XmlTabProps> = ({ xmlContent, onFileUpload }) => {
//   return (
//     <div className='flex flex-col h-full overflow-hidden'>
//       {!xmlContent ? (
//         <div className='flex-1 flex items-center justify-center'>
//           <div className='text-center p-8'>
//             <FileCode className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
//             <p className='text-lg font-medium text-gray-900 mb-2'>
//               No XML File Loaded
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
//       ) : (
//         <div className='flex-1 overflow-hidden'>
//           <CodeViewer code={xmlContent} language='xml' />
//         </div>
//       )}
//     </div>
//   );
// };

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileCode, RefreshCw } from 'lucide-react';
import { CodeViewer } from '../code-viewer';
import { useFileStore } from '@/store/file-store';

interface XmlTabProps {
  xmlContent: string;
  onFileUpload: () => void;
}

export const XmlTab: React.FC<XmlTabProps> = ({ xmlContent, onFileUpload }) => {
  const [localXmlContent, setLocalXmlContent] = useState(xmlContent);
  const [isLiveUpdate, setIsLiveUpdate] = useState(true);
  const hasUnsavedChanges = useFileStore((state) => state.hasUnsavedChanges);

  // Update local content when global XML content changes
  useEffect(() => {
    if (isLiveUpdate) {
      setLocalXmlContent(xmlContent);
    }
  }, [xmlContent, isLiveUpdate]);

  // Handle manual refresh
  const handleRefresh = () => {
    setLocalXmlContent(xmlContent);
  };

  return (
    <div className='flex flex-col h-full overflow-hidden'>
      {!xmlContent ? (
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center p-8'>
            <FileCode className='mx-auto h-16 w-16 text-gray-300 mb-4 stroke-1' />
            <p className='text-lg font-medium text-gray-900 mb-2'>
              No XML File Loaded
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
      ) : (
        <>
          {/* Status bar */}
          <div className='flex items-center justify-between px-4 py-2 bg-gray-50 border-b'>
            <div className='flex items-center gap-3'>
              <label className='flex items-center gap-2 text-sm'>
                <input
                  type='checkbox'
                  checked={isLiveUpdate}
                  onChange={(e) => setIsLiveUpdate(e.target.checked)}
                  className='rounded'
                />
                <span>Live updates from WYSIWYG</span>
              </label>

              {hasUnsavedChanges && (
                <span className='text-sm text-orange-600'>
                  • Modified in WYSIWYG editor
                </span>
              )}
            </div>

            {!isLiveUpdate && localXmlContent !== xmlContent && (
              <Button variant='outline' size='sm' onClick={handleRefresh}>
                <RefreshCw className='w-4 h-4 mr-1' />
                Refresh
              </Button>
            )}
          </div>

          {/* Code viewer */}
          <div className='flex-1 overflow-hidden'>
            <CodeViewer code={localXmlContent} language='xml' />
          </div>
        </>
      )}
    </div>
  );
};
