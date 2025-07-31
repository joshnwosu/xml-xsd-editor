import { SystemNavBar } from '@/components/system-navbar';
import { FileManagerPanel } from '@/components/file-manager-panel';
import { EditorPanel } from '@/components/editor-panel';

export default function HomePage() {
  return (
    <div className='bg-gray-100 w-screen h-screen flex flex-col overflow-hidden'>
      {/* System Navigation Bar */}
      <div className='flex-shrink-0'>
        <SystemNavBar />
      </div>

      {/* Main Content Flex */}
      <div className='flex-1 flex gap-4 p-0 overflow-hidden min-h-0'>
        {/* Left Panel - File Manager (40% width) */}
        <div className='flex-[2] overflow-hidden !p-0'>
          <FileManagerPanel />
        </div>

        {/* Right Panel - Editor (60% width) */}
        <div className='flex-[3] overflow-hidden'>
          <EditorPanel />
        </div>
      </div>
    </div>
  );
}
