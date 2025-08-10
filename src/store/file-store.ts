// import { create } from 'zustand';

// interface FileState {
//   xmlContent: string;
//   xsdContent: string;
//   pdfFile: File | null;
//   activeTab: string;
//   setXmlContent: (content: string) => void;
//   setXsdContent: (content: string) => void;
//   setPdfFile: (file: File | null) => void;
//   setActiveTab: (tab: string) => void;
//   importFile: (fileType: 'xml' | 'xsd') => void;
// }

// export const useFileStore = create<FileState>((set) => ({
//   xmlContent: '',
//   xsdContent: '',
//   pdfFile: null,
//   activeTab: 'xml',
//   setXmlContent: (content) => set({ xmlContent: content }),
//   setXsdContent: (content) => set({ xsdContent: content }),
//   setPdfFile: (file) => set({ pdfFile: file }),
//   setActiveTab: (tab) => set({ activeTab: tab }),
//   importFile: (fileType) => {
//     // Create a hidden file input element
//     const input = document.createElement('input');
//     input.type = 'file';
//     input.accept = fileType === 'xml' ? '.xml' : '.xsd';

//     input.onchange = (event) => {
//       const file = (event.target as HTMLInputElement).files?.[0];
//       if (!file) return;

//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const content = e.target?.result as string;
//         // Escape HTML for display
//         const escapedContent = content
//           .replace(/&/g, '&amp;')
//           .replace(/</g, '&lt;')
//           .replace(/>/g, '&gt;')
//           .replace(/"/g, '&quot;');

//         if (fileType === 'xml') {
//           set({ xmlContent: escapedContent, activeTab: 'xml' });
//         } else if (fileType === 'xsd') {
//           set({ xsdContent: escapedContent, activeTab: 'xsd' });
//         }
//       };
//       reader.readAsText(file);
//     };

//     // Trigger the file picker
//     input.click();
//   },
// }));

import { create } from 'zustand';

// Import the schema interface from your converter
interface SchemaInfo {
  [tagName: string]: {
    type?: 'enum' | 'string' | 'number' | 'date';
    enumValues?: string[];
  };
}

interface FileState {
  xmlContent: string;
  xsdContent: string;
  pdfFile: File | null;
  activeTab: string;
  schemaInfo: SchemaInfo;
  setXmlContent: (content: string) => void;
  setXsdContent: (content: string) => void;
  setPdfFile: (file: File | null) => void;
  setActiveTab: (tab: string) => void;
  importFile: (fileType: 'xml' | 'xsd') => void;
  parseXsdSchema: () => SchemaInfo;
}

export const useFileStore = create<FileState>((set, get) => ({
  xmlContent: '',
  xsdContent: '',
  pdfFile: null,
  activeTab: 'xml',
  schemaInfo: {},

  setXmlContent: (content) => set({ xmlContent: content }),

  setXsdContent: (content) => {
    set({ xsdContent: content });
    // Automatically parse schema when XSD content is set
    const state = get();
    const schemaInfo = state.parseXsdSchema();
    set({ schemaInfo });
  },

  setPdfFile: (file) => set({ pdfFile: file }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  importFile: (fileType) => {
    // Create a hidden file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = fileType === 'xml' ? '.xml' : '.xsd';

    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;

        if (fileType === 'xml') {
          // For XML, we want the raw content for processing, not escaped
          set({ xmlContent: content, activeTab: 'xml' });
        } else if (fileType === 'xsd') {
          // For XSD, store raw content and parse schema
          set({ xsdContent: content, activeTab: 'xsd' });
          // Parse schema after setting content
          const state = get();
          const schemaInfo = state.parseXsdSchema();
          set({ schemaInfo });
        }
      };
      reader.readAsText(file);
    };

    // Trigger the file picker
    input.click();
  },

  parseXsdSchema: (): SchemaInfo => {
    const { xsdContent } = get();
    if (!xsdContent) return {};

    try {
      const parser = new DOMParser();
      const xsdDoc = parser.parseFromString(xsdContent, 'application/xml');

      // Check for parsing errors
      const parseError = xsdDoc.querySelector('parsererror');
      if (parseError) {
        console.error('XSD parsing error:', parseError.textContent);
        return {};
      }

      const schemaInfo: SchemaInfo = {};

      // Find all simpleType definitions with restrictions
      const simpleTypes = xsdDoc.querySelectorAll(
        'xs\\:simpleType, simpleType'
      );
      simpleTypes.forEach((simpleType) => {
        const typeName = simpleType.getAttribute('name');
        if (!typeName) return;

        // Look for string restrictions with enumerations
        const restriction = simpleType.querySelector(
          'xs\\:restriction[base="xs:string"], restriction[base="xs:string"]'
        );
        if (restriction) {
          const enumerations = restriction.querySelectorAll(
            'xs\\:enumeration, enumeration'
          );
          if (enumerations.length > 0) {
            const enumValues: string[] = [];
            enumerations.forEach((enumElement) => {
              const value = enumElement.getAttribute('value');
              if (value) {
                enumValues.push(value);
              }
            });

            if (enumValues.length > 0) {
              // Store by type name (e.g., "CategoryType")
              schemaInfo[typeName] = {
                type: 'enum',
                enumValues,
              };
            }
          }
        }
      });

      // Find elements that use these types
      const elements = xsdDoc.querySelectorAll('xs\\:element, element');
      elements.forEach((element) => {
        const elementName = element.getAttribute('name');
        const elementType = element.getAttribute('type');

        if (elementName && elementType) {
          // Check if the type is one of our enum types
          if (schemaInfo[elementType]) {
            // Map element name to the schema info
            schemaInfo[elementName] = schemaInfo[elementType];
          }
        }
      });

      // Also look for inline simpleType definitions within elements
      elements.forEach((element) => {
        const elementName = element.getAttribute('name');
        if (!elementName) return;

        const inlineSimpleType = element.querySelector(
          'xs\\:simpleType, simpleType'
        );
        if (inlineSimpleType) {
          const restriction = inlineSimpleType.querySelector(
            'xs\\:restriction[base="xs:string"], restriction[base="xs:string"]'
          );
          if (restriction) {
            const enumerations = restriction.querySelectorAll(
              'xs\\:enumeration, enumeration'
            );
            if (enumerations.length > 0) {
              const enumValues: string[] = [];
              enumerations.forEach((enumElement) => {
                const value = enumElement.getAttribute('value');
                if (value) {
                  enumValues.push(value);
                }
              });

              if (enumValues.length > 0) {
                schemaInfo[elementName] = {
                  type: 'enum',
                  enumValues,
                };
              }
            }
          }
        }
      });

      return schemaInfo;
    } catch (error) {
      console.error('Error parsing XSD schema:', error);
      return {};
    }
  },
}));
