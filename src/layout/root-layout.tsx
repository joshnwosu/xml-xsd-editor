import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';

export default function RootLayout() {
  return (
    <div className='bg-gray-100 dark:bg-background'>
      <Outlet />
      <Toaster richColors theme='system' toastOptions={{}} />
    </div>
  );
}
