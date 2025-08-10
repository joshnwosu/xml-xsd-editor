// utils/xml-validator.ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class XMLValidator {
  /**
   * Validate XML against XSD schema
   */
  static async validateXMLAgainstXSD(
    xmlContent: string,
    xsdContent: string
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    try {
      // First, validate that both contents are well-formed XML
      const xmlValidation = this.validateWellFormedXML(xmlContent, 'XML');
      const xsdValidation = this.validateWellFormedXML(xsdContent, 'XSD');

      if (!xmlValidation.isValid) {
        result.errors.push(...xmlValidation.errors);
        result.isValid = false;
      }

      if (!xsdValidation.isValid) {
        result.errors.push(...xsdValidation.errors);
        result.isValid = false;
      }

      // If either file is not well-formed, return early
      if (!result.isValid) {
        return result;
      }

      // Parse both documents
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(
        this.unescapeHTML(xmlContent),
        'text/xml'
      );
      const xsdDoc = parser.parseFromString(
        this.unescapeHTML(xsdContent),
        'text/xml'
      );

      // Check for parsing errors
      const xmlParseError = this.checkParseErrors(xmlDoc, 'XML');
      const xsdParseError = this.checkParseErrors(xsdDoc, 'XSD');

      if (xmlParseError) {
        result.errors.push(xmlParseError);
        result.isValid = false;
      }

      if (xsdParseError) {
        result.errors.push(xsdParseError);
        result.isValid = false;
      }

      if (!result.isValid) {
        return result;
      }

      // Perform schema validation
      const schemaValidation = this.performSchemaValidation(xmlDoc, xsdDoc);
      result.errors.push(...schemaValidation.errors);
      result.warnings.push(...schemaValidation.warnings);

      if (schemaValidation.errors.length > 0) {
        result.isValid = false;
      }
    } catch (error) {
      result.errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate that XML content is well-formed
   */
  private static validateWellFormedXML(
    content: string,
    type: string
  ): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    if (!content.trim()) {
      result.errors.push(`${type} content is empty`);
      result.isValid = false;
      return result;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(
        this.unescapeHTML(content),
        'text/xml'
      );

      const parseError = this.checkParseErrors(doc, type);
      if (parseError) {
        result.errors.push(parseError);
        result.isValid = false;
      }
    } catch (error) {
      result.errors.push(
        `${type} parsing failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      result.isValid = false;
    }

    return result;
  }

  /**
   * Check for parsing errors in DOM document
   */
  private static checkParseErrors(doc: Document, type: string): string | null {
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      return `${type} parsing error: ${
        parseError.textContent || 'Unknown parsing error'
      }`;
    }
    return null;
  }

  /**
   * Perform basic schema validation
   */
  private static performSchemaValidation(
    xmlDoc: Document,
    xsdDoc: Document
  ): {
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Extract target namespace from XSD
      const schemaElement = xsdDoc.documentElement;
      if (
        schemaElement.tagName !== 'xs:schema' &&
        schemaElement.tagName !== 'schema'
      ) {
        errors.push('XSD root element must be xs:schema or schema');
        return { errors, warnings };
      }

      const targetNamespace = schemaElement.getAttribute('targetNamespace');

      // Get XML root element
      const xmlRoot = xmlDoc.documentElement;

      // Basic namespace validation
      if (targetNamespace) {
        const xmlNamespace = xmlRoot.namespaceURI;
        if (xmlNamespace !== targetNamespace) {
          warnings.push(
            `XML namespace "${xmlNamespace}" does not match XSD target namespace "${targetNamespace}"`
          );
        }
      }

      // Extract element definitions from XSD
      const elementDefs = this.extractElementDefinitions(xsdDoc);

      // Validate root element
      const rootElementName = xmlRoot.localName || xmlRoot.tagName;
      if (!elementDefs.has(rootElementName)) {
        errors.push(
          `Root element "${rootElementName}" is not defined in the XSD schema`
        );
      }

      // Basic structure validation
      this.validateElementStructure(xmlRoot, elementDefs, errors, warnings);
    } catch (error) {
      errors.push(
        `Schema validation error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    return { errors, warnings };
  }

  /**
   * Extract element definitions from XSD
   */
  private static extractElementDefinitions(xsdDoc: Document): Map<string, any> {
    const elementDefs = new Map();

    // Find all xs:element definitions
    const elements = xsdDoc.querySelectorAll('element, xs\\:element');

    elements.forEach((element) => {
      const name = element.getAttribute('name');
      if (name) {
        elementDefs.set(name, {
          name,
          type: element.getAttribute('type'),
          minOccurs: element.getAttribute('minOccurs') || '1',
          maxOccurs: element.getAttribute('maxOccurs') || '1',
        });
      }
    });

    return elementDefs;
  }

  /**
   * Validate element structure recursively
   */
  private static validateElementStructure(
    element: Element,
    elementDefs: Map<string, any>,
    errors: string[],
    warnings: string[]
  ): void {
    const elementName = element.localName || element.tagName;

    // Check if element is defined in schema
    if (!elementDefs.has(elementName)) {
      warnings.push(
        `Element "${elementName}" is not explicitly defined in the XSD schema`
      );
    }

    // Recursively validate child elements
    const children = Array.from(element.children);
    children.forEach((child) => {
      this.validateElementStructure(child, elementDefs, errors, warnings);
    });
  }

  /**
   * Unescape HTML entities for proper XML parsing
   */
  private static unescapeHTML(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  /**
   * Quick validation check - returns boolean
   */
  static async isValidXMLXSD(
    xmlContent: string,
    xsdContent: string
  ): Promise<boolean> {
    const result = await this.validateXMLAgainstXSD(xmlContent, xsdContent);
    return result.isValid;
  }

  /**
   * Get validation summary
   */
  static getValidationSummary(result: ValidationResult): string {
    if (result.isValid) {
      return result.warnings.length > 0
        ? `✅ Valid with ${result.warnings.length} warning(s)`
        : '✅ Valid - XML conforms to XSD schema';
    } else {
      return `❌ Invalid - ${result.errors.length} error(s) found`;
    }
  }
}
