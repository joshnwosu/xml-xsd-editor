import { SystemNavBar } from '@/components/system-navbar';
import { FileManagerPanel } from '@/components/file-manager-panel';
import { EditorPanel } from '@/components/editor-panel';

export default function HomePage() {
  return (
    <div className='bg-gray-100 w-screen h-screen flex flex-col'>
      {/* System Navigation Bar */}
      <SystemNavBar />

      {/* Main Content Grid */}
      <div className='flex-1 grid grid-cols-5 gap-4 p-4'>
        {/* Left Panel - File Manager */}
        <div className='col-span-2'>
          <FileManagerPanel />
        </div>

        {/* Right Panel - Editor */}
        <div className='col-span-3'>
          <EditorPanel />
        </div>
      </div>
    </div>
  );
}
