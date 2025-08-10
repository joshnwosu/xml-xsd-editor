// utils/xml-wysiwyg-converter.ts
export interface XmlElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (XmlElement | string)[];
  isTextNode?: boolean;
}

export interface SchemaInfo {
  [tagName: string]: {
    type?: 'enum' | 'string' | 'number' | 'date';
    enumValues?: string[];
  };
}

export class XmlWysiwygConverter {
  private static schemaInfo: SchemaInfo = {};
  private static xsdContent: string = '';

  /**
   * Set schema information for dropdown rendering
   */
  static setSchemaInfo(schema: SchemaInfo, xsdContent?: string): void {
    this.schemaInfo = schema;
    if (xsdContent) {
      this.xsdContent = xsdContent;
    }
  }

  /**
   * Get current schema info
   */
  static getSchemaInfo(): SchemaInfo {
    return this.schemaInfo;
  }

  /**
   * Get XSD content
   */
  static getXsdContent(): string {
    return this.xsdContent;
  }

  /**
   * Check if a field has enumeration values
   */
  private static hasEnumeration(tagName: string): boolean {
    const schemaInfo = this.schemaInfo[tagName];
    return (
      schemaInfo?.type === 'enum' &&
      Array.isArray(schemaInfo.enumValues) &&
      schemaInfo.enumValues.length > 0
    );
  }

  /**
   * Get enumeration values for a field
   */
  private static getEnumerationValues(tagName: string): string[] {
    const schemaInfo = this.schemaInfo[tagName];
    return schemaInfo?.enumValues || [];
  }

  /**
   * Parse XSD content directly (if needed for additional schema information)
   */
  private static parseAdditionalSchemaInfo(tagName: string): {
    hasDocumentation?: boolean;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  } {
    if (!this.xsdContent) return {};

    try {
      const parser = new DOMParser();
      const xsdDoc = parser.parseFromString(this.xsdContent, 'application/xml');

      // Find element definition
      const elements = xsdDoc.querySelectorAll('xs\\:element, element');
      for (const element of elements) {
        const elementName = element.getAttribute('name');
        if (elementName === tagName) {
          const result: any = {};

          // Check for documentation
          const documentation = element.querySelector(
            'xs\\:annotation xs\\:documentation, annotation documentation'
          );
          if (documentation) {
            result.hasDocumentation = true;
            result.documentation = documentation.textContent?.trim();
          }

          // Check for patterns
          const restriction =
            element.querySelector(
              'xs\\:simpleType xs\\:restriction, simpleType restriction'
            ) || element.querySelector('xs\\:restriction, restriction');
          if (restriction) {
            const pattern = restriction.querySelector('xs\\:pattern, pattern');
            if (pattern) {
              result.pattern = pattern.getAttribute('value');
            }

            const minLength = restriction.querySelector(
              'xs\\:minLength, minLength'
            );
            if (minLength) {
              result.minLength = parseInt(
                minLength.getAttribute('value') || '0'
              );
            }

            const maxLength = restriction.querySelector(
              'xs\\:maxLength, maxLength'
            );
            if (maxLength) {
              result.maxLength = parseInt(
                maxLength.getAttribute('value') || '0'
              );
            }
          }

          return result;
        }
      }
    } catch (error) {
      console.warn('Error parsing additional schema info:', error);
    }

    return {};
  }

  /**
   * Convert XML content to WYSIWYG HTML format
   */
  static xmlToWysiwyg(xmlContent: string): string {
    try {
      // Unescape HTML entities first
      const unescapedXml = this.unescapeHTML(xmlContent);

      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescapedXml, 'application/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return `<div class="xml-error">XML Parsing Error: ${parseError.textContent}</div>`;
      }

      // Convert XML structure to document-like HTML using the working approach
      let html = '<div class="xml-document document-preview">';

      if (xmlDoc.documentElement) {
        html += this.processNode(xmlDoc.documentElement, 0);
      }

      html += '</div>';
      return html;
    } catch (error) {
      return `<div class="xml-error">Error converting XML: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</div>`;
    }
  }

  /**
   * Process XML node and convert to document-style HTML (enhanced with XSD info)
   */
  private static processNode(node: Element, level: number = 0): string {
    let result = '';

    if (node.nodeType === Node.ELEMENT_NODE) {
      // Check if this node has text content (leaf node) or only child elements
      const hasTextContent =
        node.textContent &&
        node.textContent.trim() &&
        node.children.length === 0;
      const hasOnlyChildElements = node.children.length > 0 && !hasTextContent;

      // Handle different XML elements as document components
      if (level === 0) {
        // Root element as document title
        result += `<h1 class="doc-title" contenteditable="true" data-xml-tag="${
          node.tagName
        }" data-level="${level}">${this.formatTagName(node.tagName)}</h1>`;
      } else if (hasOnlyChildElements && level <= 2) {
        // Container elements as section headers (only if they have child elements and are not too deep)
        if (level === 1) {
          result += `<h2 class="doc-section" contenteditable="true" data-xml-tag="${
            node.tagName
          }" data-level="${level}">${this.formatTagName(node.tagName)}</h2>`;
        } else if (level === 2) {
          result += `<h3 class="doc-subsection" contenteditable="true" data-xml-tag="${
            node.tagName
          }" data-level="${level}">${this.formatTagName(node.tagName)}</h3>`;
        }
      }

      // Add attributes as metadata
      if (node.attributes.length > 0) {
        result += '<div class="doc-metadata" contenteditable="true">';
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          result += `<span class="doc-attr" data-attr-name="${
            attr.name
          }" data-attr-value="${attr.value}"><strong>${this.formatTagName(
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
        const tagName = node.tagName;
        const formattedTagName = this.formatTagName(tagName);

        // Get additional schema info
        const additionalInfo = this.parseAdditionalSchemaInfo(tagName);

        // Check if this field has enumeration values
        if (this.hasEnumeration(tagName)) {
          const enumValues = this.getEnumerationValues(tagName);

          // Render as dropdown with enhanced features
          result += `<div class="doc-field-container" data-xml-tag="${tagName}" data-content="${text}" data-content-type="enum">`;
          result += `<label class="doc-field-label"><strong>${formattedTagName}:</strong></label>`;

          // Add documentation if available
          if (additionalInfo.hasDocumentation) {
            result += `<div class="doc-field-help" title="${additionalInfo.hasDocumentation}">ℹ️</div>`;
          }

          result += `<select class="doc-enum-select" data-xml-tag="${tagName}" data-content="${text}">`;
          enumValues.forEach((value) => {
            const selected = value === text ? 'selected' : '';
            result += `<option value="${value}" ${selected}>${value}</option>`;
          });
          result += '</select></div>';
        } else {
          // Format different types of content with data attributes for reverse mapping
          // Order matters here - check most specific patterns first
          if (this.isEmail(text)) {
            result += `<p class="doc-email" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="email"><strong>${formattedTagName}:</strong> <a href="mailto:${text}">${text}</a></p>`;
          } else if (this.isUrl(text)) {
            result += `<p class="doc-url" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="url"><strong>${formattedTagName}:</strong> <a href="${text}" target="_blank" rel="noopener noreferrer">${text}</a></p>`;
          } else if (this.isCurrency(text)) {
            result += `<p class="doc-currency" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="currency"><strong>${formattedTagName}:</strong> <span class="currency-value">${text}</span></p>`;
          } else if (this.isTime(text)) {
            result += `<p class="doc-time" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="time"><strong>${formattedTagName}:</strong> <span class="time-value">${text}</span></p>`;
          } else if (this.isDate(text)) {
            result += `<p class="doc-date" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="date"><strong>${formattedTagName}:</strong> <span class="date-value">${this.formatDate(
              text
            )}</span></p>`;
          } else if (this.isPhone(text)) {
            result += `<p class="doc-phone" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="phone"><strong>${formattedTagName}:</strong><span class="phone-value">${text}</span></p>`;
          } else if (this.isNumber(text)) {
            result += `<p class="doc-number" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="number"><strong>${formattedTagName}:</strong> ${text}</p>`;
          } else if (text.length > 100) {
            result += `<div class="doc-paragraph-container" data-xml-tag="${tagName}" data-content="${text}" data-content-type="paragraph">`;
            result += `<label class="doc-field-label"><strong>${formattedTagName}:</strong></label>`;

            // Add validation attributes if available
            let validationAttrs = '';
            if (additionalInfo.minLength)
              validationAttrs += ` data-min-length="${additionalInfo.minLength}"`;
            if (additionalInfo.maxLength)
              validationAttrs += ` data-max-length="${additionalInfo.maxLength}"`;
            if (additionalInfo.pattern)
              validationAttrs += ` data-pattern="${additionalInfo.pattern}"`;

            result += `<div class="doc-paragraph" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}"${validationAttrs}>${text}</div>`;
            result += '</div>';
          } else {
            // Add validation attributes for regular fields too
            let validationAttrs = '';
            if (additionalInfo.minLength)
              validationAttrs += ` data-min-length="${additionalInfo.minLength}"`;
            if (additionalInfo.maxLength)
              validationAttrs += ` data-max-length="${additionalInfo.maxLength}"`;
            if (additionalInfo.pattern)
              validationAttrs += ` data-pattern="${additionalInfo.pattern}"`;

            result += `<p class="doc-field" contenteditable="true" data-xml-tag="${tagName}" data-content="${text}" data-content-type="field"${validationAttrs}><strong>${formattedTagName}:</strong> ${text}</p>`;
          }
        }
      } else if (node.children.length > 0) {
        // Process child elements
        result += `<div class="doc-content" data-xml-tag="${node.tagName}" data-level="${level}">`;
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1);
        });
        result += '</div>';
      }
    }

    return result;
  }

  /**
   * Convert WYSIWYG HTML back to XML
   */
  static wysiwygToXml(htmlContent: string): string {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;

      // Find the XML document container
      const xmlDocument = container.querySelector('.xml-document');
      if (!xmlDocument) {
        throw new Error('No XML document found in WYSIWYG editor');
      }

      // Build XML from the document structure
      const xmlString = this.buildXmlFromDocument(xmlDocument);
      return this.formatXml(xmlString);
    } catch (error) {
      throw new Error(
        `Error converting WYSIWYG to XML: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Build XML from document structure
   */
  private static buildXmlFromDocument(container: Element): string {
    // Find the root element (should be the title element)
    const titleElement = container.querySelector('h1[data-xml-tag]');
    if (!titleElement) {
      throw new Error('No root XML element found');
    }

    const rootTag = titleElement.getAttribute('data-xml-tag');
    if (!rootTag) {
      throw new Error('Missing root XML tag name');
    }

    // Build the complete XML structure
    return this.buildXmlElement(container, rootTag, 0);
  }

  /**
   * Build XML element recursively
   */
  private static buildXmlElement(
    container: Element,
    tagName: string,
    level: number
  ): string {
    let xml = `<${tagName}`;

    // Find and add attributes for this level
    const attributesElements = container.querySelectorAll(
      `[data-xml-tag="${tagName}"] .doc-metadata .doc-attr`
    );
    attributesElements.forEach((attrElement) => {
      const attrName = attrElement.getAttribute('data-attr-name');
      const attrValue = attrElement.getAttribute('data-attr-value');
      if (attrName && attrValue) {
        xml += ` ${attrName}="${this.escapeXmlAttribute(attrValue)}"`;
      }
    });

    // Find content elements for this tag (including dropdowns)
    const contentElements = container.querySelectorAll(
      `[data-xml-tag="${tagName}"][data-content]`
    );
    const dropdownElements = container.querySelectorAll(
      `[data-xml-tag="${tagName}"].doc-enum-select`
    );
    const childContainers = container.querySelectorAll(
      `[data-xml-tag="${tagName}"] .doc-content`
    );

    if (contentElements.length > 0 || dropdownElements.length > 0) {
      // Has text content
      xml += '>';

      // Handle regular content elements
      contentElements.forEach((contentElement) => {
        const content =
          contentElement.getAttribute('data-content') ||
          contentElement.textContent?.trim() ||
          '';
        xml += this.escapeXmlContent(content);
      });

      // Handle dropdown elements
      dropdownElements.forEach((dropdownElement) => {
        const selectElement = dropdownElement as HTMLSelectElement;
        const selectedValue =
          selectElement.value ||
          selectElement.getAttribute('data-content') ||
          '';
        xml += this.escapeXmlContent(selectedValue);
      });

      xml += `</${tagName}>`;
    } else if (childContainers.length > 0) {
      // Has child elements
      xml += '>';

      // Process child elements
      const processedTags = new Set<string>();
      childContainers.forEach((childContainer) => {
        const childElements = childContainer.querySelectorAll('[data-xml-tag]');
        childElements.forEach((childElement) => {
          const childTag = childElement.getAttribute('data-xml-tag');
          if (childTag && !processedTags.has(childTag)) {
            processedTags.add(childTag);
            xml += this.buildXmlElement(container, childTag, level + 1);
          }
        });
      });

      xml += `</${tagName}>`;
    } else {
      xml += '/>';
    }

    return xml;
  }

  /**
   * Utility functions for content type detection
   */
  private static isEmail(text: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(text);
  }

  private static isUrl(text: string): boolean {
    try {
      new URL(text);
      return true;
    } catch {
      // Fallback to regex for partial URLs
      const urlRegex =
        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
      return urlRegex.test(text) && text.includes('.');
    }
  }

  private static isPhone(text: string): boolean {
    // More specific phone regex that handles common formats
    const phoneRegex = /^[\+]?[1-9][\d\-\s\(\)]{8,}[\d]$/;

    // Additional check: should contain digits and common phone separators
    const hasDigits = /\d/.test(text);
    const hasPhoneChars = /^[\+\d\-\s\(\)]+$/.test(text);
    const digitCount = (text.match(/\d/g) || []).length;

    // Must have at least 7 digits (minimum phone number) and at most 15 (international standard)
    return (
      phoneRegex.test(text) &&
      hasDigits &&
      hasPhoneChars &&
      digitCount >= 7 &&
      digitCount <= 15
    );
  }

  private static isDate(text: string): boolean {
    // Check for common date formats first
    const dateFormats = [
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/, // MM/DD/YYYY or MM-DD-YYYY
      /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/, // YYYY/MM/DD or YYYY-MM-DD
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2}$/, // MM/DD/YY or MM-DD-YY
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
    ];

    // First check if it matches common date patterns
    const matchesDateFormat = dateFormats.some((regex) => regex.test(text));

    if (!matchesDateFormat) {
      return false;
    }

    // Then check if it's actually parseable as a date
    const parsedDate = new Date(text);
    return !isNaN(parsedDate.getTime()) && text.length > 6;
  }

  private static isNumber(text: string): boolean {
    // More precise number detection
    const trimmedText = text.trim();

    // Check if it's a valid number but exclude pure dates and phone patterns
    if (isNaN(Number(trimmedText)) || trimmedText === '') {
      return false;
    }

    // Exclude if it looks like a date (contains slashes or dashes with specific patterns)
    if (/\d+[-\/]\d+[-\/]\d+/.test(trimmedText)) {
      return false;
    }

    // Exclude if it looks like a phone number (starts with + or has typical phone formatting)
    if (/^[\+]/.test(trimmedText) || /\d+[-\s\(\)]\d+/.test(trimmedText)) {
      return false;
    }

    return true;
  }

  private static isCurrency(text: string): boolean {
    const currencyRegex =
      /^[\$€£¥₹]?[\d,]+\.?\d{0,2}$|^\d+\.?\d{0,2}\s?(USD|EUR|GBP|JPY|INR|CAD|AUD)$/i;
    return currencyRegex.test(text.trim());
  }

  private static isTime(text: string): boolean {
    const timeRegex =
      /^(?:[01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?(?:\s?[AaPp][Mm])?$/;
    return timeRegex.test(text.trim());
  }

  private static formatTagName(tagName: string): string {
    return tagName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ')
      .replace(/-/g, ' ');
  }

  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  /**
   * Utility functions for escaping/unescaping
   */
  private static unescapeHTML(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  private static escapeXmlContent(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private static escapeXmlAttribute(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private static formatXml(xml: string): string {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return xml; // Return original if formatting fails
      }

      return this.serializeXmlWithFormatting(xmlDoc.documentElement, 0);
    } catch (error) {
      return xml; // Return original if formatting fails
    }
  }

  private static serializeXmlWithFormatting(
    element: Element,
    depth: number
  ): string {
    const indent = '  '.repeat(depth);
    const tagName = element.tagName;

    let xml = `${indent}<${tagName}`;

    // Add attributes
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      xml += ` ${attr.name}="${attr.value}"`;
    }

    // Check if element has children
    const children = Array.from(element.childNodes);
    const hasElementChildren = children.some(
      (child) => child.nodeType === Node.ELEMENT_NODE
    );
    const textContent = element.textContent?.trim();

    if (children.length === 0) {
      xml += '/>';
    } else if (!hasElementChildren && textContent) {
      // Text-only element
      xml += `>${textContent}</${tagName}>`;
    } else {
      xml += '>\n';

      children.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          xml +=
            this.serializeXmlWithFormatting(child as Element, depth + 1) + '\n';
        } else if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent?.trim();
          if (text) {
            xml += `${'  '.repeat(depth + 1)}${text}\n`;
          }
        }
      });

      xml += `${indent}</${tagName}>`;
    }

    return xml;
  }
}
