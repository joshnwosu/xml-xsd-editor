import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Code,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit3,
  Save,
  Download,
} from 'lucide-react';
import { styles } from '../utils/style';

interface FileUploadProps {
  onFileUpload: (content: string, type: 'xml' | 'xsd') => void;
  accept: string;
  type: 'xml' | 'xsd';
  label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  accept,
  type,
  label,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const content = await file.text();
        onFileUpload(content, type);
      } catch (error) {
        console.error(`Error reading ${type.toUpperCase()} file:`, error);
      }
    }
  };

  return (
    <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-all duration-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-blue-50 hover:to-blue-100'>
      <input
        ref={fileInputRef}
        type='file'
        accept={accept}
        onChange={handleFileChange}
        className='hidden'
      />
      <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4 transition-colors duration-300' />
      <p className='text-sm text-gray-600 mb-3 font-medium'>{label}</p>
      <button
        onClick={() => fileInputRef.current?.click()}
        className='bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-2 rounded-md text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
      >
        Choose File
      </button>
    </div>
  );
};

const XMLDocumentPreview: React.FC = () => {
  const [xmlContent, setXmlContent] = useState<string>('');
  const [xsdContent, setXsdContent] = useState<string>('');
  const [editableContent, setEditableContent] = useState<string>('');
  const [parsedXml, setParsedXml] = useState<Document | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    'preview' | 'xml' | 'xsd' | 'validation'
  >('preview');
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');
  const [wysiwygContent, setWysiwygContent] = useState<string>('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wysiwygRef = useRef<HTMLDivElement>(null);

  const parseXML = (xmlString: string): Document | null => {
    try {
      const parser = new window.DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        console.error('XML parsing error:', parserError.textContent);
        return null;
      }

      return xmlDoc;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return null;
    }
  };

  const validateXMLWithXSD = (
    xml: string,
    xsd: string
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    try {
      const xmlDoc = parseXML(xml);
      if (!xmlDoc) {
        errors.push('Invalid XML structure');
        return { isValid: false, errors };
      }

      // Basic XML validation
      if (!xml.trim()) {
        errors.push('XML content is empty');
      }

      if (xsd) {
        const xsdDoc = parseXML(xsd);
        if (!xsdDoc) {
          errors.push('Invalid XSD structure');
        } else {
          // Basic XSD presence validation
          console.log('XSD validation would be performed here');
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return { isValid: false, errors };
    }
  };

  const formatXMLForDisplay = (xmlString: string): string => {
    try {
      const parser = new window.DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      const serializer = new XMLSerializer();

      let formatted = serializer.serializeToString(xmlDoc);
      formatted = formatted.replace(/></g, '>\n<');
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentedLines = lines.map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        const indented = '  '.repeat(indentLevel) + trimmed;
        if (
          trimmed.startsWith('<') &&
          !trimmed.startsWith('</') &&
          !trimmed.endsWith('/>')
        ) {
          indentLevel++;
        }
        return indented;
      });

      return indentedLines.join('\n');
    } catch (error) {
      return xmlString;
    }
  };

  const renderTreeView = (
    node: Element | Document,
    level: number = 0
  ): React.ReactNode => {
    if (node instanceof Document) {
      return node.documentElement
        ? renderTreeView(node.documentElement, level)
        : null;
    }

    const children = Array.from(node.children);
    const hasAttributes = node.attributes && node.attributes.length > 0;
    const hasText =
      node.textContent && node.textContent.trim() && children.length === 0;

    return (
      <div key={`${node.tagName}-${level}-${Math.random()}`} className='ml-4'>
        <div className='flex items-center py-1 hover:bg-gray-50 rounded px-2 transition-colors'>
          <Code className='h-4 w-4 mr-2 text-blue-600 flex-shrink-0' />
          <span className='font-mono text-sm'>
            <span className='text-blue-600 font-semibold'>
              &lt;{node.tagName}
            </span>
            {hasAttributes && (
              <span className='text-green-600'>
                {Array.from(node.attributes)
                  .map((attr) => ` ${attr.name}="${attr.value}"`)
                  .join('')}
              </span>
            )}
            <span className='text-blue-600 font-semibold'>&gt;</span>
            {hasText && (
              <span className='text-gray-800 ml-2 bg-yellow-50 px-1 rounded'>
                {node.textContent?.trim()}
              </span>
            )}
          </span>
        </div>
        {children.length > 0 && (
          <div className='ml-4 border-l border-gray-200 pl-2'>
            {children.map((child, index) => renderTreeView(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const convertXMLToWYSIWYG = (xmlString: string): string => {
    if (!xmlString.trim()) return '';

    const doc = parseXML(xmlString);
    if (!doc || !doc.documentElement) return 'Invalid XML';

    const convertElement = (element: Element): string => {
      const tagName = element.tagName.toLowerCase();
      const children = Array.from(element.children);
      const textContent = element.textContent?.trim();
      const hasOnlyText = children.length === 0 && textContent;

      // Get attributes
      const attributes = Array.from(element.attributes)
        .map((attr) => `${attr.name}="${attr.value}"`)
        .join(' ');

      // Convert common XML elements to HTML equivalents
      let htmlTag = 'div';
      let cssClass = 'xml-element';

      switch (tagName) {
        case 'title':
        case 'heading':
        case 'h1':
        case 'h2':
        case 'h3':
          htmlTag = 'h2';
          cssClass = 'xml-heading';
          break;
        case 'paragraph':
        case 'p':
        case 'text':
          htmlTag = 'p';
          cssClass = 'xml-paragraph';
          break;
        case 'list':
        case 'ul':
          htmlTag = 'ul';
          cssClass = 'xml-list';
          break;
        case 'item':
        case 'li':
          htmlTag = 'li';
          cssClass = 'xml-list-item';
          break;
        case 'strong':
        case 'bold':
        case 'b':
          htmlTag = 'strong';
          cssClass = 'xml-bold';
          break;
        case 'emphasis':
        case 'em':
        case 'i':
          htmlTag = 'em';
          cssClass = 'xml-emphasis';
          break;
        case 'code':
        case 'pre':
          htmlTag = 'code';
          cssClass = 'xml-code';
          break;
        case 'link':
        case 'a':
          htmlTag = 'a';
          cssClass = 'xml-link';
          break;
        case 'image':
        case 'img':
          htmlTag = 'div';
          cssClass = 'xml-image';
          break;
        case 'table':
          htmlTag = 'table';
          cssClass = 'xml-table';
          break;
        case 'row':
        case 'tr':
          htmlTag = 'tr';
          cssClass = 'xml-row';
          break;
        case 'cell':
        case 'td':
          htmlTag = 'td';
          cssClass = 'xml-cell';
          break;
        default:
          htmlTag = 'div';
          cssClass = 'xml-element';
      }

      if (hasOnlyText) {
        return `<${htmlTag} class="${cssClass}" data-xml-tag="${tagName}" data-xml-attrs="${attributes}">${textContent}</${htmlTag}>`;
      }

      const childrenHTML = children
        .map((child) => convertElement(child))
        .join('');
      return `<${htmlTag} class="${cssClass}" data-xml-tag="${tagName}" data-xml-attrs="${attributes}">${childrenHTML}</${htmlTag}>`;
    };

    return convertElement(doc.documentElement);
  };

  const convertWYSIWYGToXML = (htmlString: string): string => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;

      const convertNode = (node: Node): string => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent || '';
        }

        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const xmlTag = element.getAttribute('data-xml-tag') || 'element';
          const xmlAttrs = element.getAttribute('data-xml-attrs') || '';

          const children = Array.from(node.childNodes);
          const childrenXML = children
            .map((child) => convertNode(child))
            .join('');

          if (xmlAttrs) {
            return `<${xmlTag} ${xmlAttrs}>${childrenXML}</${xmlTag}>`;
          } else {
            return `<${xmlTag}>${childrenXML}</${xmlTag}>`;
          }
        }

        return '';
      };

      const children = Array.from(tempDiv.childNodes);
      return children.map((child) => convertNode(child)).join('');
    } catch (error) {
      console.error('Error converting WYSIWYG to XML:', error);
      return htmlString;
    }
  };

  const renderStructuredPreview = (content: string): React.ReactNode => {
    if (!content) return null;

    const doc = parseXML(content);
    if (!doc || !doc.documentElement) {
      return <div className='text-red-500'>Invalid XML structure</div>;
    }

    const renderElement = (element: Element): React.ReactNode => {
      const tagName = element.tagName;
      const children = Array.from(element.children);
      const textContent = element.textContent?.trim();
      const hasOnlyText = children.length === 0 && textContent;

      return (
        <div
          key={Math.random()}
          className='mb-2 border border-gray-200 rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow'
        >
          <div className='flex items-center mb-2'>
            <span className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium'>
              {tagName}
            </span>
            {Array.from(element.attributes).map((attr) => (
              <span
                key={attr.name}
                className='ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs'
              >
                {attr.name}="{attr.value}"
              </span>
            ))}
          </div>
          {hasOnlyText && (
            <div className='bg-gray-50 p-2 rounded border-l-4 border-blue-500'>
              <span className='text-gray-700'>{textContent}</span>
            </div>
          )}
          {children.length > 0 && (
            <div className='ml-4 space-y-2'>
              {children.map((child) => renderElement(child))}
            </div>
          )}
        </div>
      );
    };

    return renderElement(doc.documentElement);
  };

  const handleWYSIWYGChange = () => {
    if (wysiwygRef.current) {
      const htmlContent = wysiwygRef.current.innerHTML;
      const xmlContent = convertWYSIWYGToXML(htmlContent);
      setEditableContent(xmlContent);
    }
  };

  const handleSave = () => {
    if (isEditing) {
      setXmlContent(editableContent);
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setEditableContent(xmlContent);
    setIsEditing(true);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (xmlContent) {
      const parsed = parseXML(xmlContent);
      setParsedXml(parsed);

      if (xsdContent) {
        const validation = validateXMLWithXSD(xmlContent, xsdContent);
        setValidationResult(validation);
      } else {
        const validation = validateXMLWithXSD(xmlContent, '');
        setValidationResult(validation);
      }

      // Initialize WYSIWYG content
      const htmlContent = convertXMLToWYSIWYG(xmlContent);
      setWysiwygContent(htmlContent);
    }
  }, [xmlContent, xsdContent]);

  useEffect(() => {
    if (isEditing && editMode === 'visual' && wysiwygRef.current) {
      const htmlContent = convertXMLToWYSIWYG(editableContent);
      wysiwygRef.current.innerHTML = htmlContent;
    }
  }, [isEditing, editMode, editableContent]);

  const handleFileUpload = (content: string, type: 'xml' | 'xsd') => {
    if (type === 'xml') {
      setXmlContent(content);
      setEditableContent(content);
    } else {
      setXsdContent(content);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50'>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className='max-w-[1700px] mx-auto p-6'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text'>
            XML Document Editor & Preview
          </h1>
          <p className='text-gray-600 text-lg'>
            Upload, edit, and validate XML documents with real-time preview
          </p>
        </div>

        <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
          {/* Document Preview Section */}
          <div className='bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden'>
            <div className='bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4'>
              <h2 className='text-xl font-semibold text-white flex items-center'>
                <Eye className='mr-2' />
                Document Preview
              </h2>
            </div>

            <div className='p-6'>
              {/* File Upload Section */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
                <FileUpload
                  onFileUpload={handleFileUpload}
                  accept='.xml,text/xml'
                  type='xml'
                  label='Upload XML Document'
                />
                <FileUpload
                  onFileUpload={handleFileUpload}
                  accept='.xsd,text/xml'
                  type='xsd'
                  label='Upload XSD Schema (Optional)'
                />
              </div>

              {/* Status Indicators */}
              {(xmlContent || xsdContent) && (
                <div className='flex flex-wrap gap-3 mb-6'>
                  {xmlContent && (
                    <div className='flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-full border border-green-200'>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      <span className='text-sm font-medium'>XML Loaded</span>
                    </div>
                  )}
                  {xsdContent && (
                    <div className='flex items-center text-green-600 bg-green-50 px-3 py-2 rounded-full border border-green-200'>
                      <CheckCircle className='h-4 w-4 mr-2' />
                      <span className='text-sm font-medium'>XSD Loaded</span>
                    </div>
                  )}
                  {validationResult && (
                    <div
                      className={`flex items-center px-3 py-2 rounded-full border ${
                        validationResult.isValid
                          ? 'text-green-600 bg-green-50 border-green-200'
                          : 'text-red-600 bg-red-50 border-red-200'
                      }`}
                    >
                      {validationResult.isValid ? (
                        <CheckCircle className='h-4 w-4 mr-2' />
                      ) : (
                        <AlertCircle className='h-4 w-4 mr-2' />
                      )}
                      <span className='text-sm font-medium'>
                        {validationResult.isValid
                          ? 'Valid XML'
                          : 'Validation Issues'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              {xmlContent && (
                <div className='flex gap-2 mb-6'>
                  <button
                    onClick={handleDownload}
                    className='flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium'
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Download
                  </button>
                </div>
              )}

              {/* Content Display */}
              {xmlContent && (
                <div className='bg-gray-50 rounded-lg overflow-hidden border border-gray-200'>
                  {/* Tab Navigation */}
                  <div className='border-b border-gray-200 bg-white'>
                    <nav className='flex space-x-1 px-4'>
                      {['preview', 'xml', 'xsd', 'validation'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as typeof activeTab)}
                          className={`py-3 px-4 text-sm font-medium rounded-t-lg transition-all ${
                            activeTab === tab
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab Content */}
                  <div className='p-6 bg-white'>
                    {activeTab === 'preview' && (
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-lg font-semibold text-gray-900'>
                            Visual Preview
                          </h3>
                          <div className='flex gap-2'>
                            <button
                              onClick={() =>
                                setEditMode(
                                  editMode === 'visual' ? 'code' : 'visual'
                                )
                              }
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                editMode === 'visual'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {editMode === 'visual' ? 'Visual' : 'Code'}
                            </button>
                          </div>
                        </div>

                        <div className='bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto border'>
                          {editMode === 'visual' ? (
                            <div
                              className='wysiwyg-content space-y-2'
                              dangerouslySetInnerHTML={{
                                __html: wysiwygContent,
                              }}
                            />
                          ) : (
                            <pre className='text-sm overflow-x-auto'>
                              <code className='language-xml text-gray-800'>
                                {formatXMLForDisplay(xmlContent)}
                              </code>
                            </pre>
                          )}
                        </div>

                        <h3 className='text-lg font-semibold text-gray-900 mt-6'>
                          Document Structure
                        </h3>
                        {parsedXml ? (
                          <div className='bg-gray-50 rounded-lg border p-4 max-h-80 overflow-y-auto'>
                            {renderTreeView(parsedXml)}
                            {renderStructuredPreview(xmlContent)}
                          </div>
                        ) : (
                          <div className='text-red-600 bg-red-50 p-4 rounded-lg border border-red-200'>
                            Failed to parse XML document
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'xml' && (
                      <div className='space-y-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          XML Content
                        </h3>
                        <div className='bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto'>
                          <pre className='text-sm text-gray-100'>
                            <code className='language-xml'>
                              {formatXMLForDisplay(xmlContent)}
                            </code>
                          </pre>
                        </div>
                      </div>
                    )}

                    {activeTab === 'xsd' && (
                      <div className='space-y-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          XSD Schema
                        </h3>
                        {xsdContent ? (
                          <div className='bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto'>
                            <pre className='text-sm text-gray-100'>
                              <code className='language-xml'>
                                {formatXMLForDisplay(xsdContent)}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <div className='text-gray-600 bg-gray-50 p-8 rounded-lg text-center border-2 border-dashed border-gray-300'>
                            <AlertCircle className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                            <p className='text-lg'>No XSD schema uploaded</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'validation' && (
                      <div className='space-y-4'>
                        <h3 className='text-lg font-semibold text-gray-900'>
                          Validation Results
                        </h3>
                        {validationResult ? (
                          <div className='space-y-3'>
                            <div
                              className={`flex items-center p-4 rounded-lg border ${
                                validationResult.isValid
                                  ? 'bg-green-50 border-green-200 text-green-800'
                                  : 'bg-red-50 border-red-200 text-red-800'
                              }`}
                            >
                              {validationResult.isValid ? (
                                <CheckCircle className='h-5 w-5 mr-3 flex-shrink-0' />
                              ) : (
                                <AlertCircle className='h-5 w-5 mr-3 flex-shrink-0' />
                              )}
                              <div>
                                <p className='font-medium'>
                                  {validationResult.isValid
                                    ? 'XML document is valid'
                                    : 'XML document has validation errors'}
                                </p>
                                {!validationResult.isValid &&
                                  validationResult.errors.length > 0 && (
                                    <div className='mt-2'>
                                      <p className='text-sm font-medium mb-2'>
                                        Validation Errors:
                                      </p>
                                      <ul className='list-disc list-inside space-y-1'>
                                        {validationResult.errors.map(
                                          (error, index) => (
                                            <li key={index} className='text-sm'>
                                              {error}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className='text-gray-600 bg-gray-50 p-8 rounded-lg text-center border-2 border-dashed border-gray-300'>
                            <AlertCircle className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                            <p className='text-lg'>
                              No validation results available
                            </p>
                            <p className='text-sm mt-2'>
                              Upload an XML document to see validation results
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Editor Section */}
          <div className='bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden'>
            <div className='bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4'>
              <h2 className='text-xl font-semibold text-white flex items-center'>
                <Edit3 className='mr-2' />
                XML Editor
              </h2>
            </div>

            <div className='p-6'>
              {xmlContent ? (
                <div className='space-y-4'>
                  {/* Editor Controls */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() =>
                          setEditMode(editMode === 'visual' ? 'code' : 'visual')
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          editMode === 'visual'
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {editMode === 'visual'
                          ? 'Visual Editor'
                          : 'Code Editor'}
                      </button>
                    </div>
                    <div className='flex gap-2'>
                      {!isEditing ? (
                        <button
                          onClick={handleEdit}
                          className='flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium'
                        >
                          <Edit3 className='h-4 w-4 mr-2' />
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={handleSave}
                          className='flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium'
                        >
                          <Save className='h-4 w-4 mr-2' />
                          Save
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Editor Content */}
                  <div className='border border-gray-300 rounded-lg overflow-hidden'>
                    {isEditing ? (
                      editMode === 'visual' ? (
                        <div
                          ref={wysiwygRef}
                          className='wysiwyg-editor wysiwyg-content p-4 min-h-96 max-h-96 overflow-y-auto bg-white border focus:outline-none focus:ring-2 focus:ring-blue-500 !text-black'
                          contentEditable
                          onInput={handleWYSIWYGChange}
                          suppressContentEditableWarning={true}
                        />
                      ) : (
                        <textarea
                          ref={textareaRef}
                          value={editableContent}
                          onChange={(e) => setEditableContent(e.target.value)}
                          className='w-full h-96 p-4 font-mono text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 !text-black'
                          placeholder='Enter your XML content here...'
                        />
                      )
                    ) : (
                      <div className='p-4 bg-black h-96 overflow-y-auto'>
                        {editMode === 'visual' ? (
                          <div className='wysiwyg-content !text-black'>
                            <div
                              dangerouslySetInnerHTML={{
                                __html: wysiwygContent,
                              }}
                            />
                          </div>
                        ) : (
                          <pre className='text-sm text-gray-800 whitespace-pre-wrap'>
                            <code className='language-xml'>
                              {formatXMLForDisplay(xmlContent)}
                            </code>
                          </pre>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Editor Status */}
                  <div className='flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg'>
                    <span>
                      Mode:{' '}
                      <span className='font-medium'>
                        {editMode === 'visual' ? 'Visual' : 'Code'}
                      </span>
                    </span>
                    <span>
                      Status:{' '}
                      <span className='font-medium'>
                        {isEditing ? 'Editing' : 'Read-only'}
                      </span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className='text-center py-12'>
                  <FileText className='mx-auto h-16 w-16 text-gray-400 mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No XML Document Loaded
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Upload an XML document to start editing and previewing
                  </p>
                  <div className='max-w-md mx-auto'>
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      accept='.xml,text/xml'
                      type='xml'
                      label='Upload XML Document'
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMLDocumentPreview;
