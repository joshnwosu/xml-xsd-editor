import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  FileText,
  Code,
  Eye,
  Settings,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface FileData {
  name: string;
  content: string;
  type: 'xml' | 'xsd';
}

const XMLXSDConverter: React.FC = () => {
  const [xmlFile, setXmlFile] = useState<FileData | null>(null);
  const [xsdFile, setXsdFile] = useState<FileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<'word' | 'html' | 'pdf'>(
    'word'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'upload' | 'preview' | 'convert'>(
    'upload'
  );

  const xmlInputRef = useRef<HTMLInputElement>(null);
  const xsdInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'xml' | 'xsd'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileData: FileData = {
        name: file.name,
        content: content,
        type: type,
      };

      if (type === 'xml') {
        setXmlFile(fileData);
        generatePreview(content);
      } else {
        setXsdFile(fileData);
      }

      // Basic validation
      validateXML(content, type);
    };
    reader.readAsText(file);
  };

  const validateXML = (content: string, type: 'xml' | 'xsd') => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      const parserError = doc.querySelector('parsererror');

      if (parserError) {
        setValidationResult({
          valid: false,
          message: `Invalid ${type.toUpperCase()}: ${parserError.textContent}`,
        });
      } else {
        setValidationResult({
          valid: true,
          message: `Valid ${type.toUpperCase()} file loaded successfully`,
        });
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: `Error parsing ${type.toUpperCase()}: ${error}`,
      });
    }
  };

  const generatePreview = (xmlContent: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'application/xml');

      // Simple transformation to HTML for preview
      let html = '<div class="xml-preview">';

      const processNode = (node: Element, level: number = 0): string => {
        const indent = '  '.repeat(level);
        let result = '';

        if (node.nodeType === Node.ELEMENT_NODE) {
          result += `${indent}<div class="xml-element">`;
          result += `<span class="xml-tag">&lt;${node.tagName}</span>`;

          // Add attributes
          if (node.attributes.length > 0) {
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              result += ` <span class="xml-attr">${attr.name}="${attr.value}"</span>`;
            }
          }
          result += '<span class="xml-tag">&gt;</span>';

          // Add text content or child elements
          if (
            node.textContent &&
            node.textContent.trim() &&
            node.children.length === 0
          ) {
            result += `<span class="xml-text">${node.textContent.trim()}</span>`;
          } else {
            result += '<div class="xml-children">';
            Array.from(node.children).forEach((child) => {
              result += processNode(child as Element, level + 1);
            });
            result += '</div>';
          }

          result += `<span class="xml-tag">&lt;/${node.tagName}&gt;</span>`;
          result += '</div>';
        }

        return result;
      };

      if (doc.documentElement) {
        html += processNode(doc.documentElement);
      }
      html += '</div>';

      setPreviewContent(html);
    } catch (error) {
      setPreviewContent('<div class="error">Error generating preview</div>');
    }
  };

  const handleConvert = async () => {
    if (!xmlFile) {
      alert('Please upload an XML file first');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate conversion process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (outputFormat === 'word') {
        // Generate Word-compatible HTML
        const wordHTML = generateWordCompatibleHTML(xmlFile.content);
        downloadWordDocument(wordHTML, xmlFile.name);
      } else if (outputFormat === 'html') {
        downloadHTMLDocument(previewContent, xmlFile.name);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error during conversion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateWordCompatibleHTML = (xmlContent: string): string => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>XML Document</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 1in; }
        .xml-element { margin: 8px 0; }
        .xml-tag { color: #0066cc; font-weight: bold; }
        .xml-attr { color: #cc6600; }
        .xml-text { color: #000; margin-left: 20px; }
        .xml-children { margin-left: 20px; }
        h1 { color: #333; border-bottom: 2px solid #333; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
    </style>
</head>
<body>
    <h1>XML Document Structure</h1>
    ${previewContent}
    
    <h2>Raw XML Content</h2>
    <pre style="background: #f5f5f5; padding: 15px; border: 1px solid #ddd; font-size: 12px; overflow-x: auto;">
${xmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </pre>
</body>
</html>`;
  };

  const downloadWordDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.xml', '')}_converted.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHTMLDocument = (content: string, filename: string) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>XML Preview</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .xml-element { margin: 4px 0; }
        .xml-tag { color: #0066cc; font-weight: bold; }
        .xml-attr { color: #cc6600; }
        .xml-text { color: #000; margin-left: 20px; }
        .xml-children { margin-left: 20px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.xml', '')}_preview.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-800 mb-2'>
            XML/XSD Document Converter
          </h1>
          <p className='text-gray-600'>
            Convert XML documents to Word, HTML, and other formats
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className='flex justify-center mb-6'>
          <div className='bg-white rounded-lg p-1 shadow-lg'>
            {['upload', 'preview', 'convert'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className='grid md:grid-cols-2 gap-6 mb-6'>
            {/* XML Upload */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <div className='flex items-center mb-4'>
                <FileText className='w-6 h-6 text-blue-500 mr-2' />
                <h3 className='text-xl font-semibold'>Upload XML File</h3>
              </div>

              <div
                onClick={() => xmlInputRef.current?.click()}
                className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors'
              >
                <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 mb-2'>
                  {xmlFile ? xmlFile.name : 'Click to upload XML file'}
                </p>
                <p className='text-sm text-gray-400'>Supports .xml files</p>
              </div>

              <input
                ref={xmlInputRef}
                type='file'
                accept='.xml'
                onChange={(e) => handleFileUpload(e, 'xml')}
                className='hidden'
              />

              {xmlFile && (
                <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center'>
                    <Check className='w-5 h-5 text-green-500 mr-2' />
                    <span className='text-green-700'>
                      XML file loaded successfully
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* XSD Upload */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <div className='flex items-center mb-4'>
                <Code className='w-6 h-6 text-purple-500 mr-2' />
                <h3 className='text-xl font-semibold'>
                  Upload XSD Schema (Optional)
                </h3>
              </div>

              <div
                onClick={() => xsdInputRef.current?.click()}
                className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors'
              >
                <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 mb-2'>
                  {xsdFile ? xsdFile.name : 'Click to upload XSD schema'}
                </p>
                <p className='text-sm text-gray-400'>Supports .xsd files</p>
              </div>

              <input
                ref={xsdInputRef}
                type='file'
                accept='.xsd'
                onChange={(e) => handleFileUpload(e, 'xsd')}
                className='hidden'
              />

              {xsdFile && (
                <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center'>
                    <Check className='w-5 h-5 text-green-500 mr-2' />
                    <span className='text-green-700'>
                      XSD schema loaded successfully
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center mb-4'>
              <Eye className='w-6 h-6 text-green-500 mr-2' />
              <h3 className='text-xl font-semibold'>XML Preview</h3>
            </div>

            {xmlFile ? (
              <div className='border rounded-lg p-4 max-h-96 overflow-auto bg-gray-50'>
                <style>{`
                  .xml-element { margin: 4px 0; }
                  .xml-tag { color: #0066cc; font-weight: bold; }
                  .xml-attr { color: #cc6600; }
                  .xml-text { color: #000; margin-left: 20px; }
                  .xml-children { margin-left: 20px; }
                `}</style>
                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
              </div>
            ) : (
              <div className='text-center py-12 text-gray-500'>
                <AlertCircle className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                <p>
                  No XML file uploaded yet. Please upload a file to see the
                  preview.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Convert Tab */}
        {activeTab === 'convert' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center mb-6'>
              <Settings className='w-6 h-6 text-orange-500 mr-2' />
              <h3 className='text-xl font-semibold'>Conversion Settings</h3>
            </div>

            <div className='grid md:grid-cols-2 gap-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-3'>
                  Output Format
                </label>
                <div className='space-y-3'>
                  {[
                    {
                      value: 'word',
                      label: 'Microsoft Word (.doc)',
                      icon: FileText,
                    },
                    {
                      value: 'html',
                      label: 'HTML Document (.html)',
                      icon: Code,
                    },
                  ].map(({ value, label, icon: Icon }) => (
                    <div key={value} className='flex items-center'>
                      <input
                        type='radio'
                        id={value}
                        name='outputFormat'
                        value={value}
                        checked={outputFormat === value}
                        onChange={(e) => setOutputFormat(e.target.value as any)}
                        className='w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500'
                      />
                      <label
                        htmlFor={value}
                        className='ml-3 flex items-center cursor-pointer'
                      >
                        <Icon className='w-4 h-4 mr-2 text-gray-500' />
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className='text-sm font-medium text-gray-700 mb-3'>
                  Conversion Options
                </h4>
                <div className='space-y-3'>
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      id='includeSchema'
                      className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                    />
                    <label
                      htmlFor='includeSchema'
                      className='ml-3 text-sm text-gray-700'
                    >
                      Include XSD schema information
                    </label>
                  </div>
                  <div className='flex items-center'>
                    <input
                      type='checkbox'
                      id='formatOutput'
                      defaultChecked
                      className='w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500'
                    />
                    <label
                      htmlFor='formatOutput'
                      className='ml-3 text-sm text-gray-700'
                    >
                      Format output for readability
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-center mt-8'>
              <button
                onClick={handleConvert}
                disabled={!xmlFile || isProcessing}
                className='flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg'
              >
                {isProcessing ? (
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                ) : (
                  <Download className='w-5 h-5 mr-2' />
                )}
                {isProcessing ? 'Converting...' : 'Convert & Download'}
              </button>
            </div>
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              validationResult.valid
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className='flex items-center'>
              {validationResult.valid ? (
                <Check className='w-5 h-5 text-green-500 mr-2' />
              ) : (
                <X className='w-5 h-5 text-red-500 mr-2' />
              )}
              <span
                className={
                  validationResult.valid ? 'text-green-700' : 'text-red-700'
                }
              >
                {validationResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className='text-center text-gray-500 text-sm'>
          <p>Supported formats: XML, XSD • Output formats: Word, HTML</p>
        </div>
      </div>
    </div>
  );
};

export default XMLXSDConverter;
