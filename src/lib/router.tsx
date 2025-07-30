import { createBrowserRouter } from 'react-router-dom';
import XMLXSDConverter from '@/components/xml-xsd-converter';
import RootLayout from '@/layout/root-layout';
import HomePage from '@/pages/home';
import NotFoundPage from '@/pages/not-found';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/xml-editor',
        element: <XMLXSDConverter />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
