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
import { Plus, Trash2, Edit, Save, Type, List, FileText } from 'lucide-react';

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
  activeTab: 'xml' | 'xsd';

  setXMLContent: (content: string) => void;
  setXSDContent: (content: string) => void;
  setParsedXML: (nodes: XMLNode[]) => void;
  setParsedXSD: (types: XSDComplexType[]) => void;
  setActiveTab: (tab: 'xml' | 'xsd') => void;

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
</person>`,
  xsdContent: `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:complexType name="PersonType">
    <xs:sequence>
      <xs:element name="name" type="xs:string"/>
      <xs:element name="age" type="xs:int"/>
      <xs:element name="email" type="xs:string"/>
    </xs:sequence>
    <xs:attribute name="id" type="xs:string"/>
  </xs:complexType>
  <xs:element name="person" type="PersonType"/>
</xs:schema>`,
  parsedXML: [],
  parsedXSD: [],
  activeTab: 'xml',

  setXMLContent: (content) => set({ xmlContent: content }),
  setXSDContent: (content) => set({ xsdContent: content }),
  setParsedXML: (nodes) => set({ parsedXML: nodes }),
  setParsedXSD: (types) => set({ parsedXSD: types }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  addXMLNode: (parentId, node) => {
    const { parsedXML } = get();
    const newNode = { ...node, id: `node_${Date.now()}` };

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
    const newElement = { ...element, id: `elem_${Date.now()}` };

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
    const newType = { ...type, id: `type_${Date.now()}` };
    set({ parsedXSD: [...parsedXSD, newType] });
  },
}));

// Utility functions
const parseXMLToNodes = (xmlString: string): XMLNode[] => {
  // Simple XML parser for demo - in production use a proper XML parser
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
        children.push(convertDOMToNode(child as Element, `node_${Date.now()}`));
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
};

const parseXSDToTypes = (xsdString: string): XSDComplexType[] => {
  // Simple XSD parser for demo
  const parser = new DOMParser();
  const doc = parser.parseFromString(xsdString, 'text/xml');

  const complexTypes = Array.from(doc.querySelectorAll('complexType'));

  return complexTypes.map((complexType, index) => {
    const name = complexType.getAttribute('name') || `ComplexType${index}`;
    const elements = Array.from(complexType.querySelectorAll('element')).map(
      (elem, elemIndex) => ({
        id: `elem_${Date.now()}_${elemIndex}`,
        name: elem.getAttribute('name') || 'element',
        type: elem.getAttribute('type') || 'xs:string',
        minOccurs: parseInt(elem.getAttribute('minOccurs') || '1'),
        maxOccurs:
          elem.getAttribute('maxOccurs') === 'unbounded'
            ? ('unbounded' as const)
            : parseInt(elem.getAttribute('maxOccurs') || '1'),
      })
    );

    return {
      id: `type_${Date.now()}_${index}`,
      name,
      elements,
    };
  });
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

const XMLNodeEditor: React.FC<{
  node: XMLNode;
  onUpdate: (updates: Partial<XMLNode>) => void;
  onDelete: () => void;
  onAddChild: () => void;
  availableElements: string[];
}> = ({ node, onUpdate, onDelete, onAddChild, availableElements }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [editText, setEditText] = useState(node.textContent || '');

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

  return (
    <Card className='mb-4'>
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
              <CardTitle className='text-lg'>&lt;{node.name}&gt;</CardTitle>
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
                <Save className='w-4 h-4' />
              ) : (
                <Edit className='w-4 h-4' />
              )}
            </Button>
            <Button size='sm' variant='outline' onClick={handleAddAttribute}>
              <Plus className='w-4 h-4' />
            </Button>
            <Button size='sm' variant='outline' onClick={onAddChild}>
              <Type className='w-4 h-4' />
            </Button>
            <Button size='sm' variant='destructive' onClick={onDelete}>
              <Trash2 className='w-4 h-4' />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {node.textContent !== undefined && (
          <div className='mb-3'>
            {isEditing ? (
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder='Text content'
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
      availableElements={['name', 'age', 'email', 'address']}
    />
  );
};

const XSDElementEditor: React.FC<{
  element: XSDElement;
  onUpdate: (updates: Partial<XSDElement>) => void;
  onDelete: () => void;
}> = ({ element, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className='p-3 border rounded-md mb-2'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='font-medium'>{element.name}</span>
          <Badge variant='outline'>{element.type}</Badge>
          {element.minOccurs !== undefined && (
            <Badge variant='secondary'>min: {element.minOccurs}</Badge>
          )}
          {element.maxOccurs !== undefined && (
            <Badge variant='secondary'>max: {element.maxOccurs}</Badge>
          )}
        </div>
        <div className='flex gap-1'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className='w-4 h-4' />
          </Button>
          <Button size='sm' variant='destructive' onClick={onDelete}>
            <Trash2 className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {isEditing && (
        <div className='mt-3 grid grid-cols-2 gap-2'>
          <Input
            value={element.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder='Element name'
          />
          <Select
            value={element.type}
            onValueChange={(value) => onUpdate({ type: value })}
          >
            <SelectTrigger>
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
          <Input
            type='number'
            value={element.minOccurs || 0}
            onChange={(e) => onUpdate({ minOccurs: parseInt(e.target.value) })}
            placeholder='Min occurs'
          />
          <Input
            value={
              element.maxOccurs === 'unbounded'
                ? 'unbounded'
                : element.maxOccurs || 1
            }
            onChange={(e) =>
              onUpdate({
                maxOccurs:
                  e.target.value === 'unbounded'
                    ? 'unbounded'
                    : parseInt(e.target.value),
              })
            }
            placeholder='Max occurs'
          />
        </div>
      )}
    </div>
  );
};

const XSDComplexTypeEditor: React.FC<{
  complexType: XSDComplexType;
  onUpdateElement: (elementId: string, updates: Partial<XSDElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onAddElement: () => void;
}> = ({ complexType, onUpdateElement, onDeleteElement, onAddElement }) => {
  return (
    <Card className='mb-4'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>{complexType.name}</CardTitle>
          <Button size='sm' onClick={onAddElement}>
            <Plus className='w-4 h-4 mr-1' />
            Add Element
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {complexType.elements.map((element) => (
          <XSDElementEditor
            key={element.id}
            element={element}
            onUpdate={(updates) => onUpdateElement(element.id, updates)}
            onDelete={() => onDeleteElement(element.id)}
          />
        ))}
      </CardContent>
    </Card>
  );
};

const VisualEditor: React.FC = () => {
  const {
    parsedXML,
    parsedXSD,
    addXMLNode,
    addXSDElement,
    updateXSDElement,
    deleteXSDElement,
    addXSDComplexType,
  } = useEditorStore();

  return (
    <div className='h-full overflow-y-auto p-4'>
      <Tabs defaultValue='xml-visual' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='xml-visual'>XML Document</TabsTrigger>
          <TabsTrigger value='xsd-visual'>XSD Schema</TabsTrigger>
        </TabsList>

        <TabsContent value='xml-visual' className='mt-4'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>XML Document Structure</h3>
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
            >
              <Plus className='w-4 h-4 mr-1' />
              Add Root Element
            </Button>
          </div>

          <div className='space-y-4'>
            {parsedXML.map((node) => (
              <XMLNodeEditorContainer key={node.id} nodeId={node.id} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value='xsd-visual' className='mt-4'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-semibold'>XSD Schema Structure</h3>
            <Button
              onClick={() => {
                const typeName = prompt('Complex type name:') || 'NewType';
                addXSDComplexType({
                  name: typeName,
                  elements: [],
                });
              }}
            >
              <Plus className='w-4 h-4 mr-1' />
              Add Complex Type
            </Button>
          </div>

          <div className='space-y-4'>
            {parsedXSD.map((complexType) => (
              <XSDComplexTypeEditor
                key={complexType.id}
                complexType={complexType}
                onUpdateElement={(elementId, updates) =>
                  updateXSDElement(complexType.id, elementId, updates)
                }
                onDeleteElement={(elementId) =>
                  deleteXSDElement(complexType.id, elementId)
                }
                onAddElement={() => {
                  const elementName = prompt('Element name:') || 'newElement';
                  addXSDElement(complexType.id, {
                    name: elementName,
                    type: 'xs:string',
                    minOccurs: 1,
                    maxOccurs: 1,
                  });
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const XMLXSDEditorOld: React.FC = () => {
  const {
    xmlContent,
    xsdContent,
    activeTab,
    setXMLContent,
    setXSDContent,
    setActiveTab,
    setParsedXML,
    setParsedXSD,
    parsedXML,
  } = useEditorStore();

  // Parse initial content
  useEffect(() => {
    setParsedXML(parseXMLToNodes(xmlContent));
    setParsedXSD(parseXSDToTypes(xsdContent));
  }, []);

  // Sync changes from visual editor back to code
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
        setParsedXML(parseXMLToNodes(content));
      } catch (error) {
        console.error('XML parsing error:', error);
      }
    } else {
      setXSDContent(content);
      try {
        setParsedXSD(parseXSDToTypes(content));
      } catch (error) {
        console.error('XSD parsing error:', error);
      }
    }
  };

  return (
    <div className='h-screen flex'>
      {/* Left Panel - Code Editor */}
      <div className='w-1/2 border-r'>
        <div className='h-full flex flex-col'>
          <div className='border-b p-4'>
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as 'xml' | 'xsd')}
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='xml' className='flex items-center gap-2'>
                  <FileText className='w-4 h-4' />
                  XML
                </TabsTrigger>
                <TabsTrigger value='xsd' className='flex items-center gap-2'>
                  <List className='w-4 h-4' />
                  XSD
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className='flex-1'>
            <Tabs value={activeTab}>
              <TabsContent value='xml' className='h-full m-0'>
                <CodeEditor
                  value={xmlContent}
                  onChange={(content) => handleCodeChange(content, 'xml')}
                  language='xml'
                />
              </TabsContent>
              <TabsContent value='xsd' className='h-full m-0'>
                <CodeEditor
                  value={xsdContent}
                  onChange={(content) => handleCodeChange(content, 'xsd')}
                  language='xsd'
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Right Panel - Visual Editor */}
      <div className='w-1/2'>
        <div className='h-full flex flex-col'>
          <div className='border-b p-4'>
            <h2 className='text-xl font-semibold'>Visual Editor</h2>
            <p className='text-sm text-gray-600'>
              Edit your XML and XSD visually
            </p>
          </div>
          <div className='flex-1'>
            <VisualEditor />
          </div>
        </div>
      </div>
    </div>
  );
};

export default XMLXSDEditorOld;
