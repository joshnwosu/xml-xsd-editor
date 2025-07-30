// import { useState, useEffect, useRef } from 'react';
// import { EditorState } from 'prosemirror-state';
// import { EditorView } from 'prosemirror-view';
// import { Schema, DOMParser as ProseMirrorDOMParser } from 'prosemirror-model';
// import { schema } from 'prosemirror-schema-basic';
// import { addListNodes } from 'prosemirror-schema-list';
// import { exampleSetup } from 'prosemirror-example-setup';
// import { Upload, FileText, Code, AlertCircle, CheckCircle } from 'lucide-react';
// import Prism from 'prismjs';
// import 'prismjs/themes/prism.css';
// import { Document, Page, pdfjs } from 'react-pdf';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';
// import { jsPDF } from 'jspdf';
// import './style.css';

// // Set up the pdfjs worker
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// interface FileUploadProps {
//   onFileUpload: (content: string, type: 'xml' | 'xsd') => void;
//   accept: string;
//   type: 'xml' | 'xsd';
//   label: string;
// }

// const FileUpload: React.FC<FileUploadProps> = ({
//   onFileUpload,
//   accept,
//   type,
//   label,
// }) => {
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       try {
//         const content = await file.text();
//         onFileUpload(content, type);
//       } catch (error) {
//         console.error(`Error reading ${type.toUpperCase()} file:`, error);
//       }
//     }
//   };

//   return (
//     <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-gray-50'>
//       <input
//         ref={fileInputRef}
//         type='file'
//         accept={accept}
//         onChange={handleFileChange}
//         className='hidden'
//       />
//       <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
//       <p className='text-sm text-gray-600 mb-2'>{label}</p>
//       <button
//         onClick={() => fileInputRef.current?.click()}
//         className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
//       >
//         Choose File
//       </button>
//     </div>
//   );
// };

// const XMLDocumentPreview: React.FC = () => {
//   const [xmlContent, setXmlContent] = useState<string>('');
//   const [xsdContent, setXsdContent] = useState<string>('');
//   const [parsedXml, setParsedXml] = useState<Document | null>(null);
//   const [validationResult, setValidationResult] = useState<{
//     isValid: boolean;
//     errors: string[];
//   } | null>(null);
//   const [activeTab, setActiveTab] = useState<
//     'pdf' | 'xml' | 'xsd' | 'validation'
//   >('pdf');
//   const [pdfFile, setPdfFile] = useState<string | null>(null);
//   const [numPages, setNumPages] = useState<number | null>(null);
//   const [pdfLoading, setPdfLoading] = useState<boolean>(false);

//   const editorRef = useRef<HTMLDivElement>(null);
//   const editorViewRef = useRef<EditorView | null>(null);
//   const wysiwygEditorRef = useRef<HTMLDivElement>(null);
//   const wysiwygEditorViewRef = useRef<EditorView | null>(null);

//   // Enhanced schema with code block support
//   const mySchema = new Schema({
//     nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
//     marks: schema.spec.marks,
//   });

//   const parseXML = (xmlString: string): Document | null => {
//     try {
//       const parser = new window.DOMParser();
//       const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

//       const parserError = xmlDoc.querySelector('parsererror');
//       if (parserError) {
//         console.error('XML parsing error:', parserError.textContent);
//         return null;
//       }

//       return xmlDoc;
//     } catch (error) {
//       console.error('Error parsing XML:', error);
//       return null;
//     }
//   };

//   const validateXMLWithXSD = (
//     xml: string,
//     xsd: string
//   ): { isValid: boolean; errors: string[] } => {
//     const errors: string[] = [];

//     try {
//       const xmlDoc = parseXML(xml);
//       if (!xmlDoc) {
//         errors.push('Invalid XML structure');
//         return { isValid: false, errors };
//       }

//       if (xsd) {
//         const xsdDoc = parseXML(xsd);
//         if (!xsdDoc) {
//           errors.push('Invalid XSD structure');
//         } else {
//           console.log('XSD validation would be performed here');
//         }
//       }

//       return { isValid: errors.length === 0, errors };
//     } catch (error) {
//       errors.push(
//         `Validation error: ${
//           error instanceof Error ? error.message : 'Unknown error'
//         }`
//       );
//       return { isValid: false, errors };
//     }
//   };

//   const formatXMLForDisplay = (xmlString: string): string => {
//     try {
//       const parser = new window.DOMParser();
//       const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
//       const serializer = new XMLSerializer();

//       let formatted = serializer.serializeToString(xmlDoc);
//       formatted = formatted.replace(/></g, '>\n<');
//       const lines = formatted.split('\n');
//       let indentLevel = 0;
//       const indentedLines = lines.map((line) => {
//         const trimmed = line.trim();
//         if (trimmed.startsWith('</')) {
//           indentLevel = Math.max(0, indentLevel - 1);
//         }
//         const indented = '  '.repeat(indentLevel) + trimmed;
//         if (
//           trimmed.startsWith('<') &&
//           !trimmed.startsWith('</') &&
//           !trimmed.endsWith('/>')
//         ) {
//           indentLevel++;
//         }
//         return indented;
//       });

//       return indentedLines.join('\n');
//     } catch (error) {
//       return xmlString;
//     }
//   };

//   const convertXmlToPdf = async (xml: string): Promise<string | null> => {
//     try {
//       setPdfLoading(true);
//       const doc = new jsPDF();
//       const formattedXml = formatXMLForDisplay(xml);
//       doc.setFontSize(10);
//       // Split text to fit within page margins
//       const lines = doc.splitTextToSize(formattedXml, 180); // 180mm width with 10mm margins
//       doc.text(lines, 10, 10);
//       const pdfDataUri = doc.output('datauristring');
//       return pdfDataUri;
//     } catch (error) {
//       console.error('Error converting XML to PDF:', error);
//       return null;
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const initializeProseMirror = () => {
//     if (editorRef.current && !editorViewRef.current) {
//       const state = EditorState.create({
//         schema: mySchema,
//         plugins: exampleSetup({ schema: mySchema, menuBar: false }),
//       });

//       editorViewRef.current = new EditorView(editorRef.current, {
//         state,
//         editable: () => false,
//       });
//     }
//   };

//   const initializeWYSIWYGEditor = () => {
//     if (wysiwygEditorRef.current && !wysiwygEditorViewRef.current) {
//       const state = EditorState.create({
//         schema: mySchema,
//         plugins: exampleSetup({ schema: mySchema, menuBar: true }),
//       });

//       wysiwygEditorViewRef.current = new EditorView(wysiwygEditorRef.current, {
//         state,
//         editable: () => true,
//         handleDOMEvents: {
//           input: (view) => {
//             const doc = view.state.doc;
//             const serializer = ProseMirrorDOMParser.fromSchema(mySchema);
//             const content = doc.textBetween(0, doc.content.size, '\n');
//             setXmlContent(content);
//             return true;
//           },
//         },
//       });
//     }
//   };

//   const updateProseMirrorContent = (content: string) => {
//     if (editorViewRef.current) {
//       const formattedXml = formatXMLForDisplay(content);
//       const div = document.createElement('div');
//       div.innerHTML = `<pre><code>${formattedXml
//         .replace(/</g, '&lt;')
//         .replace(/>/g, '&gt;')}</code></pre>`;

//       const doc = ProseMirrorDOMParser.fromSchema(mySchema).parse(div);
//       const newState = EditorState.create({
//         doc,
//         schema: mySchema,
//         plugins: exampleSetup({ schema: mySchema, menuBar: false }),
//       });

//       editorViewRef.current.updateState(newState);
//     }
//   };

//   const updateWYSIWYGEditorContent = (content: string) => {
//     if (wysiwygEditorViewRef.current) {
//       const formattedXml = formatXMLForDisplay(content);
//       const div = document.createElement('div');
//       div.innerHTML = `<pre><code>${formattedXml
//         .replace(/</g, '&lt;')
//         .replace(/>/g, '&gt;')}</code></pre>`;

//       const doc = ProseMirrorDOMParser.fromSchema(mySchema).parse(div);
//       const newState = EditorState.create({
//         doc,
//         schema: mySchema,
//         plugins: exampleSetup({ schema: mySchema, menuBar: true }),
//       });

//       wysiwygEditorViewRef.current.updateState(newState);
//     }
//   };

//   useEffect(() => {
//     initializeProseMirror();
//     initializeWYSIWYGEditor();

//     return () => {
//       if (editorViewRef.current) {
//         editorViewRef.current.destroy();
//         editorViewRef.current = null;
//       }
//       if (wysiwygEditorViewRef.current) {
//         wysiwygEditorViewRef.current.destroy();
//         wysiwygEditorViewRef.current = null;
//       }
//     };
//   }, []);

//   useEffect(() => {
//     if (xmlContent) {
//       const parsed = parseXML(xmlContent);
//       setParsedXml(parsed);
//       updateProseMirrorContent(xmlContent);
//       updateWYSIWYGEditorContent(xmlContent);

//       if (xsdContent) {
//         const validation = validateXMLWithXSD(xmlContent, xsdContent);
//         setValidationResult(validation);
//       }

//       convertXmlToPdf(xmlContent).then((pdfUrl) => {
//         setPdfFile(pdfUrl);
//       });
//     } else {
//       setPdfFile(null);
//       setNumPages(null);
//     }
//   }, [xmlContent, xsdContent]);

//   useEffect(() => {
//     if (xmlContent) {
//       Prism.highlightAll();
//     }
//   }, [xmlContent, xsdContent, activeTab]);

//   const handleFileUpload = (content: string, type: 'xml' | 'xsd') => {
//     if (type === 'xml') {
//       setXmlContent(content);
//     } else {
//       setXsdContent(content);
//     }
//   };

//   const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
//     setNumPages(numPages);
//   };

//   const renderTreeView = (
//     node: Element | Document,
//     level: number = 0
//   ): React.ReactNode => {
//     if (node instanceof Document) {
//       return node.documentElement
//         ? renderTreeView(node.documentElement, level)
//         : null;
//     }

//     const children = Array.from(node.children);
//     const hasAttributes = node.attributes && node.attributes.length > 0;
//     const hasText =
//       node.textContent && node.textContent.trim() && children.length === 0;

//     return (
//       <div key={`${node.tagName}-${level}`} className='ml-4'>
//         <div className='flex items-center py-1'>
//           <Code className='h-4 w-4 mr-2 text-blue-600 flex-shrink-0' />
//           <span className='font-mono text-sm'>
//             <span className='text-blue-600'>&lt;{node.tagName}</span>
//             {hasAttributes && (
//               <span className='text-green-600'>
//                 {Array.from(node.attributes)
//                   .map((attr) => ` ${attr.name}="${attr.value}"`)
//                   .join('')}
//               </span>
//             )}
//             <span className='text-blue-600'>&gt;</span>
//             {hasText && (
//               <span className='text-gray-800 ml-2'>
//                 {node.textContent?.trim()}
//               </span>
//             )}
//           </span>
//         </div>
//         {children.length > 0 && (
//           <div className='ml-4'>
//             {children.map((child, index) => renderTreeView(child, level + 1))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className='max-w-7xl mx-auto p-6 bg-gray-100 min-h-screen'>
//       <h1 className='text-3xl font-bold text-gray-900 mb-8 text-center'>
//         XML Document Editor and Preview
//       </h1>

//       <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
//         {/* Document Preview Section */}
//         <div className='bg-white rounded-lg shadow-lg p-6'>
//           <h2 className='text-xl font-semibold text-gray-900 mb-4'>
//             Document Preview
//           </h2>

//           {/* File Upload Section */}
//           <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
//             <FileUpload
//               onFileUpload={handleFileUpload}
//               accept='.xml,text/xml'
//               type='xml'
//               label='Upload XML Document'
//             />
//             <FileUpload
//               onFileUpload={handleFileUpload}
//               accept='.xsd,text/xml'
//               type='xsd'
//               label='Upload XSD Schema (Optional)'
//             />
//           </div>

//           {/* Status Indicators */}
//           {(xmlContent || xsdContent) && (
//             <div className='flex gap-4 mb-6'>
//               {xmlContent && (
//                 <div className='flex items-center text-green-600'>
//                   <CheckCircle className='h-5 w-5 mr-2' />
//                   <span className='text-sm'>XML Loaded</span>
//                 </div>
//               )}
//               {xsdContent && (
//                 <div className='flex items-center text-green-600'>
//                   <CheckCircle className='h-5 w-5 mr-2' />
//                   <span className='text-sm'>XSD Loaded</span>
//                 </div>
//               )}
//               {validationResult && (
//                 <div
//                   className={`flex items-center ${
//                     validationResult.isValid ? 'text-green-600' : 'text-red-600'
//                   }`}
//                 >
//                   {validationResult.isValid ? (
//                     <CheckCircle className='h-5 w-5 mr-2' />
//                   ) : (
//                     <AlertCircle className='h-5 w-5 mr-2' />
//                   )}
//                   <span className='text-sm'>
//                     {validationResult.isValid
//                       ? 'Valid XML'
//                       : 'Validation Issues'}
//                   </span>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Content Display */}
//           {xmlContent && (
//             <div className='bg-gray-50 rounded-lg overflow-hidden'>
//               {/* Tab Navigation */}
//               <div className='border-b border-gray-200'>
//                 <nav className='flex space-x-8 px-6'>
//                   {['pdf', 'xml', 'xsd', 'validation'].map((tab) => (
//                     <button
//                       key={tab}
//                       onClick={() => setActiveTab(tab as typeof activeTab)}
//                       className={`py-4 px-1 border-b-2 font-medium text-sm ${
//                         activeTab === tab
//                           ? 'border-blue-600 text-blue-600'
//                           : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                       }`}
//                     >
//                       {tab.charAt(0).toUpperCase() + tab.slice(1)}
//                     </button>
//                   ))}
//                 </nav>
//               </div>

//               {/* Tab Content */}
//               <div className='p-6'>
//                 {activeTab === 'pdf' && (
//                   <div className='space-y-4'>
//                     <h3 className='text-lg font-semibold text-gray-900'>
//                       PDF Preview
//                     </h3>
//                     <div className='bg-white rounded border p-4 max-h-96 overflow-y-auto'>
//                       {pdfLoading ? (
//                         <p className='text-gray-600'>Generating PDF...</p>
//                       ) : pdfFile ? (
//                         <Document
//                           file={pdfFile}
//                           onLoadSuccess={onDocumentLoadSuccess}
//                           onLoadError={(error) =>
//                             console.error('PDF loading error:', error)
//                           }
//                         >
//                           {Array.from(new Array(numPages), (el, index) => (
//                             <Page
//                               key={`page_${index + 1}`}
//                               pageNumber={index + 1}
//                               scale={1.0}
//                               renderTextLayer={true}
//                               renderAnnotationLayer={true}
//                             />
//                           ))}
//                         </Document>
//                       ) : (
//                         <p className='text-red-600'>
//                           Failed to generate PDF preview
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {activeTab === 'xml' && (
//                   <div className='space-y-4'>
//                     <h3 className='text-lg font-semibold text-gray-900'>
//                       XML Content
//                     </h3>
//                     <pre className='bg-white rounded border p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto'>
//                       <code className='language-xml'>
//                         {formatXMLForDisplay(xmlContent)}
//                       </code>
//                     </pre>
//                     <h3 className='text-lg font-semibold text-gray-900 mt-4'>
//                       Document Structure
//                     </h3>
//                     {parsedXml ? (
//                       <div className='bg-white rounded border p-4 max-h-96 overflow-y-auto'>
//                         {renderTreeView(parsedXml)}
//                       </div>
//                     ) : (
//                       <div className='text-red-600'>
//                         Failed to parse XML document
//                       </div>
//                     )}
//                     <h3 className='text-lg font-semibold text-gray-900 mt-4'>
//                       Formatted Content
//                     </h3>
//                     <div
//                       ref={editorRef}
//                       className='bg-white rounded border p-4 max-h-96 overflow-y-auto prose-sm'
//                       style={{ minHeight: '200px' }}
//                     />
//                   </div>
//                 )}

//                 {activeTab === 'xsd' && (
//                   <div className='space-y-4'>
//                     <h3 className='text-lg font-semibold text-gray-900'>
//                       XSD Schema
//                     </h3>
//                     {xsdContent ? (
//                       <pre className='bg-white rounded border p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto'>
//                         <code className='language-xml'>
//                           {formatXMLForDisplay(xsdContent)}
//                         </code>
//                       </pre>
//                     ) : (
//                       <div className='text-gray-600'>
//                         No XSD schema uploaded
//                       </div>
//                     )}
//                   </div>
//                 )}

//                 {activeTab === 'validation' && (
//                   <div className='space-y-4'>
//                     <h3 className='text-lg font-semibold text-gray-900'>
//                       Validation Results
//                     </h3>
//                     {validationResult ? (
//                       <div className='space-y-3'>
//                         <div
//                           className={`p-4 rounded-md ${
//                             validationResult.isValid
//                               ? 'bg-green-50 border border-green-200'
//                               : 'bg-red-50 border border-red-200'
//                           }`}
//                         >
//                           <div className='flex items-center'>
//                             {validationResult.isValid ? (
//                               <CheckCircle className='h-5 w-5 text-green-600 mr-2' />
//                             ) : (
//                               <AlertCircle className='h-5 w-5 text-red-600 mr-2' />
//                             )}
//                             <span
//                               className={`font-medium ${
//                                 validationResult.isValid
//                                   ? 'text-green-800'
//                                   : 'text-red-800'
//                               }`}
//                             >
//                               {validationResult.isValid
//                                 ? 'Document is valid'
//                                 : 'Validation failed'}
//                             </span>
//                           </div>
//                           {validationResult.errors.length > 0 && (
//                             <ul className='mt-3 list-disc list-inside text-red-700 space-y-1'>
//                               {validationResult.errors.map((error, index) => (
//                                 <li key={index} className='text-sm'>
//                                   {error}
//                                 </li>
//                               ))}
//                             </ul>
//                           )}
//                         </div>
//                       </div>
//                     ) : (
//                       <div className='text-gray-600'>
//                         {xsdContent
//                           ? 'Upload an XML document to see validation results'
//                           : 'Upload both XML and XSD files for validation'}
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}

//           {!xmlContent && (
//             <div className='text-center py-12 text-gray-500'>
//               <FileText className='mx-auto h-16 w-16 text-gray-300 mb-4' />
//               <p className='text-lg'>Upload an XML document to get started</p>
//             </div>
//           )}
//         </div>

//         {/* WYSIWYG Editor Section */}
//         <div className='bg-white rounded-lg shadow-lg p-6'>
//           <h2 className='text-xl font-semibold text-gray-900 mb-4'>
//             WYSIWYG XML Editor
//           </h2>
//           <div
//             ref={wysiwygEditorRef}
//             className='bg-white rounded border p-4 max-h-[600px] overflow-y-auto prose-sm'
//             style={{ minHeight: '300px' }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default XMLDocumentPreview;
