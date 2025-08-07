// import React, { useState, useEffect } from 'react';
// import { create } from 'zustand';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import {
//   Plus,
//   Trash2,
//   Edit,
//   Save,
//   Type,
//   List,
//   FileText,
//   Zap,
// } from 'lucide-react';

// // Types
// interface XMLAttribute {
//   name: string;
//   value: string;
// }

// interface XMLNode {
//   id: string;
//   name: string;
//   type: 'element' | 'text';
//   attributes: XMLAttribute[];
//   children: XMLNode[];
//   textContent?: string;
//   parent?: string;
// }

// interface XSDElement {
//   id: string;
//   name: string;
//   type: string;
//   minOccurs?: number;
//   maxOccurs?: number | 'unbounded';
//   enumeration?: string[];
//   restriction?: string;
// }

// interface XSDComplexType {
//   id: string;
//   name: string;
//   elements: XSDElement[];
// }

// // Zustand Store
// interface EditorStore {
//   xmlContent: string;
//   xsdContent: string;
//   parsedXML: XMLNode[];
//   parsedXSD: XSDComplexType[];
//   activeTab: 'xml' | 'xsd';
//   autoGenerateXSD: boolean;

//   setXMLContent: (content: string) => void;
//   setXSDContent: (content: string) => void;
//   setParsedXML: (nodes: XMLNode[]) => void;
//   setParsedXSD: (types: XSDComplexType[]) => void;
//   setActiveTab: (tab: 'xml' | 'xsd') => void;
//   setAutoGenerateXSD: (auto: boolean) => void;

//   addXMLNode: (parentId: string, node: Omit<XMLNode, 'id'>) => void;
//   updateXMLNode: (id: string, updates: Partial<XMLNode>) => void;
//   deleteXMLNode: (id: string) => void;

//   addXSDElement: (typeId: string, element: Omit<XSDElement, 'id'>) => void;
//   updateXSDElement: (
//     typeId: string,
//     elementId: string,
//     updates: Partial<XSDElement>
//   ) => void;
//   deleteXSDElement: (typeId: string, elementId: string) => void;
//   addXSDComplexType: (type: Omit<XSDComplexType, 'id'>) => void;
// }

// const useEditorStore = create<EditorStore>((set, get) => ({
//   xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
// <person id="1">
//   <name>John Doe</name>
//   <age>30</age>
//   <email>john@example.com</email>
//   <occupation>Frontend Developer</occupation>
// </person>`,
//   xsdContent: `<?xml version="1.0" encoding="UTF-8"?>
// <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
//   <xs:complexType name="PersonType">
//     <xs:sequence>
//       <xs:element name="name" type="xs:string"/>
//       <xs:element name="age" type="xs:int"/>
//       <xs:element name="email" type="xs:string"/>
//       <xs:element name="occupation">
//         <xs:simpleType>
//           <xs:restriction base="xs:string">
//             <xs:enumeration value="Frontend Developer"/>
//             <xs:enumeration value="Backend Developer"/>
//             <xs:enumeration value="Full Stack Developer"/>
//             <xs:enumeration value="DevOps Engineer"/>
//           </xs:restriction>
//         </xs:simpleType>
//       </xs:element>
//     </xs:sequence>
//     <xs:attribute name="id" type="xs:string"/>
//   </xs:complexType>
//   <xs:element name="person" type="PersonType"/>
// </xs:schema>`,
//   parsedXML: [],
//   parsedXSD: [],
//   activeTab: 'xml',
//   autoGenerateXSD: true,

//   setXMLContent: (content) => set({ xmlContent: content }),
//   setXSDContent: (content) => set({ xsdContent: content }),
//   setParsedXML: (nodes) => set({ parsedXML: nodes }),
//   setParsedXSD: (types) => set({ parsedXSD: types }),
//   setActiveTab: (tab) => set({ activeTab: tab }),
//   setAutoGenerateXSD: (auto) => set({ autoGenerateXSD: auto }),

//   addXMLNode: (parentId, node) => {
//     const { parsedXML } = get();
//     const newNode = { ...node, id: `node_${Date.now()}` };

//     const addToParent = (nodes: XMLNode[]): XMLNode[] => {
//       return nodes.map((n) => {
//         if (n.id === parentId) {
//           return { ...n, children: [...n.children, newNode] };
//         }
//         return { ...n, children: addToParent(n.children) };
//       });
//     };

//     if (parentId === 'root') {
//       set({ parsedXML: [...parsedXML, newNode] });
//     } else {
//       set({ parsedXML: addToParent(parsedXML) });
//     }
//   },

//   updateXMLNode: (id, updates) => {
//     const { parsedXML } = get();

//     const updateNode = (nodes: XMLNode[]): XMLNode[] => {
//       return nodes.map((n) => {
//         if (n.id === id) {
//           return { ...n, ...updates };
//         }
//         return { ...n, children: updateNode(n.children) };
//       });
//     };

//     set({ parsedXML: updateNode(parsedXML) });
//   },

//   deleteXMLNode: (id) => {
//     const { parsedXML } = get();

//     const deleteNode = (nodes: XMLNode[]): XMLNode[] => {
//       return nodes
//         .filter((n) => n.id !== id)
//         .map((n) => ({
//           ...n,
//           children: deleteNode(n.children),
//         }));
//     };

//     set({ parsedXML: deleteNode(parsedXML) });
//   },

//   addXSDElement: (typeId, element) => {
//     const { parsedXSD } = get();
//     const newElement = { ...element, id: `elem_${Date.now()}` };

//     set({
//       parsedXSD: parsedXSD.map((type) =>
//         type.id === typeId
//           ? { ...type, elements: [...type.elements, newElement] }
//           : type
//       ),
//     });
//   },

//   updateXSDElement: (typeId, elementId, updates) => {
//     const { parsedXSD } = get();

//     set({
//       parsedXSD: parsedXSD.map((type) =>
//         type.id === typeId
//           ? {
//               ...type,
//               elements: type.elements.map((elem) =>
//                 elem.id === elementId ? { ...elem, ...updates } : elem
//               ),
//             }
//           : type
//       ),
//     });
//   },

//   deleteXSDElement: (typeId, elementId) => {
//     const { parsedXSD } = get();

//     set({
//       parsedXSD: parsedXSD.map((type) =>
//         type.id === typeId
//           ? {
//               ...type,
//               elements: type.elements.filter((elem) => elem.id !== elementId),
//             }
//           : type
//       ),
//     });
//   },

//   addXSDComplexType: (type) => {
//     const { parsedXSD } = get();
//     const newType = { ...type, id: `type_${Date.now()}` };
//     set({ parsedXSD: [...parsedXSD, newType] });
//   },
// }));

// // Utility functions
// const parseXMLToNodes = (xmlString: string): XMLNode[] => {
//   try {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(xmlString, 'text/xml');

//     const convertDOMToNode = (element: Element, parentId?: string): XMLNode => {
//       const attributes: XMLAttribute[] = Array.from(element.attributes).map(
//         (attr) => ({
//           name: attr.name,
//           value: attr.value,
//         })
//       );

//       const children: XMLNode[] = [];
//       let textContent = '';

//       Array.from(element.childNodes).forEach((child) => {
//         if (child.nodeType === Node.ELEMENT_NODE) {
//           children.push(
//             convertDOMToNode(child as Element, `node_${Date.now()}`)
//           );
//         } else if (
//           child.nodeType === Node.TEXT_NODE &&
//           child.textContent?.trim()
//         ) {
//           textContent = child.textContent.trim();
//         }
//       });

//       return {
//         id: `node_${Date.now()}_${Math.random()}`,
//         name: element.tagName,
//         type: 'element',
//         attributes,
//         children,
//         textContent: textContent || undefined,
//         parent: parentId,
//       };
//     };

//     const rootElements = Array.from(doc.children).filter(
//       (child) => child.nodeType === Node.ELEMENT_NODE
//     );
//     return rootElements.map((element) => convertDOMToNode(element as Element));
//   } catch (error) {
//     console.error('XML parsing error:', error);
//     return [];
//   }
// };

// const generateXSDFromXML = (xmlNodes: XMLNode[]): XSDComplexType[] => {
//   const types: Map<string, XSDComplexType> = new Map();

//   const inferType = (value: string): string => {
//     if (!isNaN(Number(value)) && Number.isInteger(Number(value))) {
//       return 'xs:int';
//     }
//     if (!isNaN(Number(value)) && !Number.isInteger(Number(value))) {
//       return 'xs:decimal';
//     }
//     if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
//       return 'xs:boolean';
//     }
//     if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
//       return 'xs:date';
//     }
//     return 'xs:string';
//   };

//   const processNode = (node: XMLNode) => {
//     const typeName = `${
//       node.name.charAt(0).toUpperCase() + node.name.slice(1)
//     }Type`;

//     if (!types.has(typeName)) {
//       types.set(typeName, {
//         id: `type_${Date.now()}_${node.name}`,
//         name: typeName,
//         elements: [],
//       });
//     }

//     const complexType = types.get(typeName)!;

//     node.children.forEach((child) => {
//       const existingElement = complexType.elements.find(
//         (el) => el.name === child.name
//       );

//       if (!existingElement) {
//         let elementType = 'xs:string';
//         let enumeration: string[] | undefined = undefined;

//         if (child.textContent) {
//           elementType = inferType(child.textContent);
//         } else if (child.children.length > 0) {
//           elementType = `${
//             child.name.charAt(0).toUpperCase() + child.name.slice(1)
//           }Type`;
//         }

//         if (child.name === 'occupation') {
//           enumeration = [
//             'Frontend Developer',
//             'Backend Developer',
//             'Full Stack Developer',
//             'DevOps Engineer',
//           ];
//         }

//         complexType.elements.push({
//           id: `elem_${Date.now()}_${child.name}`,
//           name: child.name,
//           type: elementType,
//           minOccurs: 1,
//           maxOccurs: 1,
//           enumeration,
//         });
//       }

//       if (child.children.length > 0) {
//         processNode(child);
//       }
//     });
//   };

//   xmlNodes.forEach(processNode);
//   return Array.from(types.values());
// };

// const serializeXSDToString = (xsdTypes: XSDComplexType[]): string => {
//   let xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
// <xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
// `;

//   xsdTypes.forEach((type) => {
//     xsdContent += `  <xs:complexType name="${type.name}">
//     <xs:sequence>
// `;
//     type.elements.forEach((element) => {
//       const minOccurs =
//         element.minOccurs !== 1 ? ` minOccurs="${element.minOccurs}"` : '';
//       const maxOccurs =
//         element.maxOccurs !== 1 ? ` maxOccurs="${element.maxOccurs}"` : '';

//       if (element.enumeration && element.enumeration.length > 0) {
//         xsdContent += `      <xs:element name="${element.name}"${minOccurs}${maxOccurs}>
//         <xs:simpleType>
//           <xs:restriction base="${element.type}">
// `;
//         element.enumeration.forEach((value) => {
//           xsdContent += `            <xs:enumeration value="${value}"/>
// `;
//         });
//         xsdContent += `          </xs:restriction>
//         </xs:simpleType>
//       </xs:element>
// `;
//       } else {
//         xsdContent += `      <xs:element name="${element.name}" type="${element.type}"${minOccurs}${maxOccurs}/>
// `;
//       }
//     });
//     xsdContent += `    </xs:sequence>
//   </xs:complexType>
// `;
//   });

//   xsdContent += `</xs:schema>`;
//   return xsdContent;
// };

// const parseXSDToTypes = (xsdString: string): XSDComplexType[] => {
//   try {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(xsdString, 'text/xml');

//     const complexTypes = Array.from(doc.querySelectorAll('complexType'));

//     return complexTypes.map((complexType, index) => {
//       const name = complexType.getAttribute('name') || `ComplexType${index}`;
//       const elements = Array.from(complexType.querySelectorAll('element')).map(
//         (elem, elemIndex) => {
//           const simpleType = elem.querySelector('simpleType');
//           let enumeration: string[] | undefined = undefined;

//           if (simpleType) {
//             const restriction = simpleType.querySelector('restriction');
//             if (restriction) {
//               enumeration = Array.from(
//                 restriction.querySelectorAll('enumeration')
//               ).map((enumElem) => enumElem.getAttribute('value') || '');
//             }
//           }

//           return {
//             id: `elem_${Date.now()}_${elemIndex}`,
//             name: elem.getAttribute('name') || 'element',
//             type: simpleType
//               ? simpleType.querySelector('restriction')?.getAttribute('base') ||
//                 'xs:string'
//               : elem.getAttribute('type') || 'xs:string',
//             minOccurs: parseInt(elem.getAttribute('minOccurs') || '1'),
//             maxOccurs:
//               elem.getAttribute('maxOccurs') === 'unbounded'
//                 ? ('unbounded' as const)
//                 : parseInt(elem.getAttribute('maxOccurs') || '1'),
//             enumeration: enumeration?.length ? enumeration : undefined,
//           };
//         }
//       );

//       return {
//         id: `type_${Date.now()}_${index}`,
//         name,
//         elements,
//       };
//     });
//   } catch (error) {
//     console.error('XSD parsing error:', error);
//     return [];
//   }
// };

// const serializeNodesToXML = (nodes: XMLNode[]): string => {
//   const serializeNode = (node: XMLNode, indent = 0): string => {
//     const spaces = '  '.repeat(indent);
//     const attrs = node.attributes
//       .map((attr) => `${attr.name}="${attr.value}"`)
//       .join(' ');
//     const attrString = attrs ? ` ${attrs}` : '';

//     if (node.children.length === 0 && !node.textContent) {
//       return `${spaces}<${node.name}${attrString}/>`;
//     }

//     let content = '';
//     if (node.textContent) {
//       content = node.textContent;
//     } else if (node.children.length > 0) {
//       content =
//         '\n' +
//         node.children
//           .map((child) => serializeNode(child, indent + 1))
//           .join('\n') +
//         '\n' +
//         spaces;
//     }

//     return `${spaces}<${node.name}${attrString}>${content}</${node.name}>`;
//   };

//   return (
//     '<?xml version="1.0" encoding="UTF-8"?>\n' +
//     nodes.map((node) => serializeNode(node)).join('\n')
//   );
// };

// // Components
// const CodeEditor: React.FC<{
//   value: string;
//   onChange: (value: string) => void;
//   language: string;
// }> = ({ value, onChange, language }) => {
//   return (
//     <textarea
//       value={value}
//       onChange={(e) => onChange(e.target.value)}
//       className='w-full h-full font-mono text-sm p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
//       style={{ minHeight: '400px' }}
//       placeholder={`Enter ${language.toUpperCase()} code here...`}
//     />
//   );
// };

// const findXSDElement = (
//   parsedXSD: XSDComplexType[],
//   nodeName: string
// ): XSDElement | undefined => {
//   for (const complexType of parsedXSD) {
//     const element = complexType.elements.find((el) => el.name === nodeName);
//     if (element) return element;
//   }
//   return undefined;
// };

// const XMLNodeEditor: React.FC<{
//   node: XMLNode;
//   onUpdate: (updates: Partial<XMLNode>) => void;
//   onDelete: () => void;
//   onAddChild: () => void;
// }> = ({ node, onUpdate, onDelete, onAddChild }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [editName, setEditName] = useState(node.name);
//   const [editText, setEditText] = useState(node.textContent || '');
//   const { parsedXSD } = useEditorStore();

//   const xsdElement = findXSDElement(parsedXSD, node.name);

//   const handleSave = () => {
//     onUpdate({
//       name: editName,
//       textContent: editText || undefined,
//     });
//     setIsEditing(false);
//   };

//   const handleAddAttribute = () => {
//     const attrName = prompt('Attribute name:');
//     const attrValue = prompt('Attribute value:');
//     if (attrName && attrValue) {
//       onUpdate({
//         attributes: [...node.attributes, { name: attrName, value: attrValue }],
//       });
//     }
//   };

//   return (
//     <Card className='mb-3'>
//       <CardHeader className='pb-2'>
//         <div className='flex items-center justify-between'>
//           <div className='flex items-center gap-2'>
//             {isEditing ? (
//               <Input
//                 value={editName}
//                 onChange={(e) => setEditName(e.target.value)}
//                 className='w-32'
//               />
//             ) : (
//               <CardTitle className='text-base'>&lt;{node.name}&gt;</CardTitle>
//             )}
//             <div className='flex gap-1'>
//               {node.attributes.map((attr, index) => (
//                 <Badge key={index} variant='secondary' className='text-xs'>
//                   {attr.name}="{attr.value}"
//                 </Badge>
//               ))}
//             </div>
//           </div>
//           <div className='flex gap-1'>
//             <Button
//               size='sm'
//               variant='outline'
//               onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
//             >
//               {isEditing ? (
//                 <Save className='w-3 h-3' />
//               ) : (
//                 <Edit className='w-3 h-3' />
//               )}
//             </Button>
//             <Button size='sm' variant='outline' onClick={handleAddAttribute}>
//               <Plus className='w-3 h-3' />
//             </Button>
//             <Button size='sm' variant='outline' onClick={onAddChild}>
//               <Type className='w-3 h-3' />
//             </Button>
//             <Button size='sm' variant='destructive' onClick={onDelete}>
//               <Trash2 className='w-3 h-3' />
//             </Button>
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent className='pt-0'>
//         {node.textContent !== undefined && (
//           <div className='mb-2'>
//             {isEditing && xsdElement?.enumeration ? (
//               <Select
//                 value={editText}
//                 onValueChange={(value) => {
//                   setEditText(value);
//                   onUpdate({ textContent: value });
//                 }}
//               >
//                 <SelectTrigger className='text-sm'>
//                   <SelectValue placeholder='Select an occupation' />
//                 </SelectTrigger>
//                 <SelectContent>
//                   {xsdElement.enumeration.map((value) => (
//                     <SelectItem key={value} value={value}>
//                       {value}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//             ) : isEditing ? (
//               <Input
//                 value={editText}
//                 onChange={(e) => setEditText(e.target.value)}
//                 placeholder='Text content'
//                 className='text-sm'
//               />
//             ) : (
//               <div className='p-2 bg-gray-50 rounded text-sm'>
//                 {node.textContent || (
//                   <span className='text-gray-400'>No text content</span>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//         {node.children.length > 0 && (
//           <div className='ml-4 border-l-2 border-gray-200 pl-4'>
//             {node.children.map((child) => (
//               <XMLNodeEditorContainer key={child.id} nodeId={child.id} />
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// const XMLNodeEditorContainer: React.FC<{ nodeId: string }> = ({ nodeId }) => {
//   const { parsedXML, updateXMLNode, deleteXMLNode, addXMLNode } =
//     useEditorStore();

//   const findNode = (nodes: XMLNode[], id: string): XMLNode | null => {
//     for (const node of nodes) {
//       if (node.id === id) return node;
//       const found = findNode(node.children, id);
//       if (found) return found;
//     }
//     return null;
//   };

//   const node = findNode(parsedXML, nodeId);
//   if (!node) return null;

//   return (
//     <XMLNodeEditor
//       node={node}
//       onUpdate={(updates) => updateXMLNode(nodeId, updates)}
//       onDelete={() => deleteXMLNode(nodeId)}
//       onAddChild={() => {
//         const elementName = prompt('Element name:') || 'newElement';
//         addXMLNode(nodeId, {
//           name: elementName,
//           type: 'element',
//           attributes: [],
//           children: [],
//           textContent: '',
//         });
//       }}
//     />
//   );
// };

// const XSDElementEditor: React.FC<{
//   element: XSDElement;
//   onUpdate: (updates: Partial<XSDElement>) => void;
//   onDelete: () => void;
// }> = ({ element, onUpdate, onDelete }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [enumValues, setEnumValues] = useState<string[]>(
//     element.enumeration || []
//   );
//   const [newEnumValue, setNewEnumValue] = useState('');

//   const handleAddEnumValue = () => {
//     if (newEnumValue.trim()) {
//       const updatedEnum = [...enumValues, newEnumValue.trim()];
//       setEnumValues(updatedEnum);
//       onUpdate({ enumeration: updatedEnum });
//       setNewEnumValue('');
//     }
//   };

//   const handleRemoveEnumValue = (value: string) => {
//     const updatedEnum = enumValues.filter((val) => val !== value);
//     setEnumValues(updatedEnum);
//     onUpdate({ enumeration: updatedEnum.length > 0 ? updatedEnum : undefined });
//   };

//   return (
//     <div className='p-2 border rounded-md mb-2 bg-blue-50'>
//       <div className='flex items-center justify-between'>
//         <div className='flex items-center gap-2'>
//           <span className='font-medium text-sm'>{element.name}</span>
//           <Badge variant='outline' className='text-xs'>
//             {element.type}
//           </Badge>
//           {element.minOccurs !== undefined && (
//             <Badge variant='secondary' className='text-xs'>
//               min: {element.minOccurs}
//             </Badge>
//           )}
//           {element.maxOccurs !== undefined && (
//             <Badge variant='secondary' className='text-xs'>
//               max: {element.maxOccurs}
//             </Badge>
//           )}
//         </div>
//         <div className='flex gap-1'>
//           <Button
//             size='sm'
//             variant='outline'
//             onClick={() => setIsEditing(!isEditing)}
//           >
//             <Edit className='w-3 h-3' />
//           </Button>
//           <Button size='sm' variant='destructive' onClick={onDelete}>
//             <Trash2 className='w-3 h-3' />
//           </Button>
//         </div>
//       </div>

//       {isEditing && (
//         <div className='mt-2 space-y-2'>
//           <div className='grid grid-cols-2 gap-2'>
//             <Input
//               value={element.name}
//               onChange={(e) => onUpdate({ name: e.target.value })}
//               placeholder='Element name'
//               className='text-sm'
//             />
//             <Select
//               value={element.type}
//               onValueChange={(value) => onUpdate({ type: value })}
//             >
//               <SelectTrigger className='text-sm'>
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value='xs:string'>String</SelectItem>
//                 <SelectItem value='xs:int'>Integer</SelectItem>
//                 <SelectItem value='xs:decimal'>Decimal</SelectItem>
//                 <SelectItem value='xs:boolean'>Boolean</SelectItem>
//                 <SelectItem value='xs:date'>Date</SelectItem>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className='space-y-2'>
//             <div className='flex items-center gap-2'>
//               <Input
//                 value={newEnumValue}
//                 onChange={(e) => setNewEnumValue(e.target.value)}
//                 placeholder='Add enumeration value (e.g., Frontend Developer)'
//                 className='text-sm'
//               />
//               <Button size='sm' onClick={handleAddEnumValue}>
//                 <Plus className='w-3 h-3' />
//               </Button>
//             </div>
//             {enumValues.length > 0 && (
//               <div className='flex flex-wrap gap-2'>
//                 {enumValues.map((value) => (
//                   <Badge
//                     key={value}
//                     variant='secondary'
//                     className='text-xs flex items-center gap-1'
//                   >
//                     {value}
//                     <Button
//                       size='sm'
//                       variant='ghost'
//                       onClick={() => handleRemoveEnumValue(value)}
//                       className='p-0 h-4 w-4'
//                     >
//                       <Trash2 className='w-3 h-3 text-red-500' />
//                     </Button>
//                   </Badge>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// const XSDComplexTypeEditor: React.FC<{
//   complexType: XSDComplexType;
//   onUpdateElement: (elementId: string, updates: Partial<XSDElement>) => void;
//   onDeleteElement: (elementId: string) => void;
//   onAddElement: () => void;
// }> = ({ complexType, onUpdateElement, onDeleteElement, onAddElement }) => {
//   return (
//     <Card className='mb-3 border-blue-200'>
//       <CardHeader className='pb-2'>
//         <div className='flex items-center justify-between'>
//           <CardTitle className='text-base text-blue-700'>
//             {complexType.name}
//           </CardTitle>
//           <Button size='sm' onClick={onAddElement} variant='outline'>
//             <Plus className='w-3 h-3 mr-1' />
//             Add Element
//           </Button>
//         </div>
//       </CardHeader>
//       <CardContent className='pt-0'>
//         {complexType.elements.map((element) => (
//           <XSDElementEditor
//             key={element.id}
//             element={element}
//             onUpdate={(updates) => onUpdateElement(element.id, updates)}
//             onDelete={() => onDeleteElement(element.id)}
//           />
//         ))}
//       </CardContent>
//     </Card>
//   );
// };

// const CombinedVisualEditor: React.FC = () => {
//   const {
//     parsedXML,
//     parsedXSD,
//     autoGenerateXSD,
//     addXMLNode,
//     addXSDElement,
//     updateXSDElement,
//     deleteXSDElement,
//     addXSDComplexType,
//     setAutoGenerateXSD,
//   } = useEditorStore();

//   return (
//     <div className='h-full overflow-y-auto p-4'>
//       <div className='flex justify-between items-center mb-4'>
//         <h3 className='text-lg font-semibold'>Combined Visual Editor</h3>
//         <div className='flex gap-2 items-center'>
//           <div className='flex items-center gap-2'>
//             <Zap className='w-4 h-4 text-yellow-500' />
//             <label className='text-sm'>Auto-generate XSD</label>
//             <input
//               type='checkbox'
//               checked={autoGenerateXSD}
//               onChange={(e) => setAutoGenerateXSD(e.target.checked)}
//               className='ml-1'
//             />
//           </div>
//           <Button
//             onClick={() => {
//               const elementName = prompt('Root element name:') || 'newElement';
//               addXMLNode('root', {
//                 name: elementName,
//                 type: 'element',
//                 attributes: [],
//                 children: [],
//                 textContent: '',
//               });
//             }}
//           >
//             <Plus className='w-4 h-4 mr-1' />
//             Add XML Element
//           </Button>
//         </div>
//       </div>

//       <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
//         <div>
//           <div className='flex items-center gap-2 mb-3'>
//             <FileText className='w-5 h-5 text-green-600' />
//             <h4 className='font-semibold text-green-700'>
//               XML Document Structure
//             </h4>
//           </div>
//           <div className='space-y-3 max-h-96 overflow-y-auto'>
//             {parsedXML.length === 0 ? (
//               <div className='text-center text-gray-500 py-8'>
//                 <FileText className='w-12 h-12 mx-auto mb-2 text-gray-300' />
//                 <p>No XML elements. Add some elements to get started.</p>
//               </div>
//             ) : (
//               parsedXML.map((node) => (
//                 <XMLNodeEditorContainer key={node.id} nodeId={node.id} />
//               ))
//             )}
//           </div>
//         </div>

//         <div>
//           <div className='flex items-center gap-2 mb-3'>
//             <List className='w-5 h-5 text-blue-600' />
//             <h4 className='font-semibold text-blue-700'>
//               XSD Schema Structure
//             </h4>
//             {autoGenerateXSD && (
//               <Badge variant='secondary' className='text-xs'>
//                 <Zap className='w-3 h-3 mr-1' />
//                 Auto-generated
//               </Badge>
//             )}
//           </div>
//           <div className='space-y-3 max-h-96 overflow-y-auto'>
//             {parsedXSD.length === 0 ? (
//               <div className='text-center text-gray-500 py-8'>
//                 <List className='w-12 h-12 mx-auto mb-2 text-gray-300' />
//                 <p>
//                   No XSD types.{' '}
//                   {autoGenerateXSD
//                     ? 'Add XML elements to auto-generate schema.'
//                     : 'Add some complex types to get started.'}
//                 </p>
//               </div>
//             ) : (
//               parsedXSD.map((complexType) => (
//                 <XSDComplexTypeEditor
//                   key={complexType.id}
//                   complexType={complexType}
//                   onUpdateElement={(elementId, updates) =>
//                     updateXSDElement(complexType.id, elementId, updates)
//                   }
//                   onDeleteElement={(elementId) =>
//                     deleteXSDElement(complexType.id, elementId)
//                   }
//                   onAddElement={() => {
//                     const elementName = prompt('Element name:') || 'newElement';
//                     addXSDElement(complexType.id, {
//                       name: elementName,
//                       type: 'xs:string',
//                       minOccurs: 1,
//                       maxOccurs: 1,
//                     });
//                   }}
//                 />
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// const XMLXSDEditorNew: React.FC = () => {
//   const {
//     xmlContent,
//     xsdContent,
//     activeTab,
//     autoGenerateXSD,
//     setXMLContent,
//     setXSDContent,
//     setActiveTab,
//     setParsedXML,
//     setParsedXSD,
//     parsedXML,
//   } = useEditorStore();

//   useEffect(() => {
//     setParsedXML(parseXMLToNodes(xmlContent));
//     setParsedXSD(parseXSDToTypes(xsdContent));
//   }, []);

//   useEffect(() => {
//     if (autoGenerateXSD && parsedXML.length > 0) {
//       const generatedXSD = generateXSDFromXML(parsedXML);
//       setParsedXSD(generatedXSD);
//       setXSDContent(serializeXSDToString(generatedXSD));
//     }
//   }, [parsedXML, autoGenerateXSD]);

//   useEffect(() => {
//     if (parsedXML.length > 0) {
//       const newXMLContent = serializeNodesToXML(parsedXML);
//       setXMLContent(newXMLContent);
//     }
//   }, [parsedXML]);

//   const handleCodeChange = (content: string, type: 'xml' | 'xsd') => {
//     if (type === 'xml') {
//       setXMLContent(content);
//       try {
//         const newNodes = parseXMLToNodes(content);
//         setParsedXML(newNodes);
//       } catch (error) {
//         console.error('XML parsing error:', error);
//       }
//     } else {
//       setXSDContent(content);
//       if (!autoGenerateXSD) {
//         try {
//           setParsedXSD(parseXSDToTypes(content));
//         } catch (error) {
//           console.error('XSD parsing error:', error);
//         }
//       }
//     }
//   };

//   const validateXML = () => {
//     try {
//       parseXMLToNodes(xmlContent);
//       return { valid: true, message: 'XML is valid' };
//     } catch (error: any) {
//       return { valid: false, message: `XML Error: ${error.message}` };
//     }
//   };

//   const validateXSD = () => {
//     try {
//       parseXSDToTypes(xsdContent);
//       return { valid: true, message: 'XSD is valid' };
//     } catch (error: any) {
//       return { valid: false, message: `XSD Error: ${error.message}` };
//     }
//   };

//   const formatCode = (content: string, type: 'xml' | 'xsd') => {
//     try {
//       const parser = new DOMParser();
//       const doc = parser.parseFromString(content, 'text/xml');
//       const serializer = new XMLSerializer();
//       const formatted = serializer.serializeToString(doc);

//       if (type === 'xml') {
//         setXMLContent(formatted);
//       } else {
//         setXSDContent(formatted);
//       }
//     } catch (error) {
//       console.error('Formatting error:', error);
//     }
//   };

//   return (
//     <div className='h-screen flex flex-col bg-gray-50'>
//       <div className='bg-white border-b shadow-sm p-4'>
//         <h1 className='text-2xl font-bold text-gray-800 mb-2'>
//           XML/XSD Editor
//         </h1>
//         <p className='text-gray-600 text-sm'>
//           Create and edit XML documents with automatic XSD schema generation
//         </p>
//       </div>

//       <div className='flex-1 overflow-hidden'>
//         <Tabs
//           value={activeTab}
//           onValueChange={(value) => setActiveTab(value as 'xml' | 'xsd')}
//           className='h-full flex flex-col'
//         >
//           <div className='bg-white border-b px-4'>
//             <TabsList className='grid w-full max-w-md grid-cols-3'>
//               <TabsTrigger value='xml' className='flex items-center gap-2'>
//                 <FileText className='w-4 h-4' />
//                 XML Editor
//               </TabsTrigger>
//               <TabsTrigger value='xsd' className='flex items-center gap-2'>
//                 <List className='w-4 h-4' />
//                 XSD Editor
//               </TabsTrigger>
//               <TabsTrigger value='visual' className='flex items-center gap-2'>
//                 <Edit className='w-4 h-4' />
//                 Visual Editor
//               </TabsTrigger>
//             </TabsList>
//           </div>

//           <TabsContent value='xml' className='flex-1 p-4 space-y-4'>
//             <div className='flex justify-between items-center'>
//               <h2 className='text-lg font-semibold text-gray-700'>
//                 XML Document
//               </h2>
//               <div className='flex gap-2'>
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   onClick={() => formatCode(xmlContent, 'xml')}
//                 >
//                   Format
//                 </Button>
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   onClick={() => {
//                     const validation = validateXML();
//                     alert(validation.message);
//                   }}
//                 >
//                   Validate
//                 </Button>
//               </div>
//             </div>
//             <div className='h-full border rounded-lg overflow-hidden'>
//               <CodeEditor
//                 value={xmlContent}
//                 onChange={(content) => handleCodeChange(content, 'xml')}
//                 language='xml'
//               />
//             </div>
//           </TabsContent>

//           <TabsContent value='xsd' className='flex-1 p-4 space-y-4'>
//             <div className='flex justify-between items-center'>
//               <h2 className='text-lg font-semibold text-gray-700'>
//                 XSD Schema
//               </h2>
//               <div className='flex gap-2 items-center'>
//                 <div className='flex items-center gap-2 mr-4'>
//                   <input
//                     type='checkbox'
//                     id='auto-generate'
//                     checked={autoGenerateXSD}
//                     onChange={(e) => {
//                       const { setAutoGenerateXSD } = useEditorStore.getState();
//                       setAutoGenerateXSD(e.target.checked);
//                     }}
//                   />
//                   <label
//                     htmlFor='auto-generate'
//                     className='text-sm text-gray-600'
//                   >
//                     Auto-generate from XML
//                   </label>
//                 </div>
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   onClick={() => formatCode(xsdContent, 'xsd')}
//                   disabled={autoGenerateXSD}
//                 >
//                   Format
//                 </Button>
//                 <Button
//                   variant='outline'
//                   size='sm'
//                   onClick={() => {
//                     const validation = validateXSD();
//                     alert(validation.message);
//                   }}
//                 >
//                   Validate
//                 </Button>
//               </div>
//             </div>
//             {autoGenerateXSD && (
//               <div className='bg-yellow-50 border border-yellow-200 rounded p-3'>
//                 <p className='text-yellow-800 text-sm'>
//                   <Zap className='w-4 h-4 inline mr-1' />
//                   XSD is being automatically generated from your XML structure.
//                 </p>
//               </div>
//             )}
//             <div className='h-full border rounded-lg overflow-hidden'>
//               <CodeEditor
//                 value={xsdContent}
//                 onChange={(content) => handleCodeChange(content, 'xsd')}
//                 language='xsd'
//               />
//             </div>
//           </TabsContent>

//           <TabsContent value='visual' className='flex-1'>
//             <CombinedVisualEditor />
//           </TabsContent>
//         </Tabs>
//       </div>

//       <div className='bg-white border-t p-4'>
//         <div className='flex justify-between items-center text-sm text-gray-500'>
//           <div className='flex items-center gap-4'>
//             <span>XML Elements: {parsedXML.length}</span>
//             <span>XSD Types: {useEditorStore.getState().parsedXSD.length}</span>
//           </div>
//           <div className='flex items-center gap-2'>
//             {autoGenerateXSD && (
//               <Badge variant='secondary' className='text-xs'>
//                 <Zap className='w-3 h-3 mr-1' />
//                 Auto XSD
//               </Badge>
//             )}
//             <span>Ready</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default XMLXSDEditorNew;

import React, { useState, useEffect } from 'react';
import { create } from 'zustand';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  Type,
  List,
  FileText,
  Zap,
} from 'lucide-react';

// Types
interface XMLAttribute {
  name: string;
  value: string;
}

interface XMLNode {
  id: string;
  name: string;
  type: 'element' | 'text';
  attributes: XMLAttribute[];
  children: XMLNode[];
  textContent?: string;
  parent?: string;
}

interface XSDElement {
  id: string;
  name: string;
  type: string;
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
  enumeration?: string[];
  restriction?: string;
}

interface XSDComplexType {
  id: string;
  name: string;
  elements: XSDElement[];
}

// Zustand Store
interface EditorStore {
  xmlContent: string;
  xsdContent: string;
  parsedXML: XMLNode[];
  parsedXSD: XSDComplexType[];
  activeTab: 'xml' | 'xsd' | 'visual';
  autoGenerateXSD: boolean;

  setXMLContent: (content: string) => void;
  setXSDContent: (content: string) => void;
  setParsedXML: (nodes: XMLNode[]) => void;
  setParsedXSD: (types: XSDComplexType[]) => void;
  setActiveTab: (tab: 'xml' | 'xsd' | 'visual') => void;
  setAutoGenerateXSD: (auto: boolean) => void;

  addXMLNode: (parentId: string, node: Omit<XMLNode, 'id'>) => void;
  updateXMLNode: (id: string, updates: Partial<XMLNode>) => void;
  deleteXMLNode: (id: string) => void;

  addXSDElement: (typeId: string, element: Omit<XSDElement, 'id'>) => void;
  updateXSDElement: (
    typeId: string,
    elementId: string,
    updates: Partial<XSDElement>
  ) => void;
  deleteXSDElement: (typeId: string, elementId: string) => void;
  addXSDComplexType: (type: Omit<XSDComplexType, 'id'>) => void;
}

const useEditorStore = create<EditorStore>((set, get) => ({
  xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<person id="1">
  <name>John Doe</name>
  <age>30</age>
  <email>john@example.com</email>
  <occupation>Frontend Developer</occupation>
</person>`,
  xsdContent: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="PersonType">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="age" type="xs:int"/>
      <xs:element name="email" type="xs:string"/>
      <xs:element name="occupation">
        <xs:simpleType>
          <xs:restriction base="xs:string">
            <xs:enumeration value="Frontend Developer"/>
            <xs:enumeration value="Backend Developer"/>
            <xs:enumeration value="Full Stack Developer"/>
            <xs:enumeration value="DevOps Engineer"/>
          </xs:restriction>
        </xs:simpleType>
      </xs:element>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string"/>
  </xs:complexType>
  <xs:element name="person" type="PersonType"/>
</xs:schema>`,
  parsedXML: [],
  parsedXSD: [],
  activeTab: 'visual', // Default to visual editor
  autoGenerateXSD: true,

  setXMLContent: (content) => set({ xmlContent: content }),
  setXSDContent: (content) => set({ xsdContent: content }),
  setParsedXML: (nodes) => set({ parsedXML: nodes }),
  setParsedXSD: (types) => set({ parsedXSD: types }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAutoGenerateXSD: (auto) => set({ autoGenerateXSD: auto }),

  addXMLNode: (parentId, node) => {
    const { parsedXML, parsedXSD, autoGenerateXSD, addXSDElement } = get();
    const newNode = { ...node, id: `node_${Date.now()}_${Math.random()}` };

    const addToParent = (nodes: XMLNode[]): XMLNode[] => {
      return nodes.map((n) => {
        if (n.id === parentId) {
          return { ...n, children: [...n.children, newNode] };
        }
        return { ...n, children: addToParent(n.children) };
      });
    };

    let updatedXML;
    if (parentId === 'root') {
      updatedXML = [...parsedXML, newNode];
    } else {
      updatedXML = addToParent(parsedXML);
    }

    set({ parsedXML: updatedXML });

    // Automatically add XSD element if it doesn't exist
    if (!autoGenerateXSD) {
      const typeName = `${
        newNode.name.charAt(0).toUpperCase() + newNode.name.slice(1)
      }Type`;
      const typeId =
        parsedXSD.find((type) => type.name === typeName)?.id ||
        `type_${Date.now()}_${newNode.name}`;
      if (!parsedXSD.some((type) => type.name === typeName)) {
        set({
          parsedXSD: [
            ...parsedXSD,
            { id: typeId, name: typeName, elements: [] },
          ],
        });
      }
      if (
        !parsedXSD.some((type) =>
          type.elements.some((el) => el.name === newNode.name)
        )
      ) {
        addXSDElement(typeId, {
          name: newNode.name,
          type: newNode.textContent
            ? inferType(newNode.textContent)
            : 'xs:string',
          minOccurs: 1,
          maxOccurs: 1,
        });
      }
    }
  },

  updateXMLNode: (id, updates) => {
    const { parsedXML } = get();

    const updateNode = (nodes: XMLNode[]): XMLNode[] => {
      return nodes.map((n) => {
        if (n.id === id) {
          return { ...n, ...updates };
        }
        return { ...n, children: updateNode(n.children) };
      });
    };

    set({ parsedXML: updateNode(parsedXML) });
  },

  deleteXMLNode: (id) => {
    const { parsedXML } = get();

    const deleteNode = (nodes: XMLNode[]): XMLNode[] => {
      return nodes
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          children: deleteNode(n.children),
        }));
    };

    set({ parsedXML: deleteNode(parsedXML) });
  },

  addXSDElement: (typeId, element) => {
    const { parsedXSD } = get();
    const newElement = {
      ...element,
      id: `elem_${Date.now()}_${Math.random()}`,
    };

    set({
      parsedXSD: parsedXSD.map((type) =>
        type.id === typeId
          ? { ...type, elements: [...type.elements, newElement] }
          : type
      ),
    });
  },

  updateXSDElement: (typeId, elementId, updates) => {
    const { parsedXSD } = get();

    set({
      parsedXSD: parsedXSD.map((type) =>
        type.id === typeId
          ? {
              ...type,
              elements: type.elements.map((elem) =>
                elem.id === elementId ? { ...elem, ...updates } : elem
              ),
            }
          : type
      ),
    });
  },

  deleteXSDElement: (typeId, elementId) => {
    const { parsedXSD } = get();

    set({
      parsedXSD: parsedXSD.map((type) =>
        type.id === typeId
          ? {
              ...type,
              elements: type.elements.filter((elem) => elem.id !== elementId),
            }
          : type
      ),
    });
  },

  addXSDComplexType: (type) => {
    const { parsedXSD } = get();
    const newType = { ...type, id: `type_${Date.now()}_${Math.random()}` };
    set({ parsedXSD: [...parsedXSD, newType] });
  },
}));

// Utility functions
const parseXMLToNodes = (xmlString: string): XMLNode[] => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    const convertDOMToNode = (element: Element, parentId?: string): XMLNode => {
      const attributes: XMLAttribute[] = Array.from(element.attributes).map(
        (attr) => ({
          name: attr.name,
          value: attr.value,
        })
      );

      const children: XMLNode[] = [];
      let textContent = '';

      Array.from(element.childNodes).forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          children.push(
            convertDOMToNode(
              child as Element,
              `node_${Date.now()}_${Math.random()}`
            )
          );
        } else if (
          child.nodeType === Node.TEXT_NODE &&
          child.textContent?.trim()
        ) {
          textContent = child.textContent.trim();
        }
      });

      return {
        id: `node_${Date.now()}_${Math.random()}`,
        name: element.tagName,
        type: 'element',
        attributes,
        children,
        textContent: textContent || undefined,
        parent: parentId,
      };
    };

    const rootElements = Array.from(doc.children).filter(
      (child) => child.nodeType === Node.ELEMENT_NODE
    );
    return rootElements.map((element) => convertDOMToNode(element as Element));
  } catch (error) {
    console.error('XML parsing error:', error);
    return [];
  }
};

const inferType = (value: string): string => {
  if (!isNaN(Number(value)) && Number.isInteger(Number(value))) {
    return 'xs:int';
  }
  if (!isNaN(Number(value)) && !Number.isInteger(Number(value))) {
    return 'xs:decimal';
  }
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return 'xs:boolean';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'xs:date';
  }
  return 'xs:string';
};

const generateXSDFromXML = (xmlNodes: XMLNode[]): XSDComplexType[] => {
  const types: Map<string, XSDComplexType> = new Map();

  const processNode = (node: XMLNode) => {
    const typeName = `${
      node.name.charAt(0).toUpperCase() + node.name.slice(1)
    }Type`;

    if (!types.has(typeName)) {
      types.set(typeName, {
        id: `type_${Date.now()}_${node.name}`,
        name: typeName,
        elements: [],
      });
    }

    const complexType = types.get(typeName)!;

    node.children.forEach((child) => {
      const existingElement = complexType.elements.find(
        (el) => el.name === child.name
      );

      if (!existingElement) {
        let elementType = 'xs:string';
        let enumeration: string[] | undefined = undefined;

        if (child.textContent) {
          elementType = inferType(child.textContent);
        } else if (child.children.length > 0) {
          elementType = `${
            child.name.charAt(0).toUpperCase() + child.name.slice(1)
          }Type`;
        }

        if (child.name === 'occupation') {
          enumeration = [
            'Frontend Developer',
            'Backend Developer',
            'Full Stack Developer',
            'DevOps Engineer',
          ];
        }

        complexType.elements.push({
          id: `elem_${Date.now()}_${child.name}`,
          name: child.name,
          type: elementType,
          minOccurs: 1,
          maxOccurs: 1,
          enumeration,
        });
      }

      if (child.children.length > 0) {
        processNode(child);
      }
    });
  };

  xmlNodes.forEach(processNode);
  return Array.from(types.values());
};

const serializeXSDToString = (xsdTypes: XSDComplexType[]): string => {
  let xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
`;

  xsdTypes.forEach((type) => {
    xsdContent += `  <xs:complexType name="${type.name}">
    <xs:sequence>
`;
    type.elements.forEach((element) => {
      const minOccurs =
        element.minOccurs !== 1 ? ` minOccurs="${element.minOccurs}"` : '';
      const maxOccurs =
        element.maxOccurs !== 1 ? ` maxOccurs="${element.maxOccurs}"` : '';

      if (element.enumeration && element.enumeration.length > 0) {
        xsdContent += `      <xs:element name="${element.name}"${minOccurs}${maxOccurs}>
        <xs:simpleType>
          <xs:restriction base="${element.type}">
`;
        element.enumeration.forEach((value) => {
          xsdContent += `            <xs:enumeration value="${value}"/>
`;
        });
        xsdContent += `          </xs:restriction>
        </xs:simpleType>
      </xs:element>
`;
      } else {
        xsdContent += `      <xs:element name="${element.name}" type="${element.type}"${minOccurs}${maxOccurs}/>
`;
      }
    });
    xsdContent += `    </xs:sequence>
  </xs:complexType>
`;
  });

  xsdContent += `</xs:schema>`;
  return xsdContent;
};

const parseXSDToTypes = (xsdString: string): XSDComplexType[] => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xsdString, 'text/xml');

    const complexTypes = Array.from(doc.querySelectorAll('complexType'));

    return complexTypes.map((complexType, index) => {
      const name = complexType.getAttribute('name') || `ComplexType${index}`;
      const elements = Array.from(complexType.querySelectorAll('element')).map(
        (elem, elemIndex) => {
          const simpleType = elem.querySelector('simpleType');
          let enumeration: string[] | undefined = undefined;

          if (simpleType) {
            const restriction = simpleType.querySelector('restriction');
            if (restriction) {
              enumeration = Array.from(
                restriction.querySelectorAll('enumeration')
              ).map((enumElem) => enumElem.getAttribute('value') || '');
            }
          }

          return {
            id: `elem_${Date.now()}_${elemIndex}_${Math.random()}`,
            name: elem.getAttribute('name') || 'element',
            type: simpleType
              ? simpleType.querySelector('restriction')?.getAttribute('base') ||
                'xs:string'
              : elem.getAttribute('type') || 'xs:string',
            minOccurs: parseInt(elem.getAttribute('minOccurs') || '1'),
            maxOccurs:
              elem.getAttribute('maxOccurs') === 'unbounded'
                ? ('unbounded' as const)
                : parseInt(elem.getAttribute('maxOccurs') || '1'),
            enumeration: enumeration?.length ? enumeration : undefined,
          };
        }
      );

      return {
        id: `type_${Date.now()}_${index}_${Math.random()}`,
        name,
        elements,
      };
    });
  } catch (error) {
    console.error('XSD parsing error:', error);
    return [];
  }
};

const serializeNodesToXML = (nodes: XMLNode[]): string => {
  const serializeNode = (node: XMLNode, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    const attrs = node.attributes
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(' ');
    const attrString = attrs ? ` ${attrs}` : '';

    if (node.children.length === 0 && !node.textContent) {
      return `${spaces}<${node.name}${attrString}/>`;
    }

    let content = '';
    if (node.textContent) {
      content = node.textContent;
    } else if (node.children.length > 0) {
      content =
        '\n' +
        node.children
          .map((child) => serializeNode(child, indent + 1))
          .join('\n') +
        '\n' +
        spaces;
    }

    return `${spaces}<${node.name}${attrString}>${content}</${node.name}>`;
  };

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    nodes.map((node) => serializeNode(node)).join('\n')
  );
};

// Components
const CodeEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  language: string;
}> = ({ value, onChange, language }) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className='w-full h-full font-mono text-sm p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
      style={{ minHeight: '400px' }}
      placeholder={`Enter ${language.toUpperCase()} code here...`}
    />
  );
};

const findXSDElement = (
  parsedXSD: XSDComplexType[],
  nodeName: string
): XSDElement | undefined => {
  for (const complexType of parsedXSD) {
    const element = complexType.elements.find((el) => el.name === nodeName);
    if (element) return element;
  }
  return undefined;
};

const XMLNodeEditor: React.FC<{
  node: XMLNode;
  onUpdate: (updates: Partial<XMLNode>) => void;
  onDelete: () => void;
  onAddChild: () => void;
}> = ({ node, onUpdate, onDelete, onAddChild }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [editText, setEditText] = useState(node.textContent || '');
  const [isXSDEditing, setIsXSDEditing] = useState(false);
  const {
    parsedXSD,
    updateXSDElement,
    addXSDElement,
    deleteXSDElement,
    autoGenerateXSD,
  } = useEditorStore();

  const xsdElement = findXSDElement(parsedXSD, node.name);

  const handleSave = () => {
    onUpdate({
      name: editName,
      textContent: editText || undefined,
    });
    setIsEditing(false);
  };

  const handleAddAttribute = () => {
    const attrName = prompt('Attribute name:');
    const attrValue = prompt('Attribute value:');
    if (attrName && attrValue) {
      onUpdate({
        attributes: [...node.attributes, { name: attrName, value: attrValue }],
      });
    }
  };

  const handleXSDElementUpdate = (updates: Partial<XSDElement>) => {
    if (xsdElement) {
      updateXSDElement(
        parsedXSD.find((type) => type.elements.includes(xsdElement))!.id,
        xsdElement.id,
        updates
      );
    } else {
      const typeName = `${
        node.name.charAt(0).toUpperCase() + node.name.slice(1)
      }Type`;
      const typeId =
        parsedXSD.find((type) => type.name === typeName)?.id ||
        `type_${Date.now()}_${node.name}`;
      if (!parsedXSD.some((type) => type.name === typeName)) {
        useEditorStore
          .getState()
          .addXSDComplexType({ name: typeName, elements: [] });
      }
      addXSDElement(typeId, {
        name: node.name,
        type: updates.type || 'xs:string',
        minOccurs: updates.minOccurs || 1,
        maxOccurs: updates.maxOccurs || 1,
        enumeration: updates.enumeration,
      });
    }
  };

  return (
    <Card className='mb-3'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className='w-32'
              />
            ) : (
              <CardTitle className='text-base'>&lt;{node.name}&gt;</CardTitle>
            )}
            <div className='flex gap-1'>
              {node.attributes.map((attr, index) => (
                <Badge key={index} variant='secondary' className='text-xs'>
                  {attr.name}="{attr.value}"
                </Badge>
              ))}
            </div>
          </div>
          <div className='flex gap-1'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            >
              {isEditing ? (
                <Save className='w-3 h-3' />
              ) : (
                <Edit className='w-3 h-3' />
              )}
            </Button>
            <Button size='sm' variant='outline' onClick={handleAddAttribute}>
              <Plus className='w-3 h-3' />
            </Button>
            <Button size='sm' variant='outline' onClick={onAddChild}>
              <Type className='w-3 h-3' />
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIsXSDEditing(!isXSDEditing)}
            >
              <List className='w-3 h-3' />
            </Button>
            <Button size='sm' variant='destructive' onClick={onDelete}>
              <Trash2 className='w-3 h-3' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        {node.textContent !== undefined && (
          <div className='mb-2'>
            {isEditing && xsdElement?.enumeration ? (
              <Select
                value={editText}
                onValueChange={(value) => {
                  setEditText(value);
                  onUpdate({ textContent: value });
                }}
              >
                <SelectTrigger className='text-sm'>
                  <SelectValue placeholder='Select a value' />
                </SelectTrigger>
                <SelectContent>
                  {xsdElement.enumeration.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : isEditing ? (
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder='Text content'
                className='text-sm'
              />
            ) : (
              <div className='p-2 bg-gray-50 rounded text-sm'>
                {node.textContent || (
                  <span className='text-gray-400'>No text content</span>
                )}
              </div>
            )}
          </div>
        )}
        {isXSDEditing && (
          <div className='mt-2 p-2 bg-blue-50 border rounded-md'>
            <h5 className='text-sm font-semibold mb-2'>
              XSD Schema for {node.name}
            </h5>
            <XSDElementEditor
              element={
                xsdElement || {
                  id: `elem_${Date.now()}_${node.name}`,
                  name: node.name,
                  type: node.textContent
                    ? inferType(node.textContent)
                    : 'xs:string',
                  minOccurs: 1,
                  maxOccurs: 1,
                }
              }
              onUpdate={handleXSDElementUpdate}
              onDelete={() => {
                if (xsdElement) {
                  deleteXSDElement(
                    parsedXSD.find((type) =>
                      type.elements.includes(xsdElement)
                    )!.id,
                    xsdElement.id
                  );
                }
              }}
            />
          </div>
        )}
        {node.children.length > 0 && (
          <div className='ml-4 border-l-2 border-gray-200 pl-4'>
            {node.children.map((child) => (
              <XMLNodeEditorContainer key={child.id} nodeId={child.id} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const XMLNodeEditorContainer: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const { parsedXML, updateXMLNode, deleteXMLNode, addXMLNode } =
    useEditorStore();

  const findNode = (nodes: XMLNode[], id: string): XMLNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const node = findNode(parsedXML, nodeId);
  if (!node) return null;

  return (
    <XMLNodeEditor
      node={node}
      onUpdate={(updates) => updateXMLNode(nodeId, updates)}
      onDelete={() => deleteXMLNode(nodeId)}
      onAddChild={() => {
        const elementName = prompt('Element name:') || 'newElement';
        addXMLNode(nodeId, {
          name: elementName,
          type: 'element',
          attributes: [],
          children: [],
          textContent: '',
        });
      }}
    />
  );
};

const XSDElementEditor: React.FC<{
  element: XSDElement;
  onUpdate: (updates: Partial<XSDElement>) => void;
  onDelete: () => void;
}> = ({ element, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [enumValues, setEnumValues] = useState<string[]>(
    element.enumeration || []
  );
  const [newEnumValue, setNewEnumValue] = useState('');

  const handleAddEnumValue = () => {
    if (newEnumValue.trim()) {
      const updatedEnum = [...enumValues, newEnumValue.trim()];
      setEnumValues(updatedEnum);
      onUpdate({ enumeration: updatedEnum });
      setNewEnumValue('');
    }
  };

  const handleRemoveEnumValue = (value: string) => {
    const updatedEnum = enumValues.filter((val) => val !== value);
    setEnumValues(updatedEnum);
    onUpdate({ enumeration: updatedEnum.length > 0 ? updatedEnum : undefined });
  };

  return (
    <div className='p-2 border rounded-md mb-2 bg-blue-50'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='font-medium text-sm'>{element.name}</span>
          <Badge variant='outline' className='text-xs'>
            {element.type}
          </Badge>
          {element.minOccurs !== undefined && (
            <Badge variant='secondary' className='text-xs'>
              min: {element.minOccurs}
            </Badge>
          )}
          {element.maxOccurs !== undefined && (
            <Badge variant='secondary' className='text-xs'>
              max: {element.maxOccurs}
            </Badge>
          )}
        </div>
        <div className='flex gap-1'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className='w-3 h-3' />
          </Button>
          <Button size='sm' variant='destructive' onClick={onDelete}>
            <Trash2 className='w-3 h-3' />
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className='mt-2 space-y-2'>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              value={element.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder='Element name'
              className='text-sm'
            />
            <Select
              value={element.type}
              onValueChange={(value) => onUpdate({ type: value })}
            >
              <SelectTrigger className='text-sm'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='xs:string'>String</SelectItem>
                <SelectItem value='xs:int'>Integer</SelectItem>
                <SelectItem value='xs:decimal'>Decimal</SelectItem>
                <SelectItem value='xs:boolean'>Boolean</SelectItem>
                <SelectItem value='xs:date'>Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-2 gap-2'>
            <Input
              type='number'
              value={element.minOccurs}
              onChange={(e) =>
                onUpdate({ minOccurs: parseInt(e.target.value) || 1 })
              }
              placeholder='Min occurs'
              className='text-sm'
            />
            <Input
              value={element.maxOccurs}
              onChange={(e) =>
                onUpdate({
                  maxOccurs:
                    e.target.value === 'unbounded'
                      ? 'unbounded'
                      : parseInt(e.target.value) || 1,
                })
              }
              placeholder='Max occurs (number or "unbounded")'
              className='text-sm'
            />
          </div>
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <Input
                value={newEnumValue}
                onChange={(e) => setNewEnumValue(e.target.value)}
                placeholder='Add enumeration value'
                className='text-sm'
              />
              <Button size='sm' onClick={handleAddEnumValue}>
                <Plus className='w-3 h-3' />
              </Button>
            </div>
            {enumValues.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {enumValues.map((value) => (
                  <Badge
                    key={value}
                    variant='secondary'
                    className='text-xs flex items-center gap-1'
                  >
                    {value}
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={() => handleRemoveEnumValue(value)}
                      className='p-0 h-4 w-4'
                    >
                      <Trash2 className='w-3 h-3 text-red-500' />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CombinedVisualEditor: React.FC = () => {
  const {
    parsedXML,
    autoGenerateXSD,
    setAutoGenerateXSD,
    addXMLNode,
    addXSDComplexType,
  } = useEditorStore();

  useEffect(() => {
    if (parsedXML.length > 0 && !autoGenerateXSD) {
      parsedXML.forEach((node) => {
        const typeName = `${
          node.name.charAt(0).toUpperCase() + node.name.slice(1)
        }Type`;
        if (
          !useEditorStore
            .getState()
            .parsedXSD.some((type) => type.name === typeName)
        ) {
          addXSDComplexType({ name: typeName, elements: [] });
        }
      });
    }
  }, [parsedXML, autoGenerateXSD]);

  return (
    <div className='h-full overflow-y-auto p-4'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>XML & XSD Editor</h3>
        <div className='flex gap-2 items-center'>
          <div className='flex items-center gap-2'>
            <Zap className='w-4 h-4 text-yellow-500' />
            <label className='text-sm'>Auto-generate XSD</label>
            <input
              type='checkbox'
              checked={autoGenerateXSD}
              onChange={(e) => setAutoGenerateXSD(e.target.checked)}
              className='ml-1'
            />
          </div>
          <Button
            onClick={() => {
              const elementName = prompt('Root element name:') || 'newElement';
              addXMLNode('root', {
                name: elementName,
                type: 'element',
                attributes: [],
                children: [],
                textContent: '',
              });
            }}
          >
            <Plus className='w-4 h-4 mr-1' />
            Add XML Element
          </Button>
        </div>
      </div>

      <div>
        <div className='flex items-center gap-2 mb-3'>
          <FileText className='w-5 h-5 text-green-600' />
          <h4 className='font-semibold text-green-700'>
            XML Document with Inline XSD Schema
          </h4>
        </div>
        <div className='space-y-3 max-h-[calc(100vh-290px)] overflow-y-auto'>
          {parsedXML.length === 0 ? (
            <div className='text-center text-gray-500 py-8'>
              <FileText className='w-12 h-12 mx-auto mb-2 text-gray-300' />
              <p>No XML elements. Add some elements to get started.</p>
            </div>
          ) : (
            parsedXML.map((node) => (
              <XMLNodeEditorContainer key={node.id} nodeId={node.id} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const XMLXSDEditorNew: React.FC = () => {
  const {
    xmlContent,
    xsdContent,
    activeTab,
    autoGenerateXSD,
    setXMLContent,
    setXSDContent,
    setActiveTab,
    setParsedXML,
    setParsedXSD,
    parsedXML,
  } = useEditorStore();

  useEffect(() => {
    setParsedXML(parseXMLToNodes(xmlContent));
    setParsedXSD(parseXSDToTypes(xsdContent));
  }, []);

  useEffect(() => {
    if (autoGenerateXSD && parsedXML.length > 0) {
      const generatedXSD = generateXSDFromXML(parsedXML);
      setParsedXSD(generatedXSD);
      setXSDContent(serializeXSDToString(generatedXSD));
    }
  }, [parsedXML, autoGenerateXSD]);

  useEffect(() => {
    if (parsedXML.length > 0) {
      const newXMLContent = serializeNodesToXML(parsedXML);
      setXMLContent(newXMLContent);
    }
  }, [parsedXML]);

  const handleCodeChange = (content: string, type: 'xml' | 'xsd') => {
    if (type === 'xml') {
      setXMLContent(content);
      try {
        const newNodes = parseXMLToNodes(content);
        setParsedXML(newNodes);
      } catch (error) {
        console.error('XML parsing error:', error);
      }
    } else {
      setXSDContent(content);
      if (!autoGenerateXSD) {
        try {
          setParsedXSD(parseXSDToTypes(content));
        } catch (error) {
          console.error('XSD parsing error:', error);
        }
      }
    }
  };

  const validateXML = () => {
    try {
      parseXMLToNodes(xmlContent);
      return { valid: true, message: 'XML is valid' };
    } catch (error: any) {
      return { valid: false, message: `XML Error: ${error.message}` };
    }
  };

  const validateXSD = () => {
    try {
      parseXSDToTypes(xsdContent);
      return { valid: true, message: 'XSD is valid' };
    } catch (error: any) {
      return { valid: false, message: `XSD Error: ${error.message}` };
    }
  };

  const formatCode = (content: string, type: 'xml' | 'xsd') => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/xml');
      const serializer = new XMLSerializer();
      const formatted = serializer.serializeToString(doc);

      if (type === 'xml') {
        setXMLContent(formatted);
      } else {
        setXSDContent(formatted);
      }
    } catch (error) {
      console.error('Formatting error:', error);
    }
  };

  return (
    <div className='h-screen flex flex-col bg-gray-50'>
      <div className='bg-white border-b shadow-sm p-4'>
        <h1 className='text-2xl font-bold text-gray-800 mb-2'>
          XML/XSD Editor
        </h1>
        <p className='text-gray-600 text-sm'>
          Create and edit XML documents with integrated XSD schema editing
        </p>
      </div>

      <div className='flex-1 overflow-hidden'>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as 'xml' | 'xsd' | 'visual')
          }
          className='h-full flex flex-col'
        >
          <div className='bg-white border-b px-4'>
            <TabsList className='grid w-full max-w-md grid-cols-3'>
              <TabsTrigger value='visual' className='flex items-center gap-2'>
                <Edit className='w-4 h-4' />
                Integrated Editor
              </TabsTrigger>
              <TabsTrigger value='xml' className='flex items-center gap-2'>
                <FileText className='w-4 h-4' />
                Raw XML
              </TabsTrigger>
              <TabsTrigger value='xsd' className='flex items-center gap-2'>
                <List className='w-4 h-4' />
                Raw XSD
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='visual' className='flex-1'>
            <CombinedVisualEditor />
          </TabsContent>
          <TabsContent value='xml' className='flex-1 p-4 space-y-4'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-semibold text-gray-700'>
                XML Document (Raw)
              </h2>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => formatCode(xmlContent, 'xml')}
                >
                  Format
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const validation = validateXML();
                    alert(validation.message);
                  }}
                >
                  Validate
                </Button>
              </div>
            </div>
            <div className='h-full border rounded-lg overflow-hidden'>
              <CodeEditor
                value={xmlContent}
                onChange={(content) => handleCodeChange(content, 'xml')}
                language='xml'
              />
            </div>
          </TabsContent>
          <TabsContent value='xsd' className='flex-1 p-4 space-y-4'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-semibold text-gray-700'>
                XSD Schema (Raw)
              </h2>
              <div className='flex gap-2 items-center'>
                <div className='flex items-center gap-2 mr-4'>
                  <input
                    type='checkbox'
                    id='auto-generate'
                    checked={autoGenerateXSD}
                    onChange={(e) => {
                      const { setAutoGenerateXSD } = useEditorStore.getState();
                      setAutoGenerateXSD(e.target.checked);
                    }}
                  />
                  <label
                    htmlFor='auto-generate'
                    className='text-sm text-gray-600'
                  >
                    Auto-generate from XML
                  </label>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => formatCode(xsdContent, 'xsd')}
                  disabled={autoGenerateXSD}
                >
                  Format
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    const validation = validateXSD();
                    alert(validation.message);
                  }}
                >
                  Validate
                </Button>
              </div>
            </div>
            {autoGenerateXSD && (
              <div className='bg-yellow-50 border border-yellow-200 rounded p-3'>
                <p className='text-yellow-800 text-sm'>
                  <Zap className='w-4 h-4 inline mr-1' />
                  XSD is being automatically generated from your XML structure.
                </p>
              </div>
            )}
            <div className='h-full border rounded-lg overflow-hidden'>
              <CodeEditor
                value={xsdContent}
                onChange={(content) => handleCodeChange(content, 'xsd')}
                language='xsd'
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className='bg-white border-t p-4'>
        <div className='flex justify-between items-center text-sm text-gray-500'>
          <div className='flex items-center gap-4'>
            <span>XML Elements: {parsedXML.length}</span>
            <span>XSD Types: {useEditorStore.getState().parsedXSD.length}</span>
          </div>
          <div className='flex items-center gap-2'>
            {autoGenerateXSD && (
              <Badge variant='secondary' className='text-xs'>
                <Zap className='w-3 h-3 mr-1' />
                Auto XSD
              </Badge>
            )}
            <span>Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMLXSDEditorNew;
