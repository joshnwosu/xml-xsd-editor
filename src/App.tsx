import './App.css';
import XMLDocumentPreview from './components/xml-document-preview';
import XMLXSDConverter from './components/xml-xsd-converter';

function App() {
  return (
    <>
      {false && <XMLDocumentPreview />}
      <XMLXSDConverter />
    </>
  );
}

export default App;
