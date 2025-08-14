import { SystemNavBar } from '@/components/system-navbar';
import { FileManagerPanel } from '@/components/file-manager-panel';
import { XmlWysiwygEditor } from '@/components/xml-editor/xml-wysiwyg-editor';

export default function HomePage() {
  return (
    <div className='bg-gray-100 w-screen h-screen flex flex-col overflow-hidden'>
      {/* System Navigation Bar */}
      <div className='flex-shrink-0'>
        <SystemNavBar />
      </div>

      {/* Main Content Flex */}
      <div className='flex-1 flex gap-0 p-0 overflow-hidden min-h-0'>
        {/* Left Panel - File Manager (40% width) */}
        <div className='flex-[2.2] overflow-hidden !p-0'>
          <FileManagerPanel />
        </div>

        {/* Right Panel - Editor (60% width) */}
        <div className='flex-[3] overflow-hidden'>
          <div className='w-full h-full flex flex-col overflow-hidde'>
            <XmlWysiwygEditor />
          </div>
        </div>
      </div>
    </div>
  );
}
