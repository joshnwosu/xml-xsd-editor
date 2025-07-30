import React, { useState, useRef, useCallback } from 'react';
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
  Edit3,
  Save,
  RotateCcw,
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
  const [activeTab, setActiveTab] = useState<
    'upload' | 'preview' | 'raw' | 'convert'
  >('upload');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [rawXmlContent, setRawXmlContent] = useState<string>('');
  const [rawXsdContent, setRawXsdContent] = useState<string>('');
  const [rawViewMode, setRawViewMode] = useState<'xml' | 'xsd'>('xml');

  const xmlInputRef = useRef<HTMLInputElement>(null);
  const xsdInputRef = useRef<HTMLInputElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);

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
        setRawXmlContent(content); // This should properly set the raw content
        generatePreview(content);
      } else {
        setXsdFile(fileData);
        setRawXsdContent(content); // This should properly set the raw content
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

  const generatePreview = useCallback((xmlContent: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'application/xml');

      // Transform XML to Word document-style HTML
      let html = '<div class="document-preview">';

      const processNode = (node: Element, level: number = 0): string => {
        let result = '';

        if (node.nodeType === Node.ELEMENT_NODE) {
          // Handle different XML elements as document components
          if (level === 0) {
            // Root element as document title
            result += `<h1 class="doc-title" data-xml-tag="${
              node.tagName
            }">${formatTagName(node.tagName)}</h1>`;
          } else if (level === 1) {
            // First level as section headers
            result += `<h2 class="doc-section" data-xml-tag="${
              node.tagName
            }">${formatTagName(node.tagName)}</h2>`;
          } else if (level === 2) {
            // Second level as subsection headers
            result += `<h3 class="doc-subsection" data-xml-tag="${
              node.tagName
            }">${formatTagName(node.tagName)}</h3>`;
          }

          // Add attributes as metadata
          if (node.attributes.length > 0) {
            result += '<div class="doc-metadata">';
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              result += `<span class="doc-attr" data-attr-name="${
                attr.name
              }" data-attr-value="${attr.value}"><strong>${formatTagName(
                attr.name
              )}:</strong> ${attr.value}</span>`;
              if (i < node.attributes.length - 1) result += ' | ';
            }
            result += '</div>';
          }

          // Handle text content
          if (
            node.textContent &&
            node.textContent.trim() &&
            node.children.length === 0
          ) {
            const text = node.textContent.trim();

            // Format different types of content with data attributes for reverse mapping
            if (isEmail(text)) {
              result += `<p class="doc-email" data-xml-tag="${node.tagName}" data-content="${text}"><strong>Email:</strong> <a href="mailto:${text}">${text}</a></p>`;
            } else if (isPhone(text)) {
              result += `<p class="doc-phone" data-xml-tag="${node.tagName}" data-content="${text}"><strong>Phone:</strong> ${text}</p>`;
            } else if (isDate(text)) {
              result += `<p class="doc-date" data-xml-tag="${
                node.tagName
              }" data-content="${text}"><strong>Date:</strong> ${formatDate(
                text
              )}</p>`;
            } else if (isNumber(text)) {
              result += `<p class="doc-number" data-xml-tag="${node.tagName}" data-content="${text}"><strong>Value:</strong> ${text}</p>`;
            } else if (text.length > 100) {
              result += `<div class="doc-paragraph" data-xml-tag="${node.tagName}" data-content="${text}">${text}</div>`;
            } else {
              result += `<p class="doc-field" data-xml-tag="${node.tagName}" data-content="${text}">${text}</p>`;
            }
          } else if (node.children.length > 0) {
            // Process child elements
            result += `<div class="doc-content" data-xml-tag="${node.tagName}">`;
            Array.from(node.children).forEach((child) => {
              result += processNode(child as Element, level + 1);
            });
            result += '</div>';
          }
        }

        return result;
      };

      if (doc.documentElement) {
        html += processNode(doc.documentElement);
      }
      html += '</div>';

      setPreviewContent(html);
      setEditableContent(html);
    } catch (error) {
      const errorContent =
        '<div class="error">Error generating document preview</div>';
      setPreviewContent(errorContent);
      setEditableContent(errorContent);
    }
  }, []);

  // Helper functions for content formatting
  const formatTagName = (tagName: string): string => {
    return tagName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const isEmail = (text: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const isPhone = (text: string): boolean => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(text.replace(/[-\s\(\)]/g, ''));
  };

  const isDate = (text: string): boolean => {
    const dateRegex = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
    return !isNaN(Date.parse(text)) && dateRegex.test(text);
  };

  const isNumber = (text: string): boolean => {
    return !isNaN(Number(text)) && text.trim() !== '';
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleEditSave = () => {
    if (!editableRef.current || !xmlFile) return;

    try {
      // Get the current HTML content
      const editedHtml = editableRef.current.innerHTML;

      // Try to reconstruct XML
      const reconstructedXml = reconstructXmlFromHtml(editedHtml);

      // Validate that we got meaningful XML content
      if (
        !reconstructedXml ||
        reconstructedXml.trim() ===
          '<?xml version="1.0" encoding="UTF-8"?>\n<dmodule></dmodule>'
      ) {
        // If reconstruction failed, keep the original XML content
        setValidationResult({
          valid: false,
          message:
            'Could not properly reconstruct XML from edited content. Original XML preserved.',
        });
        setIsEditing(false);
        return;
      }

      // Update the XML file content
      const updatedXmlFile = {
        ...xmlFile,
        content: reconstructedXml,
      };

      setXmlFile(updatedXmlFile);
      setRawXmlContent(reconstructedXml);

      // Validate the reconstructed XML
      validateXML(reconstructedXml, 'xml');

      setIsEditing(false);

      // Show success message
      setValidationResult({
        valid: true,
        message: 'XML updated successfully from edited content',
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        message: `Error updating XML: ${error}`,
      });
      setIsEditing(false);
    }
  };

  const reconstructXmlFromHtml = (html: string): string => {
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(html, 'text/html');

    const buildXmlFromElement = (element: Element): string => {
      const xmlTag = element.getAttribute('data-xml-tag');
      if (!xmlTag) return '';

      let xml = `<${xmlTag}`;

      // Add attributes if present - look for elements with data-attr-name within this element
      const attrElements = element.querySelectorAll('[data-attr-name]');
      const directAttrElements = Array.from(attrElements).filter((attrEl) => {
        // Only include attributes that are direct children of this element
        let parent = attrEl.parentElement;
        while (parent && !parent.hasAttribute('data-xml-tag')) {
          parent = parent.parentElement;
        }
        return parent === element;
      });

      directAttrElements.forEach((attrEl) => {
        const attrName = attrEl.getAttribute('data-attr-name');
        const attrValue = attrEl.getAttribute('data-attr-value');
        if (attrName && attrValue) {
          xml += ` ${attrName}="${attrValue}"`;
        }
      });

      xml += '>';

      // Handle content - check if this element has direct text content
      const contentAttr = element.getAttribute('data-content');
      if (contentAttr) {
        xml += contentAttr;
      } else {
        // Process child elements that have data-xml-tag
        const childElements = Array.from(element.children).filter((child) => {
          const hasXmlTag = child.getAttribute('data-xml-tag');
          const isNotAttribute = !child.getAttribute('data-attr-name');
          return hasXmlTag && isNotAttribute;
        });

        if (childElements.length > 0) {
          childElements.forEach((child) => {
            xml += buildXmlFromElement(child);
          });
        } else {
          // If no child elements with xml tags, extract text content
          const textContent = element.textContent?.trim();
          if (textContent && textContent !== formatTagName(xmlTag)) {
            // Remove the formatted tag name from text content
            const formattedTagName = formatTagName(xmlTag);
            let cleanText = textContent;
            if (textContent.startsWith(formattedTagName)) {
              cleanText = textContent.replace(formattedTagName, '').trim();
            }
            if (cleanText) {
              xml += cleanText;
            }
          }
        }
      }

      xml += `</${xmlTag}>`;
      return xml;
    };

    // Find the root element with data-xml-tag
    const rootElement = htmlDoc.querySelector('[data-xml-tag]');
    if (rootElement) {
      return `<?xml version="1.0" encoding="UTF-8"?>\n${buildXmlFromElement(
        rootElement
      )}`;
    }

    return '';
  };

  const handleRawContentSave = () => {
    if (rawViewMode === 'xml' && rawXmlContent) {
      if (xmlFile) {
        const updatedXmlFile = {
          ...xmlFile,
          content: rawXmlContent,
        };
        setXmlFile(updatedXmlFile);
        generatePreview(rawXmlContent);
        validateXML(rawXmlContent, 'xml');
      }
    } else if (rawViewMode === 'xsd' && rawXsdContent) {
      if (xsdFile) {
        const updatedXsdFile = {
          ...xsdFile,
          content: rawXsdContent,
        };
        setXsdFile(updatedXsdFile);
        validateXML(rawXsdContent, 'xsd');
      }
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
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word">
    <meta name="Originator" content="Microsoft Word">
    <title>XML Document</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowRevisions/>
            <w:DoNotPrintRevisions/>
            <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
            <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
            <w:UseMarginsForDrawingGridOrigin/>
            <w:ValidateAgainstSchemas/>
            <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
            <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
            <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page { margin: 1in; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6; 
            margin: 0; 
            color: #000;
        }
        .document-preview { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #333;
        }
        .doc-title { 
            font-size: 18pt; 
            font-weight: bold; 
            color: #000; 
            margin-bottom: 20px; 
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .doc-section { 
            font-size: 14pt; 
            font-weight: bold; 
            color: #000; 
            margin: 20px 0 10px 0; 
            border-left: 4px solid #000;
            padding-left: 10px;
        }
        .doc-subsection { 
            font-size: 12pt; 
            font-weight: bold; 
            color: #000; 
            margin: 15px 0 8px 0; 
        }
        .doc-metadata { 
            background: #f5f5f5; 
            padding: 8px 12px; 
            border: 1px solid #ccc; 
            margin: 8px 0;
            font-size: 10pt;
        }
        .doc-field, .doc-paragraph, .doc-email, .doc-phone, .doc-date, .doc-number { 
            margin: 8px 0; 
            font-size: 12pt;
        }
        .doc-content { 
            margin-left: 0px; 
            margin-top: 10px;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 10px 0; 
        }
        th, td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: left; 
            font-size: 10pt;
        }
        th { 
            background-color: #f0f0f0; 
            font-weight: bold;
        }
    </style>
</head>
<body>
    ${previewContent}
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
            {(['upload', 'preview', 'raw', 'convert'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

        {/* Validation Result */}
        {validationResult && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              validationResult.valid
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className='flex items-center'>
              {validationResult.valid ? (
                <Check className='w-5 h-5 mr-2' />
              ) : (
                <X className='w-5 h-5 mr-2' />
              )}
              <span>{validationResult.message}</span>
            </div>
          </div>
        )}

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
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Eye className='w-6 h-6 text-green-500 mr-2' />
                <h3 className='text-xl font-semibold'>XML Preview</h3>
              </div>

              {xmlFile && (
                <div className='flex space-x-2'>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className='flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                    >
                      <Edit3 className='w-4 h-4 mr-2' />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleEditSave}
                        className='flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
                      >
                        <Save className='w-4 h-4 mr-2' />
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditableContent(previewContent);
                        }}
                        className='flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                      >
                        <RotateCcw className='w-4 h-4 mr-2' />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {xmlFile ? (
              <div className='border rounded-lg p-6 max-h-96 overflow-auto bg-white shadow-inner'>
                <style>{`
                  .document-preview { 
                    font-family: 'Times New Roman', serif; 
                    line-height: 1.6; 
                    color: #333;
                  }
                  .doc-title { 
                    font-size: 24px; 
                    font-weight: bold; 
                    color: #2c3e50; 
                    margin-bottom: 20px; 
                    text-align: center;
                    border-bottom: 2px solid #3498db;
                    padding-bottom: 10px;
                  }
                  .doc-section { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #34495e; 
                    margin: 20px 0 10px 0; 
                    border-left: 4px solid #3498db;
                    padding-left: 10px;
                  }
                  .doc-subsection { 
                    font-size: 16px; 
                    font-weight: bold; 
                    color: #5d6d7e; 
                    margin: 15px 0 8px 0; 
                  }
                  .doc-metadata { 
                    background: #f8f9fa; 
                    padding: 8px 12px; 
                    border-radius: 4px; 
                    margin: 8px 0;
                    border-left: 3px solid #6c757d;
                    font-size: 14px;
                  }
                  .doc-attr { 
                    color: #495057; 
                    margin-right: 15px; 
                  }
                  .doc-field { 
                    margin: 8px 0; 
                    padding: 4px 0;
                  }
                  .doc-paragraph { 
                    margin: 12px 0; 
                    padding: 10px 0;
                    text-align: justify;
                  }
                  .doc-email { 
                    margin: 8px 0; 
                    padding: 6px 0;
                  }
                  .doc-email a { 
                    color: #007bff; 
                    text-decoration: none; 
                  }
                  .doc-email a:hover { 
                    text-decoration: underline; 
                  }
                  .doc-phone { 
                    margin: 8px 0; 
                    padding: 6px 0;
                    font-family: monospace;
                  }
                  .doc-date { 
                    margin: 8px 0; 
                    padding: 6px 0;
                    font-style: italic;
                  }
                  .doc-number { 
                    margin: 8px 0; 
                    padding: 6px 0;
                    font-weight: 500;
                  }
                  .doc-content { 
                    margin-left: 0px; 
                    margin-top: 10px;
                  }
                  .error { 
                    color: #dc3545; 
                    font-style: italic; 
                    text-align: center; 
                    padding: 20px;
                  }
                  [contenteditable=true] {
                    outline: 2px dashed #3498db;
                    outline-offset: 2px;
                  }
                  [contenteditable=true]:focus {
                    outline: 2px solid #2980b9;
                  }
                `}</style>
                <div
                  ref={editableRef}
                  contentEditable={isEditing}
                  dangerouslySetInnerHTML={{ __html: editableContent }}
                  onInput={(e) => {
                    if (isEditing) {
                      setEditableContent(e.currentTarget.innerHTML);
                    }
                  }}
                />
              </div>
            ) : (
              <div className='flex items-center justify-center h-32 text-gray-500'>
                <AlertCircle className='w-8 h-8 mr-2' />
                <span>
                  No XML file uploaded. Please upload an XML file to see the
                  preview.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Raw Tab */}
        {activeTab === 'raw' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Code className='w-6 h-6 text-orange-500 mr-2' />
                <h3 className='text-xl font-semibold'>Raw Content Editor</h3>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setRawViewMode('xml')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      rawViewMode === 'xml'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    XML
                  </button>
                  <button
                    onClick={() => setRawViewMode('xsd')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      rawViewMode === 'xsd'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    XSD
                  </button>
                </div>

                <button
                  onClick={handleRawContentSave}
                  className='flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Save Changes
                </button>
              </div>
            </div>

            {rawViewMode === 'xml' ? (
              <div>
                {xmlFile ? (
                  <textarea
                    value={rawXmlContent || xmlFile.content} // Add fallback to xmlFile.content
                    onChange={(e) => setRawXmlContent(e.target.value)}
                    className='w-full h-96 p-4 border rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black'
                    placeholder='XML content will appear here...'
                  />
                ) : (
                  <div className='flex items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg'>
                    <span>No XML file uploaded</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {xsdFile ? (
                  <textarea
                    value={rawXsdContent || xsdFile.content} // Add fallback to xsdFile.content
                    onChange={(e) => setRawXsdContent(e.target.value)}
                    className='w-full h-96 p-4 border rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-black'
                    placeholder='XSD content will appear here...'
                  />
                ) : (
                  <div className='flex items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg'>
                    <span>No XSD file uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Convert Tab */}
        {activeTab === 'convert' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center mb-6'>
              <Settings className='w-6 h-6 text-blue-500 mr-2' />
              <h3 className='text-xl font-semibold'>Convert & Export</h3>
            </div>

            {/* Output Format Selection */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Select Output Format
              </label>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {(['word', 'html', 'pdf'] as const).map((format) => (
                  <div
                    key={format}
                    onClick={() => setOutputFormat(format)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      outputFormat === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center'>
                      <FileText className='w-6 h-6 mr-3' />
                      <div>
                        <div className='font-medium'>
                          {format === 'word' && 'Microsoft Word'}
                          {format === 'html' && 'HTML Document'}
                          {format === 'pdf' && 'PDF Document'}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {format === 'word' && '.doc format'}
                          {format === 'html' && '.html format'}
                          {format === 'pdf' && '.pdf format (Coming Soon)'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Options */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Conversion Options
              </label>
              <div className='space-y-3'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    className='form-checkbox h-4 w-4 text-blue-600'
                    defaultChecked
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Include XML attributes as metadata
                  </span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    className='form-checkbox h-4 w-4 text-blue-600'
                    defaultChecked
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Format dates and numbers
                  </span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    className='form-checkbox h-4 w-4 text-blue-600'
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Include XSD validation information
                  </span>
                </label>
              </div>
            </div>

            {/* Convert Button */}
            <div className='flex justify-center'>
              {xmlFile ? (
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || outputFormat === 'pdf'}
                  className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
                    isProcessing || outputFormat === 'pdf'
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <Download className='w-5 h-5 mr-2' />
                      Convert to {outputFormat.toUpperCase()}
                      {outputFormat === 'pdf' && ' (Coming Soon)'}
                    </>
                  )}
                </button>
              ) : (
                <div className='text-center'>
                  <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500'>
                    Please upload an XML file first
                  </p>
                </div>
              )}
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3'></div>
                  <span className='text-blue-700'>
                    Converting XML to {outputFormat.toUpperCase()}... This may
                    take a few moments.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className='text-center text-gray-500 text-sm'>
          <p>
            © 2025 XML/XSD Document Converter. Built with React and TypeScript.
          </p>
        </div>
      </div>
    </div>
  );
};

export default XMLXSDConverter;
