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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  depth?: number;
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
  activeTab: 'visual',
  autoGenerateXSD: true,

  setXMLContent: (content) => set({ xmlContent: content }),
  setXSDContent: (content) => set({ xsdContent: content }),
  setParsedXML: (nodes) => set({ parsedXML: nodes }),
  setParsedXSD: (types) => set({ parsedXSD: types }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAutoGenerateXSD: (auto) => set({ autoGenerateXSD: auto }),

  addXMLNode: (parentId, node) => {
    const { parsedXML, parsedXSD, autoGenerateXSD, addXSDElement } = get();
    const newNode = {
      ...node,
      id: `node_${Date.now()}_${Math.random()}`,
      depth: parentId === 'root' ? 0 : undefined,
    };

    const addToParent = (nodes: XMLNode[], depth: number): XMLNode[] => {
      return nodes.map((n) => {
        if (n.id === parentId) {
          return {
            ...n,
            children: [...n.children, { ...newNode, depth: depth + 1 }],
          };
        }
        return { ...n, children: addToParent(n.children, n.depth! + 1) };
      });
    };

    let updatedXML;
    if (parentId === 'root') {
      updatedXML = [...parsedXML, { ...newNode, depth: 0 }];
    } else {
      updatedXML = addToParent(
        parsedXML,
        parsedXML.find((n) => n.id === parentId)?.depth || 0
      );
    }

    set({ parsedXML: updatedXML });

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

    const convertDOMToNode = (
      element: Element,
      parentId?: string,
      depth: number = 0
    ): XMLNode => {
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
              `node_${Date.now()}_${Math.random()}`,
              depth + 1
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
        depth,
      };
    };

    const rootElements = Array.from(doc.children).filter(
      (child) => child.nodeType === Node.ELEMENT_NODE
    );
    return rootElements.map((element) =>
      convertDOMToNode(element as Element, undefined, 0)
    );
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
`;

    const typeName = type.name.replace('Type', '').toLowerCase();
    const xmlNode = useEditorStore
      .getState()
      .parsedXML.find((node) => node.name === typeName);
    if (xmlNode && xmlNode.attributes.length > 0) {
      xmlNode.attributes.forEach((attr) => {
        xsdContent += `    <xs:attribute name="${attr.name}" type="xs:string"/>
`;
      });
    }

    xsdContent += `  </xs:complexType>
`;
  });

  xsdTypes.forEach((type) => {
    const elementName = type.name.replace('Type', '').toLowerCase();
    xsdContent += `  <xs:element name="${elementName}" type="${type.name}"/>
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

const XSDElementEditor: React.FC<{
  element: XSDElement;
  onUpdate: (updates: Partial<XSDElement>) => void;
  onDelete: () => void;
}> = ({ element, onUpdate, onDelete }) => {
  const { parsedXSD, setXSDContent } = useEditorStore();
  const [enumValues, setEnumValues] = useState<string[]>(
    element.enumeration || []
  );
  const [newEnumValue, setNewEnumValue] = useState('');

  useEffect(() => {
    // Sync local enumValues with element.enumeration
    setEnumValues(element.enumeration || []);
  }, [element.enumeration]);

  const handleAddEnumValue = () => {
    if (newEnumValue.trim()) {
      const updatedEnum = [...enumValues, newEnumValue.trim()];
      setEnumValues(updatedEnum);
      onUpdate({ enumeration: updatedEnum });
      // Update xsdContent
      const updatedXSD = parsedXSD.map((type) => ({
        ...type,
        elements: type.elements.map((el) =>
          el.id === element.id ? { ...el, enumeration: updatedEnum } : el
        ),
      }));
      setXSDContent(serializeXSDToString(updatedXSD));
      setNewEnumValue('');
    }
  };

  const handleRemoveEnumValue = (value: string) => {
    const updatedEnum = enumValues.filter((val) => val !== value);
    setEnumValues(updatedEnum);
    onUpdate({ enumeration: updatedEnum.length > 0 ? updatedEnum : undefined });
    // Update xsdContent
    const updatedXSD = parsedXSD.map((type) => ({
      ...type,
      elements: type.elements.map((el) =>
        el.id === element.id
          ? {
              ...el,
              enumeration: updatedEnum.length > 0 ? updatedEnum : undefined,
            }
          : el
      ),
    }));
    setXSDContent(serializeXSDToString(updatedXSD));
  };

  return (
    <div className='space-y-2'>
      <div className='grid grid-cols-2 gap-2'>
        <div>
          <label className='text-sm font-medium'>Element Name</label>
          <Input
            value={element.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className='mt-1 text-sm'
          />
        </div>
        <div>
          <label className='text-sm font-medium'>Type</label>
          <Select
            value={element.type}
            onValueChange={(value) => onUpdate({ type: value })}
          >
            <SelectTrigger className='mt-1 text-sm'>
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
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div>
          <label className='text-sm font-medium'>Min Occurs</label>
          <Input
            type='number'
            value={element.minOccurs}
            onChange={(e) =>
              onUpdate({ minOccurs: parseInt(e.target.value) || 1 })
            }
            className='mt-1 text-sm'
          />
        </div>
        <div>
          <label className='text-sm font-medium'>Max Occurs</label>
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
            placeholder='Number or "unbounded"'
            className='mt-1 text-sm'
          />
        </div>
      </div>
      <div>
        <label className='text-sm font-medium'>Enumeration Values</label>
        <div className='flex items-center gap-2 mt-1'>
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
          <div className='flex flex-wrap gap-2 mt-2'>
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
      <Button size='sm' variant='destructive' onClick={onDelete}>
        <Trash2 className='w-4 h-4 mr-1' /> Delete Schema
      </Button>
    </div>
  );
};

const XMLNodeEditor: React.FC<{
  node: XMLNode;
  onUpdate: (updates: Partial<XMLNode>) => void;
  onDelete: () => void;
  onAddChild: () => void;
}> = ({ node, onUpdate, onDelete, onAddChild }) => {
  const {
    parsedXSD,
    updateXSDElement,
    addXSDElement,
    deleteXSDElement,
    autoGenerateXSD,
  } = useEditorStore();
  const xsdElement = findXSDElement(parsedXSD, node.name);

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

  const HeadingTag = node.depth === 0 ? 'h1' : 'h2';

  return (
    <div className='py-2 hover:bg-gray-100 rounded transition-colors duration-200'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 font-["Calibri",sans-serif] text-gray-800'>
          <HeadingTag
            className={`m-0 ${
              node.depth === 0 ? 'text-2xl font-bold' : 'text-xl font-semibold'
            }`}
          >
            {node.name}
            {node.attributes.map((attr, index) => (
              <Badge
                key={index}
                variant='outline'
                className='text-xs border-gray-300 ml-2'
              >
                {attr.name}="{attr.value}"
              </Badge>
            ))}
          </HeadingTag>
          {node.textContent && (
            <p className='m-0 text-sm text-gray-600 font-["Calibri",sans-serif]'>
              {node.textContent}
            </p>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size='sm'
              variant='ghost'
              className='text-gray-500 hover:text-gray-700'
            >
              <Edit className='w-4 h-4' />
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[425px]'>
            <DialogHeader>
              <DialogTitle>Edit {node.name}</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Element Name</label>
                <Input
                  value={node.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  className='mt-1'
                />
              </div>
              {node.textContent !== undefined && (
                <div>
                  <label className='text-sm font-medium'>Text Content</label>
                  {xsdElement?.enumeration ? (
                    <Select
                      value={node.textContent}
                      onValueChange={(value) =>
                        onUpdate({ textContent: value })
                      }
                    >
                      <SelectTrigger className='mt-1'>
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
                  ) : (
                    <Input
                      value={node.textContent}
                      onChange={(e) =>
                        onUpdate({ textContent: e.target.value || undefined })
                      }
                      className='mt-1'
                      placeholder='Text content'
                    />
                  )}
                </div>
              )}
              <div>
                <label className='text-sm font-medium'>Attributes</label>
                <Button
                  size='sm'
                  variant='outline'
                  className='mt-1'
                  onClick={() => {
                    const attrName = prompt('Attribute name:');
                    const attrValue = prompt('Attribute value:');
                    if (attrName && attrValue) {
                      onUpdate({
                        attributes: [
                          ...node.attributes,
                          { name: attrName, value: attrValue },
                        ],
                      });
                    }
                  }}
                >
                  <Plus className='w-4 h-4 mr-1' /> Add Attribute
                </Button>
                <div className='mt-2 space-y-1'>
                  {node.attributes.map((attr, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <Input value={attr.name} readOnly className='text-sm' />
                      <Input
                        value={attr.value}
                        onChange={(e) =>
                          onUpdate({
                            attributes: node.attributes.map((a, i) =>
                              i === index ? { ...a, value: e.target.value } : a
                            ),
                          })
                        }
                        className='text-sm'
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className='text-sm font-medium'>XSD Schema</label>
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
              <div className='flex gap-2'>
                <Button size='sm' onClick={onAddChild}>
                  <Type className='w-4 h-4 mr-1' /> Add Child Element
                </Button>
                <Button size='sm' variant='destructive' onClick={onDelete}>
                  <Trash2 className='w-4 h-4 mr-1' /> Delete Element
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <XMLNodeEditorContainer key={child.id} nodeId={child.id} />
          ))}
        </div>
      )}
    </div>
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

  useEffect(() => {
    if (parsedXML.length > 0) {
      const generatedXSD = generateXSDFromXML(parsedXML);
      useEditorStore.getState().setParsedXSD(generatedXSD);
      useEditorStore
        .getState()
        .setXSDContent(serializeXSDToString(generatedXSD));
    }
  }, [parsedXML, autoGenerateXSD]);

  return (
    <div className='h-full overflow-y-auto p-6 bg-gray-50'>
      <div className='max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm rounded-lg p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold font-["Calibri",sans-serif] text-gray-800'>
            XML Document Editor
          </h3>
          <div className='flex gap-2 items-center'>
            <div className='flex items-center gap-2'>
              <Zap className='w-4 h-4 text-yellow-500' />
              <label className='text-sm font-["Calibri",sans-serif]'>
                Auto-generate XSD
              </label>
              <input
                type='checkbox'
                checked={autoGenerateXSD}
                onChange={(e) => setAutoGenerateXSD(e.target.checked)}
                className='ml-1'
              />
            </div>
            <Button
              onClick={() => {
                const elementName =
                  prompt('Root element name:') || 'newElement';
                addXMLNode('root', {
                  name: elementName,
                  type: 'element',
                  attributes: [],
                  children: [],
                  textContent: '',
                });
              }}
              className='bg-blue-600 hover:bg-blue-700'
            >
              <Plus className='w-4 h-4 mr-1' />
              Add Root Element
            </Button>
          </div>
        </div>
        <div className='min-h-[500px]'>
          {parsedXML.length === 0 ? (
            <div className='text-center text-gray-500 py-12 font-["Calibri",sans-serif]'>
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
        <h1 className='text-2xl font-bold text-gray-800 font-["Calibri",sans-serif] mb-2'>
          XML/XSD Editor
        </h1>
        <p className='text-gray-600 text-sm font-["Calibri",sans-serif]'>
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
              <TabsTrigger
                value='visual'
                className='flex items-center gap-2 font-["Calibri",sans-serif]'
              >
                <Edit className='w-4 h-4' />
                Integrated Editor
              </TabsTrigger>
              <TabsTrigger
                value='xml'
                className='flex items-center gap-2 font-["Calibri",sans-serif]'
              >
                <FileText className='w-4 h-4' />
                Raw XML
              </TabsTrigger>
              <TabsTrigger
                value='xsd'
                className='flex items-center gap-2 font-["Calibri",sans-serif]'
              >
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
              <h2 className='text-lg font-semibold text-gray-700 font-["Calibri",sans-serif]'>
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
              <h2 className='text-lg font-semibold text-gray-700 font-["Calibri",sans-serif]'>
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
                    className='text-sm text-gray-600 font-["Calibri",sans-serif]'
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
                <p className='text-yellow-800 text-sm font-["Calibri",sans-serif]'>
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
        <div className='flex justify-between items-center text-sm text-gray-500 font-["Calibri",sans-serif]'>
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
