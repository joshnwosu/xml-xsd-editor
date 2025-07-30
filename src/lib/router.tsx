import { createBrowserRouter } from 'react-router-dom';
import XMLXSDConverter from '../components/xml-xsd-converter';
import RootLayout from '../layout/root-layout';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <XMLXSDConverter />,
      },
    ],
  },
]);
