import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Eye, Code, Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface XMLElement {
  id: string;
  name: string;
  type: 'element' | 'attribute' | 'text';
  dataType: string;
  value?: string;
  required: boolean;
  children: XMLElement[];
  enumValues?: string[];
  minOccurs?: number;
  maxOccurs?: number | 'unbounded';
}

interface ValidationError {
  elementId: string;
  message: string;
}

const dataTypes = [
  'xs:string',
  'xs:int',
  'xs:integer',
  'xs:decimal',
  'xs:boolean',
  'xs:date',
  'xs:dateTime',
  'xs:time',
  'xs:double',
  'xs:float',
  'xs:long',
  'xs:short',
  'xs:byte',
  'xs:anyURI',
  'xs:base64Binary',
  'xs:hexBinary',
];

const XMLXSDEditor: React.FC = () => {
  const [rootElement, setRootElement] = useState<XMLElement>({
    id: '1',
    name: 'root',
    type: 'element',
    dataType: 'xs:string',
    required: true,
    children: [],
    minOccurs: 1,
    maxOccurs: 1,
  });

  const [selectedElement, setSelectedElement] = useState<string>('1');
  const [nextId, setNextId] = useState(2);
  const [activeTab, setActiveTab] = useState('editor');

  // Validation function
  const validateElement = useCallback(
    (element: XMLElement): ValidationError[] => {
      const errors: ValidationError[] = [];

      // Check element name
      if (!element.name || element.name.trim() === '') {
        errors.push({
          elementId: element.id,
          message: 'Element name cannot be empty',
        });
      } else if (!/^[a-zA-Z_][a-zA-Z0-9_.-]*$/.test(element.name)) {
        errors.push({
          elementId: element.id,
          message: 'Element name contains invalid characters',
        });
      }

      // Check for duplicate element names at the same level
      if (element.children) {
        const elementNames = element.children
          .filter((child) => child.type === 'element')
          .map((child) => child.name);
        const duplicateNames = elementNames.filter(
          (name, index) => elementNames.indexOf(name) !== index
        );
        if (duplicateNames.length > 0) {
          errors.push({
            elementId: element.id,
            message: `Duplicate element names found: ${duplicateNames.join(
              ', '
            )}`,
          });
        }

        // Check attribute names
        const attributeNames = element.children
          .filter((child) => child.type === 'attribute')
          .map((child) => child.name);
        const duplicateAttrs = attributeNames.filter(
          (name, index) => attributeNames.indexOf(name) !== index
        );
        if (duplicateAttrs.length > 0) {
          errors.push({
            elementId: element.id,
            message: `Duplicate attribute names found: ${duplicateAttrs.join(
              ', '
            )}`,
          });
        }
      }

      // Check minOccurs/maxOccurs for elements
      if (element.type === 'element') {
        if (element.minOccurs !== undefined && element.minOccurs < 0) {
          errors.push({
            elementId: element.id,
            message: 'minOccurs cannot be negative',
          });
        }
        if (typeof element.maxOccurs === 'number' && element.maxOccurs < 1) {
          errors.push({
            elementId: element.id,
            message: 'maxOccurs must be at least 1 or "unbounded"',
          });
        }
        if (
          element.minOccurs !== undefined &&
          typeof element.maxOccurs === 'number' &&
          element.minOccurs > element.maxOccurs
        ) {
          errors.push({
            elementId: element.id,
            message: 'minOccurs cannot be greater than maxOccurs',
          });
        }
      }

      // Validate enumeration values
      if (element.enumValues && element.enumValues.length > 0) {
        const emptyValues = element.enumValues.filter(
          (val) => !val || val.trim() === ''
        );
        if (emptyValues.length > 0) {
          errors.push({
            elementId: element.id,
            message: 'Enumeration values cannot be empty',
          });
        }

        const duplicateEnums = element.enumValues.filter(
          (val, index) => element.enumValues!.indexOf(val) !== index
        );
        if (duplicateEnums.length > 0) {
          errors.push({
            elementId: element.id,
            message: `Duplicate enumeration values: ${duplicateEnums.join(
              ', '
            )}`,
          });
        }
      }

      // Recursively validate children
      if (element.children) {
        element.children.forEach((child) => {
          errors.push(...validateElement(child));
        });
      }

      return errors;
    },
    []
  );

  // Get all validation errors
  const validationErrors = useMemo(() => {
    return validateElement(rootElement);
  }, [rootElement, validateElement]);

  const findElement = useCallback(
    (id: string, element: XMLElement): XMLElement | null => {
      if (element.id === id) return element;
      for (const child of element.children) {
        const found = findElement(id, child);
        if (found) return found;
      }
      return null;
    },
    []
  );

  const updateElement = useCallback(
    (id: string, updates: Partial<XMLElement>) => {
      const updateRecursive = (element: XMLElement): XMLElement => {
        if (element.id === id) {
          return { ...element, ...updates };
        }
        return {
          ...element,
          children: element.children.map(updateRecursive),
        };
      };
      setRootElement(updateRecursive(rootElement));
    },
    [rootElement]
  );

  const addElement = useCallback(
    (parentId: string, type: 'element' | 'attribute' | 'text') => {
      const newElement: XMLElement = {
        id: nextId.toString(),
        name:
          type === 'text'
            ? 'textContent'
            : `new${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type,
        dataType: 'xs:string',
        required: false,
        children: [],
        minOccurs: type === 'element' ? 0 : undefined,
        maxOccurs: type === 'element' ? 1 : undefined,
      };

      const addToParent = (element: XMLElement): XMLElement => {
        if (element.id === parentId) {
          return {
            ...element,
            children: [...element.children, newElement],
          };
        }
        return {
          ...element,
          children: element.children.map(addToParent),
        };
      };

      setRootElement(addToParent(rootElement));
      setNextId(nextId + 1);
      setSelectedElement(newElement.id);
    },
    [rootElement, nextId]
  );

  const removeElement = useCallback(
    (id: string) => {
      if (id === '1') return; // Don't remove root

      const removeFromParent = (element: XMLElement): XMLElement => {
        return {
          ...element,
          children: element.children
            .filter((child) => child.id !== id)
            .map(removeFromParent),
        };
      };

      setRootElement(removeFromParent(rootElement));
      setSelectedElement('1');
    },
    [rootElement]
  );

  const escapeXML = useCallback((str: string): string => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }, []);

  const generateXML = useCallback(
    (element: XMLElement, indent = 0): string => {
      const spaces = '  '.repeat(indent);

      if (element.type === 'text') {
        return escapeXML(element.value || '');
      }

      const attributes = element.children
        .filter((child) => child.type === 'attribute')
        .map((attr) => `${attr.name}="${escapeXML(attr.value || '')}"`)
        .join(' ');

      const attrString = attributes ? ` ${attributes}` : '';

      const textChildren = element.children.filter(
        (child) => child.type === 'text'
      );
      const elementChildren = element.children.filter(
        (child) => child.type === 'element'
      );

      // Self-closing tag for elements with no content
      if (elementChildren.length === 0 && textChildren.length === 0) {
        return `${spaces}<${element.name}${attrString}/>`;
      }

      let content = '';

      // Handle text content first
      if (textChildren.length > 0) {
        const textContent = textChildren
          .map((child) => escapeXML(child.value || ''))
          .join('');

        if (elementChildren.length === 0) {
          // Only text content, keep it inline
          return `${spaces}<${element.name}${attrString}>${textContent}</${element.name}>`;
        } else {
          // Mixed content - add text content at the beginning
          content = textContent;
        }
      }

      // Handle child elements
      if (elementChildren.length > 0) {
        const childrenXML = elementChildren
          .map((child) => generateXML(child, indent + 1))
          .join('\n');

        if (textChildren.length === 0) {
          // Only element children
          content = '\n' + childrenXML + '\n' + spaces;
        } else {
          // Mixed content - elements after text
          content += '\n' + childrenXML + '\n' + spaces;
        }
      }

      return `${spaces}<${element.name}${attrString}>${content}</${element.name}>`;
    },
    [escapeXML]
  );

  const generateCompleteXML = useCallback((): string => {
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>';
    const xmlContent = generateXML(rootElement);
    return xmlDeclaration + '\n' + xmlContent;
  }, [generateXML, rootElement]);

  const generateXSD = useCallback(
    (element: XMLElement): string => {
      const usedComplexTypes = new Set<string>();
      const usedSimpleTypes = new Set<string>(); // Track simple types to avoid duplicates

      const generateSimpleType = (el: XMLElement, typeName: string): string => {
        if (
          !el.enumValues ||
          el.enumValues.length === 0 ||
          usedSimpleTypes.has(typeName)
        ) {
          return '';
        }
        usedSimpleTypes.add(typeName); // Mark this simple type as generated

        let simpleType = `  <xs:simpleType name="${typeName}">\n`;
        simpleType += `    <xs:restriction base="${el.dataType}">\n`;

        el.enumValues.forEach((enumVal) => {
          simpleType += `      <xs:enumeration value="${escapeXML(
            enumVal
          )}"/>\n`;
        });

        simpleType += '    </xs:restriction>\n';
        simpleType += '  </xs:simpleType>\n\n';

        return simpleType;
      };

      const generateComplexType = (
        el: XMLElement,
        typeName: string
      ): string => {
        if (usedComplexTypes.has(typeName)) {
          return '';
        }
        usedComplexTypes.add(typeName);

        const elements = el.children.filter(
          (child) => child.type === 'element'
        );
        const attributes = el.children.filter(
          (child) => child.type === 'attribute'
        );
        const textContent = el.children.filter(
          (child) => child.type === 'text'
        );

        let complexType = `  <xs:complexType name="${typeName}">\n`;

        // Handle mixed content or sequence
        if (elements.length > 0 || textContent.length > 0) {
          if (textContent.length > 0 && elements.length > 0) {
            complexType += '    <xs:complexContent>\n';
            complexType += '      <xs:extension base="xs:string">\n';
            complexType += '        <xs:sequence>\n';
          } else {
            complexType += '    <xs:sequence>\n';
          }

          elements.forEach((child) => {
            const minOccurs =
              child.minOccurs !== undefined
                ? ` minOccurs="${child.minOccurs}"`
                : '';
            const maxOccurs =
              child.maxOccurs !== undefined
                ? ` maxOccurs="${child.maxOccurs}"`
                : '';

            let elementType: string;
            if (child.enumValues && child.enumValues.length > 0) {
              elementType = `${child.name}SimpleType`;
            } else if (
              child.children.some(
                (grandchild) =>
                  grandchild.type === 'element' ||
                  grandchild.type === 'attribute'
              )
            ) {
              elementType = `${child.name}Type`;
              usedComplexTypes.add(child.name);
            } else {
              elementType = child.dataType;
            }

            complexType += `      <xs:element name="${child.name}" type="${elementType}"${minOccurs}${maxOccurs}/>\n`;
          });

          if (textContent.length > 0 && elements.length > 0) {
            complexType += '        </xs:sequence>\n';
            complexType += '      </xs:extension>\n';
            complexType += '    </xs:complexContent>\n';
          } else {
            complexType += '    </xs:sequence>\n';
          }
        }

        // Handle attributes
        attributes.forEach((attr) => {
          const use = attr.required ? ' use="required"' : ' use="optional"';
          let attrType: string;

          if (attr.enumValues && attr.enumValues.length > 0) {
            attrType = `${attr.name}SimpleType`;
          } else {
            attrType = attr.dataType;
          }

          complexType += `    <xs:attribute name="${attr.name}" type="${attrType}"${use}/>\n`;
        });

        complexType += '  </xs:complexType>\n\n';
        return complexType;
      };

      const generateAllTypes = (el: XMLElement): string => {
        let types = '';

        // Generate simple types for enumerations
        if (el.enumValues && el.enumValues.length > 0) {
          types += generateSimpleType(el, `${el.name}SimpleType`);
        }

        // Generate simple types for child enumerations
        el.children.forEach((child) => {
          if (child.enumValues && child.enumValues.length > 0) {
            types += generateSimpleType(child, `${child.name}SimpleType`);
          }
        });

        // Generate complex types for child elements
        el.children
          .filter((child) => child.type === 'element')
          .forEach((child) => {
            if (
              child.children.some(
                (grandchild) =>
                  grandchild.type === 'element' ||
                  grandchild.type === 'attribute'
              )
            ) {
              types += generateComplexType(child, `${child.name}Type`);
            }
            types += generateAllTypes(child);
          });

        return types;
      };

      let xsd = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xsd += '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"\n';
      xsd += '           elementFormDefault="qualified"\n';
      xsd += '           attributeFormDefault="unqualified">\n\n';

      // Generate all simple and complex types
      xsd += generateAllTypes(element);

      // Generate root element
      xsd += `  <xs:element name="${element.name}">\n`;

      if (element.children.length > 0) {
        xsd += '    <xs:complexType>\n';

        const elements = element.children.filter(
          (child) => child.type === 'element'
        );
        const attributes = element.children.filter(
          (child) => child.type === 'attribute'
        );
        const textContent = element.children.filter(
          (child) => child.type === 'text'
        );

        if (elements.length > 0 || textContent.length > 0) {
          if (textContent.length > 0 && elements.length > 0) {
            xsd += '      <xs:complexContent>\n';
            xsd += '        <xs:extension base="xs:string">\n';
            xsd += '          <xs:sequence>\n';
          } else {
            xsd += '      <xs:sequence>\n';
          }

          elements.forEach((child) => {
            const minOccurs =
              child.minOccurs !== undefined
                ? ` minOccurs="${child.minOccurs}"`
                : '';
            const maxOccurs =
              child.maxOccurs !== undefined
                ? ` maxOccurs="${child.maxOccurs}"`
                : '';

            let elementType: string;
            if (child.enumValues && child.enumValues.length > 0) {
              elementType = `${child.name}SimpleType`;
            } else if (
              child.children.some(
                (grandchild) =>
                  grandchild.type === 'element' ||
                  grandchild.type === 'attribute'
              )
            ) {
              elementType = `${child.name}Type`;
            } else {
              elementType = child.dataType;
            }

            const indentLevel =
              textContent.length > 0 && elements.length > 0
                ? '        '
                : '      ';
            xsd += `${indentLevel}<xs:element name="${child.name}" type="${elementType}"${minOccurs}${maxOccurs}/>\n`;
          });

          if (textContent.length > 0 && elements.length > 0) {
            xsd += '          </xs:sequence>\n';
            xsd += '        </xs:extension>\n';
            xsd += '      </xs:complexContent>\n';
          } else {
            xsd += '      </xs:sequence>\n';
          }
        }

        attributes.forEach((attr) => {
          const use = attr.required ? ' use="required"' : ' use="optional"';
          let attrType: string;

          if (attr.enumValues && attr.enumValues.length > 0) {
            attrType = `${attr.name}SimpleType`;
          } else {
            attrType = attr.dataType;
          }

          xsd += `      <xs:attribute name="${attr.name}" type="${attrType}"${use}/>\n`;
        });

        xsd += '    </xs:complexType>\n';
      } else {
        // Simple element with possible enumeration
        if (element.enumValues && element.enumValues.length > 0) {
          xsd += '    <xs:simpleType>\n';
          xsd += `      <xs:restriction base="${element.dataType}">\n`;
          element.enumValues.forEach((enumVal) => {
            xsd += `        <xs:enumeration value="${escapeXML(enumVal)}"/>\n`;
          });
          xsd += '      </xs:restriction>\n';
          xsd += '    </xs:simpleType>\n';
        } else {
          xsd += `    <xs:simpleType>\n`;
          xsd += `      <xs:restriction base="${element.dataType}"/>\n`;
          xsd += `    </xs:simpleType>\n`;
        }
      }

      xsd += '  </xs:element>\n\n';
      xsd += '</xs:schema>';

      return xsd;
    },
    [escapeXML]
  );

  const renderElement = useCallback(
    (element: XMLElement, depth = 0): React.ReactNode => {
      const isSelected = selectedElement === element.id;
      const hasChildren = element.children.length > 0;
      const elementErrors = validationErrors.filter(
        (error) => error.elementId === element.id
      );
      const hasErrors = elementErrors.length > 0;

      return (
        <div key={element.id} className='mb-2'>
          <div
            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
              isSelected
                ? 'bg-blue-100 border border-blue-300'
                : hasErrors
                ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
            style={{ marginLeft: `${depth * 20}px` }}
            onClick={() => setSelectedElement(element.id)}
          >
            <Badge
              variant={
                element.type === 'element'
                  ? 'default'
                  : element.type === 'attribute'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {element.type}
            </Badge>
            <span className='font-medium'>{element.name}</span>
            <span className='text-sm text-gray-500'>{element.dataType}</span>
            {element.required && (
              <Badge variant='destructive' className='text-xs'>
                Required
              </Badge>
            )}
            {element.enumValues && element.enumValues.length > 0 && (
              <Badge variant='outline' className='text-xs'>
                Enum ({element.enumValues.length})
              </Badge>
            )}
            {hasErrors && <AlertCircle className='h-4 w-4 text-red-500' />}
          </div>

          {hasChildren && (
            <div>
              {element.children.map((child) => renderElement(child, depth + 1))}
            </div>
          )}
        </div>
      );
    },
    [selectedElement, validationErrors]
  );

  const addEnumValue = useCallback(() => {
    const currentElement = findElement(selectedElement, rootElement);
    if (currentElement) {
      const newEnumValues = [...(currentElement.enumValues || []), ''];
      updateElement(selectedElement, { enumValues: newEnumValues });
    }
  }, [selectedElement, rootElement, updateElement]);

  const updateEnumValue = useCallback(
    (index: number, value: string) => {
      const currentElement = findElement(selectedElement, rootElement);
      if (currentElement && currentElement.enumValues) {
        const newEnumValues = [...currentElement.enumValues];
        newEnumValues[index] = value;
        updateElement(selectedElement, { enumValues: newEnumValues });
      }
    },
    [selectedElement, rootElement, updateElement]
  );

  const removeEnumValue = useCallback(
    (index: number) => {
      const currentElement = findElement(selectedElement, rootElement);
      if (currentElement && currentElement.enumValues) {
        const newEnumValues = currentElement.enumValues.filter(
          (_, i) => i !== index
        );
        updateElement(selectedElement, { enumValues: newEnumValues });
      }
    },
    [selectedElement, rootElement, updateElement]
  );

  const selectedElementData = findElement(selectedElement, rootElement);
  const selectedElementErrors = validationErrors.filter(
    (error) => error.elementId === selectedElement
  );

  return (
    <div className='w-full max-w-7xl mx-auto p-4'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold mb-2'>XML/XSD WYSIWYG Editor</h1>
        <p className='text-gray-600'>
          Visual editor for creating XML structures and generating XSD schemas
        </p>

        {validationErrors.length > 0 && (
          <Alert className='mt-4 border-red-200 bg-red-50'>
            <AlertCircle className='h-4 w-4 text-red-500' />
            <AlertDescription className='text-red-700'>
              {validationErrors.length} validation error
              {validationErrors.length > 1 ? 's' : ''} found. Please fix them
              before generating final code.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='editor' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            Editor
            {validationErrors.length > 0 && (
              <Badge variant='destructive' className='text-xs ml-1'>
                {validationErrors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='preview' className='flex items-center gap-2'>
            <Eye className='h-4 w-4' />
            Preview
          </TabsTrigger>
          <TabsTrigger value='code' className='flex items-center gap-2'>
            <Code className='h-4 w-4' />
            Generated Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value='editor' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Structure Tree */}
            <Card>
              <CardHeader>
                <CardTitle>XML Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='max-h-96 overflow-y-auto'>
                  {renderElement(rootElement)}
                </div>
                <div className='flex gap-2 mt-4 flex-wrap'>
                  <Button
                    size='sm'
                    onClick={() => addElement(selectedElement, 'element')}
                    className='flex items-center gap-1'
                  >
                    <Plus className='h-4 w-4' />
                    Add Element
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => addElement(selectedElement, 'attribute')}
                    className='flex items-center gap-1'
                  >
                    <Plus className='h-4 w-4' />
                    Add Attribute
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => addElement(selectedElement, 'text')}
                    className='flex items-center gap-1'
                  >
                    <Plus className='h-4 w-4' />
                    Add Text
                  </Button>
                  {selectedElement !== '1' && (
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => removeElement(selectedElement)}
                      className='flex items-center gap-1'
                    >
                      <Trash2 className='h-4 w-4' />
                      Remove
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Properties Panel */}
            <Card>
              <CardHeader>
                <CardTitle>Element Properties</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {selectedElementData && (
                  <>
                    {selectedElementErrors.length > 0 && (
                      <Alert className='border-red-200 bg-red-50'>
                        <AlertCircle className='h-4 w-4 text-red-500' />
                        <AlertDescription>
                          <ul className='list-disc list-inside space-y-1'>
                            {selectedElementErrors.map((error, index) => (
                              <li key={index} className='text-red-700'>
                                {error.message}
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor='name'>Name</Label>
                      <Input
                        id='name'
                        value={selectedElementData.name}
                        onChange={(e) =>
                          updateElement(selectedElement, {
                            name: e.target.value,
                          })
                        }
                        className={
                          selectedElementErrors.some((e) =>
                            e.message.includes('name')
                          )
                            ? 'border-red-300'
                            : ''
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='dataType'>Data Type</Label>
                      <Select
                        value={selectedElementData.dataType}
                        onValueChange={(value) =>
                          updateElement(selectedElement, { dataType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(selectedElementData.type === 'text' ||
                      selectedElementData.type === 'attribute') && (
                      <div>
                        <Label htmlFor='value'>Value</Label>
                        <Input
                          id='value'
                          value={selectedElementData.value || ''}
                          onChange={(e) =>
                            updateElement(selectedElement, {
                              value: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}

                    <div className='flex items-center space-x-2'>
                      <input
                        type='checkbox'
                        id='required'
                        checked={selectedElementData.required}
                        onChange={(e) =>
                          updateElement(selectedElement, {
                            required: e.target.checked,
                          })
                        }
                      />
                      <Label htmlFor='required'>Required</Label>
                    </div>

                    {selectedElementData.type === 'element' && (
                      <>
                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <Label htmlFor='minOccurs'>Min Occurs</Label>
                            <Input
                              id='minOccurs'
                              type='number'
                              min='0'
                              value={selectedElementData.minOccurs ?? 0}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                updateElement(selectedElement, {
                                  minOccurs: isNaN(value)
                                    ? 0
                                    : Math.max(0, value),
                                });
                              }}
                            />
                          </div>

                          <div>
                            <Label htmlFor='maxOccurs'>Max Occurs</Label>
                            <Select
                              value={
                                selectedElementData.maxOccurs?.toString() || '1'
                              }
                              onValueChange={(value) =>
                                updateElement(selectedElement, {
                                  maxOccurs:
                                    value === 'unbounded'
                                      ? 'unbounded'
                                      : parseInt(value) || 1,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='1'>1</SelectItem>
                                <SelectItem value='2'>2</SelectItem>
                                <SelectItem value='3'>3</SelectItem>
                                <SelectItem value='4'>4</SelectItem>
                                <SelectItem value='5'>5</SelectItem>
                                <SelectItem value='unbounded'>
                                  unbounded
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    {(selectedElementData.type === 'element' ||
                      selectedElementData.type === 'attribute') && (
                      <div className='space-y-2'>
                        <Label>Enumeration Values</Label>
                        <div className='space-y-2'>
                          {selectedElementData.enumValues?.map(
                            (enumVal, index) => (
                              <div
                                key={index}
                                className='flex gap-2 items-center'
                              >
                                <Input
                                  value={enumVal}
                                  onChange={(e) =>
                                    updateEnumValue(index, e.target.value)
                                  }
                                  className={
                                    selectedElementErrors.some((e) =>
                                      e.message.includes('enumeration')
                                    )
                                      ? 'border-red-300'
                                      : ''
                                  }
                                />
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => removeEnumValue(index)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </div>
                            )
                          )}
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={addEnumValue}
                            className='flex items-center gap-1'
                          >
                            <Plus className='h-4 w-4' />
                            Add Enum Value
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='preview'>
          <Card>
            <CardHeader>
              <CardTitle>XML Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className='bg-gray-50 p-4 rounded-md overflow-x-auto'>
                <code>{generateCompleteXML()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='code'>
          <Card>
            <CardHeader>
              <CardTitle>Generated XSD Schema</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className='bg-gray-50 p-4 rounded-md overflow-x-auto'>
                <code>{generateXSD(rootElement)}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default XMLXSDEditor;
