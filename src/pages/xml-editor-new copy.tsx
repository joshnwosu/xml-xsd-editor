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
import { Plus, Trash2, Edit, Type, List, FileText, Zap } from 'lucide-react';

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

const getHeadingClass = (depth: number) => {
  if (depth === 0) return 'doc-title';
  if (depth === 1) return 'doc-section';
  if (depth === 2) return 'doc-subsection';
  return 'doc-heading';
};

const getContentClass = (type: string, name: string) => {
  if (name.toLowerCase().includes('email')) return 'doc-email';
  if (name.toLowerCase().includes('phone')) return 'doc-phone';
  if (type === 'xs:date') return 'doc-date';
  if (type === 'xs:int' || type === 'xs:decimal') return 'doc-number';
  if (
    name.toLowerCase().includes('paragraph') ||
    name.toLowerCase().includes('content')
  )
    return 'doc-paragraph';
  return 'doc-field';
};

const XMLNodeEditor: React.FC<{
  node: XMLNode;
  onUpdate: (updates: Partial<XMLNode>) => void;
  onDelete: () => void;
  onAddChild: () => void;
}> = ({ node, onUpdate, onDelete, onAddChild }) => {
  const { parsedXSD, updateXSDElement, addXSDElement, deleteXSDElement } =
    useEditorStore();
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

  const HeadingTag =
    node.depth === 0 ? 'h1' : (`h${Math.min(node.depth! + 1, 6)}` as any);

  const headingClass = getHeadingClass(node.depth || 0);
  const contentClass = getContentClass(
    xsdElement?.type || inferType(node.textContent || ''),
    node.name
  );

  return (
    <div className='py-2 hover:bg-gray-100 rounded transition-colors duration-200'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2 text-gray-800'>
          <HeadingTag
            className={`${headingClass} m-0`}
            data-level={node.depth! + 1}
          >
            {node.name}
          </HeadingTag>
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
      {node.attributes.length > 0 && (
        <div className='doc-metadata'>
          {node.attributes.map((attr, index) => (
            <Badge
              key={index}
              variant='outline'
              className='doc-attr border-gray-300 ml-2'
            >
              {attr.name}: {attr.value}
            </Badge>
          ))}
        </div>
      )}
      {node.textContent && <p className={contentClass}>{node.textContent}</p>}
      {node.children.length > 0 && (
        <div className='doc-content'>
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
      <div className='xml-document document-editor bg-white border border-gray-200 shadow-sm rounded-lg p-6 h-full'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold text-gray-800'>
            XML Document Editor
          </h3>
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
            <div className='no-xml-content'>
              <h3>No XML elements</h3>
              <p>Add some elements to get started.</p>
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

const EditorStyles: React.FC = () => {
  return (
    <style>{`
      /* Document container styling */
      .xml-document {
        max-width: none;
        font-family: sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background: white;
      }
      
      .document-editor {
        background: white !important;
      }
      
      /* Hide all XML structural elements completely */
      .xml-element,
      .xml-element-header,
      .xml-element-content,
      .xml-tag-name,
      .xml-attributes,
      .xml-attribute {
        display: none !important;
      }
      
      /* Document content elements - clean, document-like appearance */
      
      /* Headings */
      .doc-heading,
      h1, h2, h3, h4, h5, h6 {
        font-family: sans-serif;
        font-weight: bold;
        color: #111827;
        margin: 2rem 0 1rem 0;
        line-height: 1.2;
        page-break-after: avoid;
      }
      
      h1, .doc-heading[data-level="1"] {
        font-size: 2rem;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.5rem;
      }
      
      h2, .doc-heading[data-level="2"] {
        font-size: 1.75rem;
      }
      
      h3, .doc-heading[data-level="3"] {
        font-size: 1.5rem;
      }
      
      h4, .doc-heading[data-level="4"] {
        font-size: 1.25rem;
      }
      
      h5, h6 {
        font-size: 1.125rem;
      }
      
      /* Document title from your preview */
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
      
      /* Paragraphs */
      .doc-paragraph {
        font-size: 16px;
        line-height: 1.6;
        margin: 1rem 0;
        color: #374151;
        text-align: justify;
        text-indent: 0;
        background: transparent;
        border: none;
        outline: none;
        padding: 0;
        font-family: sans-serif;
      }
      
      .doc-paragraph:focus {
        background: #f9fafb;
        padding: 0.5rem;
        border-radius: 0.25rem;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Lists */
      .doc-list {
        margin: 1.5rem 0;
        padding-left: 0;
      }
      
      .doc-item {
        margin: 0.75rem 0 0.75rem 2rem;
        position: relative;
        line-height: 1.6;
        font-size: 16px;
        color: #374151;
        list-style: none;
      }
      
      .doc-item:before {
        content: "•";
        position: absolute;
        left: -1.5rem;
        color: #6b7280;
        font-weight: bold;
        font-size: 1.2em;
      }
      
      .doc-list[data-type="ordered"] {
        counter-reset: list-counter;
      }
      
      .doc-list[data-type="ordered"] .doc-item {
        counter-increment: list-counter;
      }
      
      .doc-list[data-type="ordered"] .doc-item:before {
        content: counter(list-counter) ".";
        left: -2rem;
        width: 1.5rem;
        text-align: right;
      }
      
      .doc-item:focus {
        background: #f9fafb;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Sections */
      .doc-section {
        margin: 2rem 0;
      }
      
      /* Quotes */
      .doc-quote {
        border-left: 4px solid #d1d5db;
        padding-left: 2rem;
        margin: 2rem 0;
        font-style: italic;
        color: #4b5563;
        font-size: 1.125rem;
        position: relative;
      }
      
      .doc-quote:before {
        content: """;
        font-size: 4rem;
        color: #d1d5db;
        position: absolute;
        left: -0.5rem;
        top: -1rem;
        font-family: Georgia, serif;
      }
      
      .doc-quote:focus {
        background: #f9fafb;
        padding: 1rem 1rem 1rem 2rem;
        border-radius: 0.5rem;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Code blocks */
      .doc-code {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin: 2rem 0;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #1f2937;
        overflow-x: auto;
        white-space: pre-wrap;
      }
      
      .doc-code:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Tables */
      .doc-table {
        width: 100%;
        border-collapse: collapse;
        margin: 2rem 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      
      .doc-table th,
      .doc-table td {
        padding: 0.75rem 1rem;
        border-right: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: top;
      }
      
      .doc-table th {
        background: #f9fafb;
        font-weight: bold;
      }
      
      .doc-table tr {
        border-bottom: 1px solid #e5e7eb;
      }
      
      .doc-table tr:last-child {
        border-bottom: none;
      }
      
      .doc-table th:last-child,
      .doc-table td:last-child {
        border-right: none;
      }
      
      .doc-table td:focus {
        background: #f3f4f6;
        outline: 2px solid #3b82f6;
        outline-offset: -2px;
      }
      
      /* Links */
      .doc-link {
        color: #2563eb;
        text-decoration: underline;
        text-decoration-color: #bfdbfe;
        text-underline-offset: 0.2em;
        transition: all 0.2s ease;
      }
      
      .doc-link:hover {
        color: #1d4ed8;
        text-decoration-color: #2563eb;
      }
      
      .doc-link:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 0.125rem;
      }
      
      /* Images */
      .doc-image {
        max-width: 100%;
        height: auto;
        margin: 2rem 0;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .doc-image:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Emphasis */
      .doc-emphasis,
      em {
        font-style: italic;
        color: #374151;
      }
      
      .doc-strong,
      strong {
        font-weight: bold;
        color: #111827;
      }
      
      /* Focus states for better accessibility */
      [contenteditable]:focus {
        outline: none;
      }
      
      [contenteditable] *:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 0.25rem;
      }
      
      /* Print styles */
      @media print {
        .document-editor {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 1in !important;
        }
        
        .doc-heading,
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        
        .doc-paragraph,
        .doc-item {
          orphans: 3;
          widows: 3;
        }
        
        .doc-section {
          page-break-inside: avoid;
        }
      }
      
      /* No content state */
      .no-xml-content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 400px;
      }
      
      .no-xml-content h3 {
        color: #6b7280;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
      }
      
      .no-xml-content p {
        color: #9ca3af;
        font-size: 1rem;
      }
      
      .error {
        color: #dc3545;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }
    `}</style>
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
    <>
      <EditorStyles />
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
                        const { setAutoGenerateXSD } =
                          useEditorStore.getState();
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
                    XSD is being automatically generated from your XML
                    structure.
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
              <span>
                XSD Types: {useEditorStore.getState().parsedXSD.length}
              </span>
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
    </>
  );
};

export default XMLXSDEditorNew;
