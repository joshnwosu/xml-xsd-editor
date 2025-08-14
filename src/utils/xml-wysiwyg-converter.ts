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
   * Convert XML content to WYSIWYG HTML format with input fields
   */
  static xmlToWysiwyg(xmlContent: string, isEditable: boolean = true): string {
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
        html += this.processNode(xmlDoc.documentElement, 0, isEditable);
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
   * Process XML node and convert to document-style HTML with proper input fields
   */
  private static processNode(
    node: Element,
    level: number = 0,
    isEditable: boolean = true
  ): string {
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
        if (isEditable) {
          result += `<div class="doc-title-container">
            <label class="doc-field-label"><strong>Document Title:</strong></label>
            <input type="text" class="doc-title-input" value="${this.formatTagName(
              node.tagName
            )}" 
                   data-xml-tag="${node.tagName}" data-level="${level}" 
                   placeholder="Enter document title" />
          </div>`;
        } else {
          result += `<h1 class="doc-title" data-xml-tag="${
            node.tagName
          }" data-level="${level}">${this.formatTagName(node.tagName)}</h1>`;
        }
      } else if (hasOnlyChildElements && level <= 2) {
        // Container elements as section headers (only if they have child elements and are not too deep)
        if (level === 1) {
          if (isEditable) {
            result += `<div class="doc-section-container">
              <label class="doc-field-label"><strong>Section:</strong></label>
              <input type="text" class="doc-section-input" value="${this.formatTagName(
                node.tagName
              )}" 
                     data-xml-tag="${node.tagName}" data-level="${level}" 
                     placeholder="Enter section name" />
              <button class="doc-add-button">+ Add ${node.tagName}</button>
            </div>`;
          } else {
            result += `<h2 class="doc-section" data-xml-tag="${
              node.tagName
            }" data-level="${level}">${this.formatTagName(node.tagName)}</h2>`;
          }
        } else if (level === 2) {
          if (isEditable) {
            result += `<div class="doc-subsection-container">
              <label class="doc-field-label"><strong>Subsection:</strong></label>
              <input type="text" class="doc-subsection-input" value="${this.formatTagName(
                node.tagName
              )}" 
                     data-xml-tag="${node.tagName}" data-level="${level}" 
                     placeholder="Enter subsection name" />
            </div>`;
          } else {
            result += `<h3 class="doc-subsection" data-xml-tag="${
              node.tagName
            }" data-level="${level}">${this.formatTagName(node.tagName)}</h3>`;
          }
        }
      }

      // Add attributes as metadata with input fields
      if (node.attributes.length > 0) {
        if (isEditable) {
          result += '<div class="doc-metadata-container">';
          result +=
            '<label class="doc-field-label"><strong>Attributes:</strong></label>';
          result += '<div class="doc-metadata-inputs">';
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            result += `<div class="doc-attr-input-group">
              <label class="doc-attr-label">${this.formatTagName(
                attr.name
              )}:</label>
              <input type="text" class="doc-attr-input" 
                     data-attr-name="${attr.name}" 
                     value="${attr.value}" 
                     placeholder="Enter ${this.formatTagName(attr.name)}" />
            </div>`;
          }
          result += '</div></div>';
        } else {
          result += '<div class="doc-metadata">';
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            result += `<span class="doc-attr" data-attr-name="${
              attr.name
            }" data-attr-value="${attr.value}">
              <strong>${this.formatTagName(attr.name)}:</strong> ${attr.value}
            </span>`;
            if (i < node.attributes.length - 1) result += ' | ';
          }
          result += '</div>';
        }
      }

      // Handle text content with proper input fields
      if (hasTextContent) {
        const text = node?.textContent?.trim() as any;
        const tagName = node.tagName;
        const formattedTagName = this.formatTagName(tagName);

        // Get additional schema info
        const additionalInfo = this.parseAdditionalSchemaInfo(tagName);

        // Check if this field has enumeration values
        if (this.hasEnumeration(tagName)) {
          const enumValues = this.getEnumerationValues(tagName);

          result += `<div class="doc-field-container" data-xml-tag="${tagName}" data-content="${text}" data-content-type="enum">`;
          result += `<label class="doc-field-label"><strong>${formattedTagName}:</strong></label>`;

          // Add documentation if available
          if (additionalInfo.hasDocumentation) {
            result += `<div class="doc-field-help" title="${'Additional information available'}">ℹ️</div>`;
          }

          if (isEditable) {
            result += `<select class="doc-enum-select" data-xml-tag="${tagName}" data-content="${text}">`;
            enumValues.forEach((value) => {
              const selected = value === text ? 'selected' : '';
              result += `<option value="${value}" ${selected}>${value}</option>`;
            });
            result += '</select>';
          } else {
            result += `<span class="doc-enum-value">${text}</span>`;
          }
          result += '</div>';
        } else {
          // Create appropriate input fields based on content type
          const inputType = this.getInputType(text);
          const contentType = this.getContentType(text);

          result += `<div class="doc-field-container" data-xml-tag="${tagName}" data-content="${text}" data-content-type="${contentType}">`;
          result += `<label class="doc-field-label"><strong>${formattedTagName}:</strong></label>`;

          // Add documentation if available
          if (additionalInfo.hasDocumentation) {
            result += `<div class="doc-field-help" title="${'Additional information available'}">ℹ️</div>`;
          }

          if (isEditable) {
            // Add validation attributes if available
            let validationAttrs = '';
            if (additionalInfo.minLength)
              validationAttrs += ` data-min-length="${additionalInfo.minLength}" minlength="${additionalInfo.minLength}"`;
            if (additionalInfo.maxLength)
              validationAttrs += ` data-max-length="${additionalInfo.maxLength}" maxlength="${additionalInfo.maxLength}"`;
            if (additionalInfo.pattern)
              validationAttrs += ` data-pattern="${additionalInfo.pattern}" pattern="${additionalInfo.pattern}"`;

            if (text.length > 100 || contentType === 'paragraph') {
              result += `<textarea class="doc-textarea-input" 
                         data-xml-tag="${tagName}" 
                         data-content="${text}"
                         placeholder="Enter ${formattedTagName.toLowerCase()}"
                         rows="4"${validationAttrs}>${text}</textarea>`;
            } else {
              result += `<input type="${inputType}" 
                         class="doc-text-input" 
                         data-xml-tag="${tagName}" 
                         data-content="${text}"
                         data-content-type="${contentType}"
                         value="${text}" 
                         placeholder="Enter ${formattedTagName.toLowerCase()}"${validationAttrs} />`;
            }
          } else {
            // Display-only version with formatted content
            if (contentType === 'email') {
              result += `<a href="mailto:${text}" class="doc-email-link">${text}</a>`;
            } else if (contentType === 'url') {
              result += `<a href="${text}" target="_blank" rel="noopener noreferrer" class="doc-url-link">${text}</a>`;
            } else if (contentType === 'phone') {
              result += `<a href="tel:${text}" class="doc-phone-link">${text}</a>`;
            } else if (contentType === 'date') {
              result += `<span class="doc-date-value">${this.formatDate(
                text
              )}</span>`;
            } else if (contentType === 'currency') {
              result += `<span class="doc-currency-value">${text}</span>`;
            } else if (contentType === 'time') {
              result += `<span class="doc-time-value">${text}</span>`;
            } else {
              result += `<span class="doc-field-value">${text}</span>`;
            }
          }

          result += '</div>';
        }
      } else if (node.children.length > 0) {
        // Process child elements
        result += `<div class="doc-content" data-xml-tag="${node.tagName}" data-level="${level}">`;
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
        result += '</div>';
      }
    }

    return result;
  }

  /**
   * Get appropriate HTML input type based on content
   */
  private static getInputType(text: string): string {
    if (this.isEmail(text)) return 'email';
    if (this.isUrl(text)) return 'url';
    if (this.isPhone(text)) return 'tel';
    if (this.isDate(text)) return 'date';
    if (this.isTime(text)) return 'time';
    if (this.isNumber(text)) return 'number';
    return 'text';
  }

  /**
   * Get content type classification
   */
  private static getContentType(text: string): string {
    if (this.isEmail(text)) return 'email';
    if (this.isUrl(text)) return 'url';
    if (this.isPhone(text)) return 'phone';
    if (this.isDate(text)) return 'date';
    if (this.isTime(text)) return 'time';
    if (this.isCurrency(text)) return 'currency';
    if (this.isNumber(text)) return 'number';
    if (text.length > 100) return 'paragraph';
    return 'text';
  }

  /**
   * Convert WYSIWYG HTML back to XML (updated to handle input fields)
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
   * Build XML from document structure (updated to handle input fields)
   */
  private static buildXmlFromDocument(container: Element): string {
    // Find the root element (could be title input or h1 element)
    const titleElement = container.querySelector(
      'input[data-xml-tag], h1[data-xml-tag]'
    );
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
   * Build XML element recursively (updated to handle input fields)
   */
  private static buildXmlElement(
    container: Element,
    tagName: string,
    level: number
  ): string {
    let xml = `<${tagName}`;

    // Find and add attributes for this level from input fields
    const attributeInputs = container.querySelectorAll(`input[data-attr-name]`);
    attributeInputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;
      const attrName = inputElement.getAttribute('data-attr-name');
      const attrValue =
        inputElement.value ||
        inputElement.getAttribute('data-attr-value') ||
        '';
      if (attrName && attrValue) {
        xml += ` ${attrName}="${this.escapeXmlAttribute(attrValue)}"`;
      }
    });

    // Also check for non-editable attributes
    const attributeElements = container.querySelectorAll(
      `[data-xml-tag="${tagName}"] .doc-metadata .doc-attr`
    );
    attributeElements.forEach((attrElement) => {
      const attrName = attrElement.getAttribute('data-attr-name');
      const attrValue = attrElement.getAttribute('data-attr-value');
      if (attrName && attrValue) {
        xml += ` ${attrName}="${this.escapeXmlAttribute(attrValue)}"`;
      }
    });

    // Find content elements for this tag (including various input types)
    const textInputs = container.querySelectorAll(
      `input[data-xml-tag="${tagName}"], textarea[data-xml-tag="${tagName}"]`
    );
    const selectElements = container.querySelectorAll(
      `select[data-xml-tag="${tagName}"]`
    );
    const contentElements = container.querySelectorAll(
      `[data-xml-tag="${tagName}"][data-content]`
    );
    const childContainers = container.querySelectorAll(
      `[data-xml-tag="${tagName}"] .doc-content`
    );

    if (
      textInputs.length > 0 ||
      selectElements.length > 0 ||
      contentElements.length > 0
    ) {
      // Has text content
      xml += '>';

      // Handle text inputs
      textInputs.forEach((input) => {
        const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
        const content =
          inputElement.value || inputElement.getAttribute('data-content') || '';
        xml += this.escapeXmlContent(content);
      });

      // Handle select elements
      selectElements.forEach((select) => {
        const selectElement = select as HTMLSelectElement;
        const selectedValue =
          selectElement.value ||
          selectElement.getAttribute('data-content') ||
          '';
        xml += this.escapeXmlContent(selectedValue);
      });

      // Handle regular content elements (for non-editable mode)
      contentElements.forEach((contentElement) => {
        // Skip if we already handled this as an input
        if (!textInputs.length && !selectElements.length) {
          const content =
            contentElement.getAttribute('data-content') ||
            contentElement.textContent?.trim() ||
            '';
          xml += this.escapeXmlContent(content);
        }
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
   * Utility functions for content type detection (unchanged)
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
      const urlRegex =
        /^(https?:\/\/)?(www\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}(\/.*)?$/;
      return urlRegex.test(text) && text.includes('.');
    }
  }

  private static isPhone(text: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d\-\s\(\)]{8,}[\d]$/;
    const hasDigits = /\d/.test(text);
    const hasPhoneChars = /^[\+\d\-\s\(\)]+$/.test(text);
    const digitCount = (text.match(/\d/g) || []).length;

    return (
      phoneRegex.test(text) &&
      hasDigits &&
      hasPhoneChars &&
      digitCount >= 7 &&
      digitCount <= 15
    );
  }

  private static isDate(text: string): boolean {
    const dateFormats = [
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,
      /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2}$/,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    ];

    const matchesDateFormat = dateFormats.some((regex) => regex.test(text));
    if (!matchesDateFormat) return false;

    const parsedDate = new Date(text);
    return !isNaN(parsedDate.getTime()) && text.length > 6;
  }

  private static isNumber(text: string): boolean {
    const trimmedText = text.trim();
    if (isNaN(Number(trimmedText)) || trimmedText === '') return false;
    if (/\d+[-\/]\d+[-\/]\d+/.test(trimmedText)) return false;
    if (/^[\+]/.test(trimmedText) || /\d+[-\s\(\)]\d+/.test(trimmedText))
      return false;
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
   * Utility functions for escaping/unescaping (unchanged)
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

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return xml;
      }

      return this.serializeXmlWithFormatting(xmlDoc.documentElement, 0);
    } catch (error) {
      return xml;
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

    const children = Array.from(element.childNodes);
    const hasElementChildren = children.some(
      (child) => child.nodeType === Node.ELEMENT_NODE
    );
    const textContent = element.textContent?.trim();

    if (children.length === 0) {
      xml += '/>';
    } else if (!hasElementChildren && textContent) {
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
