import { createBrowserRouter } from 'react-router-dom';
import XMLXSDConverter from '@/components/xml-xsd-converter';
import RootLayout from '@/layout/root-layout';
import HomePage from '@/pages/home';
import NotFoundPage from '@/pages/not-found';
import XMLXSDEditor from '@/pages/xml-editor';
import XMLXSDEditorNew from '@/pages/xml-editor-new';
import XMLXSDEditorOld from '@/pages/xml-editor-old';
import XMLXSDEditorRefactored from '@/pages/xml-editor-refactored';

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
        path: '/xml-xsd-new',
        element: <XMLXSDEditorNew />,
      },
      {
        path: '/xml-xsd-old',
        element: <XMLXSDEditorOld />,
      },
      {
        path: '/xml-xsd-refactored',
        element: <XMLXSDEditorRefactored />,
      },
      {
        path: '/editor',
        element: <XMLXSDEditor />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);
