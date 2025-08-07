// @ts-nocheck

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
  FileCode,
} from 'lucide-react';

// Types
interface XMLAttribute {
  name: string;
  value: string;
}

interface XMLNode {
  id: string;
  name: string;
  type: 'element' | 'text' | 'cdata' | 'comment' | 'pi';
  attributes: XMLAttribute[];
  children: XMLNode[];
  content?: string; // For text, CDATA, comment, or PI content
  parent?: string;
}

interface XSDAttribute {
  id: string;
  name: string;
  type: string;
  use?: 'required' | 'optional' | 'prohibited';
}

interface XSDAnnotation {
  id: string;
  documentation?: string;
  appInfo?: string;
}

interface XSDElement {
  id: string;
  name: string;
  type: string;
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
  enumeration?: string[];
  restriction?: {
    base: string;
    pattern?: string;
    length?: number;
    minLength?: number;
    maxLength?: number;
  };
  attributes?: XSDAttribute[];
  annotation?: XSDAnnotation;
}

interface XSDComplexType {
  id: string;
  name: string;
  elements: XSDElement[];
  attributes?: XSDAttribute[];
  annotation?: XSDAnnotation;
  mixed?: boolean;
}

interface XSDSimpleType {
  id: string;
  name: string;
  restriction?: {
    base: string;
    enumeration?: string[];
    pattern?: string;
    length?: number;
    minLength?: number;
    maxLength?: number;
  };
  annotation?: XSDAnnotation;
}

// Zustand Store
interface EditorStore {
  xmlContent: string;
  xsdContent: string;
  parsedXML: XMLNode[];
  parsedXSD: (XSDComplexType | XSDSimpleType)[];
  activeTab: 'xml' | 'xsd' | 'visual';
  autoGenerateXSD: boolean;

  setXMLContent: (content: string) => void;
  setXSDContent: (content: string) => void;
  setParsedXML: (nodes: XMLNode[]) => void;
  setParsedXSD: (types: (XSDComplexType | XSDSimpleType)[]) => void;
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
  addXSDSimpleType: (type: Omit<XSDSimpleType, 'id'>) => void;
}

const useEditorStore = create<EditorStore>((set, get) => ({
  xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="style.xsl"?>
<!-- Sample XML document -->
<person id="1">
  <name>John Doe</name>
  <age>30</age>
  <email><![CDATA[john@example.com]]></email>
</person>`,
  xsdContent: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:simpleType name="EmailType">
    <xs:restriction base="xs:string">
      <xs:pattern value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"/>
    </xs:restriction>
  </xs:simpleType>
  <xs:complexType name="PersonType" mixed="true">
    <xs:sequence>
      <xs:element name="name" type="xs:string">
        <xs:annotation>
          <xs:documentation>Name of the person</xs:documentation>
        </xs:annotation>
      </xs:element>
      <xs:element name="age" type="xs:int"/>
      <xs:element name="email" type="EmailType"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string" use="required"/>
  </xs:complexType>
  <xs:element name="person" type="PersonType"/>
</xs:schema>`,
  parsedXML: [],
  parsedXSD: [],
  activeTab: 'xml',
  autoGenerateXSD: true,

  setXMLContent: (content) => set({ xmlContent: content }),
  setXSDContent: (content) => set({ xsdContent: content }),
  setParsedXML: (nodes) => set({ parsedXML: nodes }),
  setParsedXSD: (types) => set({ parsedXSD: types }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setAutoGenerateXSD: (auto) => set({ autoGenerateXSD: auto }),

  addXMLNode: (parentId, node) => {
    const { parsedXML } = get();
    const newNode = { ...node, id: `node_${Date.now()}_${Math.random()}` };

    const addToParent = (nodes: XMLNode[]): XMLNode[] => {
      return nodes.map((n) => {
        if (n.id === parentId) {
          return { ...n, children: [...n.children, newNode] };
        }
        return { ...n, children: addToParent(n.children) };
      });
    };

    if (parentId === 'root') {
      set({ parsedXML: [...parsedXML, newNode] });
    } else {
      set({ parsedXML: addToParent(parsedXML) });
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
          ? { ...type, elements: [...(type.elements || []), newElement] }
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
              elements:
                type.elements?.map((elem) =>
                  elem.id === elementId ? { ...elem, ...updates } : elem
                ) || [],
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
              elements:
                type.elements?.filter((elem) => elem.id !== elementId) || [],
            }
          : type
      ),
    });
  },

  addXSDComplexType: (type) => {
    const { parsedXSD } = get();
    const newType = {
      ...type,
      id: `type_${Date.now()}_${Math.random()}`,
      elements: type.elements || [],
    };
    set({ parsedXSD: [...parsedXSD, newType] });
  },

  addXSDSimpleType: (type) => {
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
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error('Invalid XML');
    }

    const convertDOMToNode = (
      node: Node,
      parentId?: string
    ): XMLNode | null => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        const attributes: XMLAttribute[] = Array.from(element.attributes).map(
          (attr) => ({
            name: attr.name,
            value: attr.value,
          })
        );

        const children: XMLNode[] = [];
        Array.from(element.childNodes).forEach((child) => {
          const childNode = convertDOMToNode(
            child,
            `node_${Date.now()}_${Math.random()}`
          );
          if (childNode) {
            children.push(childNode);
          }
        });

        return {
          id: `node_${Date.now()}_${Math.random()}`,
          name: element.tagName,
          type: 'element',
          attributes,
          children,
          parent: parentId,
        };
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        return {
          id: `node_${Date.now()}_${Math.random()}`,
          name: 'text',
          type: 'text',
          attributes: [],
          children: [],
          content: node.textContent.trim(),
          parent: parentId,
        };
      } else if (node.nodeType === Node.CDATA_SECTION_NODE) {
        return {
          id: `node_${Date.now()}_${Math.random()}`,
          name: 'cdata',
          type: 'cdata',
          attributes: [],
          children: [],
          content: node.textContent || '',
          parent: parentId,
        };
      } else if (node.nodeType === Node.COMMENT_NODE) {
        return {
          id: `node_${Date.now()}_${Math.random()}`,
          name: 'comment',
          type: 'comment',
          attributes: [],
          children: [],
          content: node.textContent || '',
          parent: parentId,
        };
      } else if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
        const pi = node as ProcessingInstruction;
        return {
          id: `node_${Date.now()}_${Math.random()}`,
          name: pi.target,
          type: 'pi',
          attributes: [],
          children: [],
          content: pi.data,
          parent: parentId,
        };
      }
      return null;
    };

    const nodes: XMLNode[] = [];
    Array.from(doc.childNodes).forEach((node) => {
      const converted = convertDOMToNode(node);
      if (
        converted &&
        converted.type !== 'text' &&
        converted.type !== 'cdata'
      ) {
        nodes.push(converted);
      }
    });
    return nodes;
  } catch (error) {
    console.error('XML parsing error:', error);
    return [];
  }
};

const generateXSDFromXML = (
  xmlNodes: XMLNode[]
): (XSDComplexType | XSDSimpleType)[] => {
  const types: Map<string, XSDComplexType | XSDSimpleType> = new Map();

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
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
      return 'EmailType';
    }
    return 'xs:string';
  };

  const processNode = (node: XMLNode) => {
    if (node.type !== 'element') return;

    const typeName = `${
      node.name.charAt(0).toUpperCase() + node.name.slice(1)
    }Type`;

    if (!types.has(typeName)) {
      types.set(typeName, {
        id: `type_${Date.now()}_${node.name}`,
        name: typeName,
        elements: [],
        attributes: node.attributes.map((attr) => ({
          id: `attr_${Date.now()}_${attr.name}`,
          name: attr.name,
          type: 'xs:string',
          use: 'optional',
        })),
        mixed: node.children.some(
          (child) => child.type === 'text' || child.type === 'cdata'
        ),
      });
    }

    const complexType = types.get(typeName) as XSDComplexType;

    node.children.forEach((child) => {
      if (child.type === 'element') {
        const existingElement = complexType.elements?.find(
          (el) => el.name === child.name
        );

        if (!existingElement) {
          let elementType = 'xs:string';
          let restriction: XSDElement['restriction'];

          if (
            child.content &&
            (child.type === 'text' || child.type === 'cdata')
          ) {
            elementType = inferType(child.content);
            if (elementType === 'EmailType') {
              types.set('EmailType', {
                id: `type_${Date.now()}_EmailType`,
                name: 'EmailType',
                restriction: {
                  base: 'xs:string',
                  pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
                },
              });
            }
          } else if (child.children.length > 0) {
            elementType = `${
              child.name.charAt(0).toUpperCase() + child.name.slice(1)
            }Type`;
          }

          complexType.elements?.push({
            id: `elem_${Date.now()}_${child.name}`,
            name: child.name,
            type: elementType,
            minOccurs: 1,
            maxOccurs: 1,
            attributes: child.attributes.map((attr) => ({
              id: `attr_${Date.now()}_${attr.name}`,
              name: attr.name,
              type: 'xs:string',
              use: 'optional',
            })),
            annotation: {
              id: `anno_${Date.now()}_${child.name}`,
              documentation: `Element ${child.name}`,
            },
          });
        }

        if (child.children.length > 0) {
          processNode(child);
        }
      }
    });
  };

  xmlNodes.forEach(processNode);
  return Array.from(types.values());
};

const serializeXSDToString = (
  xsdTypes: (XSDComplexType | XSDSimpleType)[]
): string => {
  let xsdContent = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
`;

  xsdTypes.forEach((type) => {
    if ('elements' in type) {
      // ComplexType
      xsdContent += `  <xs:complexType name="${type.name}"${
        type.mixed ? ' mixed="true"' : ''
      }>
`;
      if (type.annotation?.documentation) {
        xsdContent += `    <xs:annotation>
      <xs:documentation>${type.annotation.documentation}</xs:documentation>
    </xs:annotation>
`;
      }
      xsdContent += `    <xs:sequence>
`;
      type.elements?.forEach((element) => {
        const minOccurs =
          element.minOccurs !== 1 ? ` minOccurs="${element.minOccurs}"` : '';
        const maxOccurs =
          element.maxOccurs !== 1 ? ` maxOccurs="${element.maxOccurs}"` : '';
        xsdContent += `      <xs:element name="${element.name}" type="${element.type}"${minOccurs}${maxOccurs}>
`;
        if (element.annotation?.documentation) {
          xsdContent += `        <xs:annotation>
          <xs:documentation>${element.annotation.documentation}</xs:documentation>
        </xs:annotation>
`;
        }
        if (element.attributes?.length) {
          element.attributes.forEach((attr) => {
            xsdContent += `        <xs:attribute name="${attr.name}" type="${attr.type}" use="${attr.use}"/>
`;
          });
        }
        xsdContent += `      </xs:element>
`;
      });
      xsdContent += `    </xs:sequence>
`;
      if (type.attributes?.length) {
        type.attributes.forEach((attr) => {
          xsdContent += `    <xs:attribute name="${attr.name}" type="${attr.type}" use="${attr.use}"/>
`;
        });
      }
      xsdContent += `  </xs:complexType>
`;
    } else {
      // SimpleType
      xsdContent += `  <xs:simpleType name="${type.name}">
`;
      if (type.annotation?.documentation) {
        xsdContent += `    <xs:annotation>
      <xs:documentation>${type.annotation.documentation}</xs:documentation>
    </xs:annotation>
`;
      }
      if (type.restriction) {
        xsdContent += `    <xs:restriction base="${type.restriction.base}">
`;
        if (type.restriction.pattern) {
          xsdContent += `      <xs:pattern value="${type.restriction.pattern}"/>
`;
        }
        if (type.restriction.enumeration) {
          type.restriction.enumeration.forEach((value) => {
            xsdContent += `      <xs:enumeration value="${value}"/>
`;
          });
        }
        if (type.restriction.length) {
          xsdContent += `      <xs:length value="${type.restriction.length}"/>
`;
        }
        if (type.restriction.minLength) {
          xsdContent += `      <xs:minLength value="${type.restriction.minLength}"/>
`;
        }
        if (type.restriction.maxLength) {
          xsdContent += `      <xs:maxLength value="${type.restriction.maxLength}"/>
`;
        }
        xsdContent += `    </xs:restriction>
`;
      }
      xsdContent += `  </xs:simpleType>
`;
    }
  });

  xsdContent += `</xs:schema>`;
  return xsdContent;
};

const parseXSDToTypes = (
  xsdString: string
): (XSDComplexType | XSDSimpleType)[] => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xsdString, 'text/xml');
    if (doc.documentElement.nodeName === 'parsererror') {
      throw new Error('Invalid XSD');
    }

    const types: (XSDComplexType | XSDSimpleType)[] = [];

    // Parse Simple Types
    const simpleTypes = Array.from(doc.querySelectorAll('simpleType'));
    simpleTypes.forEach((simpleType, index) => {
      const name = simpleType.getAttribute('name') || `SimpleType${index}`;
      const restrictionEl = simpleType.querySelector('restriction');
      const restriction: XSDSimpleType['restriction'] = restrictionEl
        ? {
            base: restrictionEl.getAttribute('base') || 'xs:string',
            pattern:
              restrictionEl.querySelector('pattern')?.getAttribute('value') ||
              undefined,
            enumeration: Array.from(
              restrictionEl.querySelectorAll('enumeration')
            ).map((enumEl) => enumEl.getAttribute('value') || ''),
            length: restrictionEl.querySelector('length')?.getAttribute('value')
              ? parseInt(
                  restrictionEl.querySelector('length')!.getAttribute('value')!
                )
              : undefined,
            minLength: restrictionEl
              .querySelector('minLength')
              ?.getAttribute('value')
              ? parseInt(
                  restrictionEl
                    .querySelector('minLength')!
                    .getAttribute('value')!
                )
              : undefined,
            maxLength: restrictionEl
              .querySelector('maxLength')
              ?.getAttribute('value')
              ? parseInt(
                  restrictionEl
                    .querySelector('maxLength')!
                    .getAttribute('value')!
                )
              : undefined,
          }
        : undefined;

      const annotationEl = simpleType.querySelector('annotation');
      const annotation: XSDAnnotation | undefined = annotationEl
        ? {
            id: `anno_${Date.now()}_${index}`,
            documentation:
              annotationEl.querySelector('documentation')?.textContent ||
              undefined,
            appInfo:
              annotationEl.querySelector('appInfo')?.textContent || undefined,
          }
        : undefined;

      types.push({
        id: `type_${Date.now()}_${index}`,
        name,
        restriction,
        annotation,
      });
    });

    // Parse Complex Types
    const complexTypes = Array.from(doc.querySelectorAll('complexType'));
    complexTypes.forEach((complexType, index) => {
      const name = complexType.getAttribute('name') || `ComplexType${index}`;
      const mixed = complexType.getAttribute('mixed') === 'true';
      const elements = Array.from(complexType.querySelectorAll('element')).map(
        (elem, elemIndex) => {
          const restrictionEl = elem.querySelector('restriction');
          const annotationEl = elem.querySelector('annotation');
          const elementAttributes = Array.from(
            elem.querySelectorAll('attribute')
          ).map((attr, attrIndex) => ({
            id: `attr_${Date.now()}_${attrIndex}`,
            name: attr.getAttribute('name') || 'attribute',
            type: attr.getAttribute('type') || 'xs:string',
            use: attr.getAttribute('use') || 'optional',
          }));

          return {
            id: `elem_${Date.now()}_${elemIndex}`,
            name: elem.getAttribute('name') || 'element',
            type: elem.getAttribute('type') || 'xs:string',
            minOccurs: parseInt(elem.getAttribute('minOccurs') || '1'),
            maxOccurs:
              elem.getAttribute('maxOccurs') === 'unbounded'
                ? 'unbounded'
                : parseInt(elem.getAttribute('maxOccurs') || '1'),
            restriction: restrictionEl
              ? {
                  base: restrictionEl.getAttribute('base') || 'xs:string',
                  pattern:
                    restrictionEl
                      .querySelector('pattern')
                      ?.getAttribute('value') || undefined,
                  enumeration: Array.from(
                    restrictionEl.querySelectorAll('enumeration')
                  ).map((enumEl) => enumEl.getAttribute('value') || ''),
                  length: restrictionEl
                    .querySelector('length')
                    ?.getAttribute('value')
                    ? parseInt(
                        restrictionEl
                          .querySelector('length')!
                          .getAttribute('value')!
                      )
                    : undefined,
                  minLength: restrictionEl
                    .querySelector('minLength')
                    ?.getAttribute('value')
                    ? parseInt(
                        restrictionEl
                          .querySelector('minLength')!
                          .getAttribute('value')!
                      )
                    : undefined,
                  maxLength: restrictionEl
                    .querySelector('maxLength')
                    ?.getAttribute('value')
                    ? parseInt(
                        restrictionEl
                          .querySelector('maxLength')!
                          .getAttribute('value')!
                      )
                    : undefined,
                }
              : undefined,
            attributes: elementAttributes.length
              ? elementAttributes
              : undefined,
            annotation: annotationEl
              ? {
                  id: `anno_${Date.now()}_${elemIndex}`,
                  documentation:
                    annotationEl.querySelector('documentation')?.textContent ||
                    undefined,
                  appInfo:
                    annotationEl.querySelector('appInfo')?.textContent ||
                    undefined,
                }
              : undefined,
          };
        }
      );

      const typeAttributes = Array.from(
        complexType.querySelectorAll('attribute')
      ).map((attr, attrIndex) => ({
        id: `attr_${Date.now()}_${attrIndex}`,
        name: attr.getAttribute('name') || 'attribute',
        type: attr.getAttribute('type') || 'xs:string',
        use: attr.getAttribute('use') || 'optional',
      }));

      const annotationEl = complexType.querySelector('annotation');
      const annotation: XSDAnnotation | undefined = annotationEl
        ? {
            id: `anno_${Date.now()}_${index}`,
            documentation:
              annotationEl.querySelector('documentation')?.textContent ||
              undefined,
            appInfo:
              annotationEl.querySelector('appInfo')?.textContent || undefined,
          }
        : undefined;

      types.push({
        id: `type_${Date.now()}_${index}`,
        name,
        elements,
        attributes: typeAttributes.length ? typeAttributes : undefined,
        annotation,
        mixed,
      });
    });

    return types;
  } catch (error) {
    console.error('XSD parsing error:', error);
    return [];
  }
};

const serializeNodesToXML = (nodes: XMLNode[]): string => {
  const serializeNode = (node: XMLNode, indent = 0): string => {
    const spaces = '  '.repeat(indent);

    if (node.type === 'comment') {
      return `${spaces}<!--${node.content}-->`;
    }
    if (node.type === 'pi') {
      return `${spaces}<?${node.name} ${node.content}?>`;
    }
    if (node.type === 'cdata') {
      return `${spaces}<![CDATA[${node.content}]]>`;
    }
    if (node.type === 'text') {
      return `${spaces}${node.content}`;
    }

    const attrs = node.attributes
      .map((attr) => `${attr.name}="${attr.value}"`)
      .join(' ');
    const attrString = attrs ? ` ${attrs}` : '';

    if (node.children.length === 0 && !node.content) {
      return `${spaces}<${node.name}${attrString}/>`;
    }

    let content = '';
    if (node.content) {
      content = node.content;
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

const XMLNodeEditor: React.FC<{
  node: XMLNode;
  onUpdate: (updates: Partial<XMLNode>) => void;
  onDelete: () => void;
  onAddChild: () => void;
}> = ({ node, onUpdate, onDelete, onAddChild }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [editContent, setEditContent] = useState(node.content || '');
  const [editType, setEditType] = useState(node.type);

  const handleSave = () => {
    onUpdate({
      name: editName,
      type: editType,
      content: editContent || undefined,
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

  return (
    <Card className='mb-3'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isEditing ? (
              <>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='element'>Element</SelectItem>
                    <SelectItem value='text'>Text</SelectItem>
                    <SelectItem value='cdata'>CDATA</SelectItem>
                    <SelectItem value='comment'>Comment</SelectItem>
                    <SelectItem value='pi'>Processing Instruction</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className='w-32'
                  disabled={editType === 'text' || editType === 'cdata'}
                />
              </>
            ) : (
              <CardTitle className='text-base'>
                {node.type === 'element'
                  ? `&lt;${node.name}&gt;`
                  : node.type === 'cdata'
                  ? 'CDATA'
                  : node.type === 'comment'
                  ? 'Comment'
                  : node.type === 'pi'
                  ? `<?${node.name}?>`
                  : 'Text'}
              </CardTitle>
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
            {node.type === 'element' && (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleAddAttribute}
                >
                  <Plus className='w-3 h-3' />
                </Button>
                <Button size='sm' variant='outline' onClick={onAddChild}>
                  <Type className='w-3 h-3' />
                </Button>
              </>
            )}
            <Button size='sm' variant='destructive' onClick={onDelete}>
              <Trash2 className='w-3 h-3' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        {(node.content !== undefined || node.type !== 'element') && (
          <div className='mb-2'>
            {isEditing ? (
              <Input
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder={
                  node.type === 'comment'
                    ? 'Comment content'
                    : node.type === 'pi'
                    ? 'PI data'
                    : node.type === 'cdata'
                    ? 'CDATA content'
                    : 'Text content'
                }
                className='text-sm'
              />
            ) : (
              <div className='p-2 bg-gray-50 rounded text-sm'>
                {node.content || (
                  <span className='text-gray-400'>No content</span>
                )}
              </div>
            )}
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
        const type =
          prompt('Node type (element/text/cdata/comment/pi):') || 'element';
        const name =
          type === 'element'
            ? prompt('Element name:') || 'newElement'
            : type === 'pi'
            ? prompt('PI target:') || 'xml-stylesheet'
            : type;
        const content =
          type !== 'element' ? prompt('Content:') || '' : undefined;
        addXMLNode(nodeId, {
          name,
          type: type as XMLNode['type'],
          attributes: [],
          children: [],
          content,
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
  const [editAnnotation, setEditAnnotation] = useState(
    element.annotation?.documentation || ''
  );

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
          {element.attributes?.map((attr) => (
            <Badge key={attr.id} variant='secondary' className='text-xs'>
              attr: {attr.name} ({attr.use})
            </Badge>
          ))}
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
        <div className='mt-2 grid grid-cols-2 gap-2'>
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
              <SelectItem value='EmailType'>Email</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={element.minOccurs?.toString() || '1'}
            onChange={(e) =>
              onUpdate({ minOccurs: parseInt(e.target.value) || 1 })
            }
            placeholder='Min occurs'
            type='number'
            className='text-sm'
          />
          <Input
            value={element.maxOccurs?.toString() || '1'}
            onChange={(e) =>
              onUpdate({
                maxOccurs:
                  e.target.value === 'unbounded'
                    ? 'unbounded'
                    : parseInt(e.target.value) || 1,
              })
            }
            placeholder='Max occurs'
            className='text-sm'
          />
          <Input
            value={editAnnotation}
            onChange={(e) => setEditAnnotation(e.target.value)}
            placeholder='Documentation'
            className='text-sm'
            onBlur={() =>
              onUpdate({
                annotation: {
                  ...element.annotation,
                  documentation: editAnnotation,
                  id: element.annotation?.id || `anno_${Date.now()}`,
                },
              })
            }
          />
        </div>
      )}
    </div>
  );
};

const XSDTypeEditor: React.FC<{
  type: XSDComplexType | XSDSimpleType;
  onUpdateElement?: (elementId: string, updates: Partial<XSDElement>) => void;
  onDeleteElement?: (elementId: string) => void;
  onAddElement?: () => void;
}> = ({ type, onUpdateElement, onDeleteElement, onAddElement }) => {
  const isComplex = 'elements' in type;
  const [isEditing, setIsEditing] = useState(false);
  const [editAnnotation, setEditAnnotation] = useState(
    type.annotation?.documentation || ''
  );

  const { updateXSDElement, addXSDElement } = useEditorStore();

  return (
    <Card className='mb-3 border-blue-200'>
      <CardHeader className='pb-2'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-base text-blue-700'>
            {type.name} {isComplex ? '(Complex)' : '(Simple)'}
          </CardTitle>
          <div className='flex gap-1'>
            {isComplex && (
              <Button size='sm' onClick={onAddElement} variant='outline'>
                <Plus className='w-3 h-3 mr-1' />
                Add Element
              </Button>
            )}
            <Button
              size='sm'
              variant='outline'
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className='w-3 h-3' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-0'>
        {isEditing && (
          <Input
            value={editAnnotation}
            onChange={(e) => setEditAnnotation(e.target.value)}
            placeholder='Documentation'
            className='text-sm mb-2'
            onBlur={() => {
              const { parsedXSD } = useEditorStore.getState();
              useEditorStore.setState({
                parsedXSD: parsedXSD.map((t) =>
                  t.id === type.id
                    ? {
                        ...t,
                        annotation: {
                          ...t.annotation,
                          documentation: editAnnotation,
                          id: t.annotation?.id || `anno_${Date.now()}`,
                        },
                      }
                    : t
                ),
              });
            }}
          />
        )}
        {isComplex &&
          type.elements?.map((element) => (
            <XSDElementEditor
              key={element.id}
              element={element}
              onUpdate={(updates) => onUpdateElement?.(element.id, updates)}
              onDelete={() => onDeleteElement?.(element.id)}
            />
          ))}
        {!isComplex && type.restriction && (
          <div className='p-2 bg-gray-50 rounded text-sm'>
            <p>Base: {type.restriction.base}</p>
            {type.restriction.pattern && (
              <p>Pattern: {type.restriction.pattern}</p>
            )}
            {type.restriction.enumeration && (
              <p>Enumeration: {type.restriction.enumeration.join(', ')}</p>
            )}
            {type.restriction.length && (
              <p>Length: {type.restriction.length}</p>
            )}
            {type.restriction.minLength && (
              <p>Min Length: {type.restriction.minLength}</p>
            )}
            {type.restriction.maxLength && (
              <p>Max Length: {type.restriction.maxLength}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CombinedVisualEditor: React.FC = () => {
  const {
    parsedXML,
    parsedXSD,
    autoGenerateXSD,
    addXMLNode,
    addXSDElement,
    addXSDComplexType,
    addXSDSimpleType,
    setAutoGenerateXSD,
  } = useEditorStore();

  return (
    <div className='h-full overflow-y-auto p-4'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold'>Combined Visual Editor</h3>
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
              const type =
                prompt('Node type (element/comment/pi):') || 'element';
              const name =
                type === 'element'
                  ? prompt('Element name:') || 'newElement'
                  : type === 'pi'
                  ? prompt('PI target:') || 'xml-stylesheet'
                  : type;
              const content =
                type !== 'element' ? prompt('Content:') || '' : undefined;
              addXMLNode('root', {
                name,
                type: type as XMLNode['type'],
                attributes: [],
                children: [],
                content,
              });
            }}
          >
            <Plus className='w-4 h-4 mr-1' />
            Add XML Node
          </Button>
          {!autoGenerateXSD && (
            <Button
              onClick={() => {
                const type = prompt('Type (complex/simple):') || 'complex';
                const name =
                  prompt('Type name:') ||
                  `New${type.charAt(0).toUpperCase() + type.slice(1)}Type`;
                if (type === 'simple') {
                  addXSDSimpleType({
                    name,
                    restriction: { base: 'xs:string' },
                    annotation: {
                      id: `anno_${Date.now()}`,
                      documentation: `Simple type ${name}`,
                    },
                  });
                } else {
                  addXSDComplexType({
                    name,
                    elements: [],
                    annotation: {
                      id: `anno_${Date.now()}`,
                      documentation: `Complex type ${name}`,
                    },
                  });
                }
              }}
            >
              <Plus className='w-4 h-4 mr-1' />
              Add XSD Type
            </Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div>
          <div className='flex items-center gap-2 mb-3'>
            <FileText className='w-5 h-5 text-green-600' />
            <h4 className='font-semibold text-green-700'>
              XML Document Structure
            </h4>
          </div>
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {parsedXML.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <FileText className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>No XML nodes. Add some nodes to get started.</p>
              </div>
            ) : (
              parsedXML.map((node) => (
                <XMLNodeEditorContainer key={node.id} nodeId={node.id} />
              ))
            )}
          </div>
        </div>

        <div>
          <div className='flex items-center gap-2 mb-3'>
            <List className='w-5 h-5 text-blue-600' />
            <h4 className='font-semibold text-blue-700'>
              XSD Schema Structure
            </h4>
            {autoGenerateXSD && (
              <Badge variant='secondary' className='text-xs'>
                <Zap className='w-3 h-3 mr-1' />
                Auto-generated
              </Badge>
            )}
          </div>
          <div className='space-y-3 max-h-96 overflow-y-auto'>
            {parsedXSD.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <List className='w-12 h-12 mx-auto mb-2 text-gray-300' />
                <p>
                  No XSD types.{' '}
                  {autoGenerateXSD
                    ? 'Add XML elements to auto-generate schema.'
                    : 'Add some types to get started.'}
                </p>
              </div>
            ) : (
              parsedXSD.map((type) => (
                <XSDTypeEditor
                  key={type.id}
                  type={type}
                  onUpdateElement={(elementId, updates) =>
                    'elements' in type &&
                    updateXSDElement(type.id, elementId, updates)
                  }
                  onDeleteElement={(elementId) =>
                    'elements' in type &&
                    useEditorStore
                      .getState()
                      .deleteXSDElement(type.id, elementId)
                  }
                  onAddElement={() => {
                    if ('elements' in type) {
                      const elementName =
                        prompt('Element name:') || 'newElement';
                      addXSDElement(type.id, {
                        name: elementName,
                        type: 'xs:string',
                        minOccurs: 1,
                        maxOccurs: 1,
                        annotation: {
                          id: `anno_${Date.now()}`,
                          documentation: `Element ${elementName}`,
                        },
                      });
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const XMLXSDEditorRefactored: React.FC = () => {
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
          Create and edit XML documents with automatic XSD schema generation
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
              <TabsTrigger value='xml' className='flex items-center gap-2'>
                <FileText className='w-4 h-4' />
                XML Editor
              </TabsTrigger>
              <TabsTrigger value='xsd' className='flex items-center gap-2'>
                <List className='w-4 h-4' />
                XSD Editor
              </TabsTrigger>
              <TabsTrigger value='visual' className='flex items-center gap-2'>
                <Edit className='w-4 h-4' />
                Visual Editor
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='xml' className='flex-1 p-4 space-y-4'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-semibold text-gray-700'>
                XML Document
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
                XSD Schema
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

          <TabsContent value='visual' className='flex-1'>
            <CombinedVisualEditor />
          </TabsContent>
        </Tabs>
      </div>

      <div className='bg-white border-t p-4'>
        <div className='flex justify-between items-center text-sm text-gray-500'>
          <div className='flex items-center gap-4'>
            <span>XML Nodes: {parsedXML.length}</span>
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

export default XMLXSDEditorRefactored;
