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
    defaultValue?: string;
  };
}

export class XmlWysiwygConverter {
  private static schemaInfo: SchemaInfo = {};
  private static xsdContent: string = '';
  private static boundClickHandler: ((event: Event) => void) | null = null;

  /**
   * Set schema information for dropdown rendering
   */
  static setSchemaInfo(schema: SchemaInfo, xsdContent?: string): void {
    this.schemaInfo = schema;
    if (xsdContent) {
      this.xsdContent = xsdContent;
    }
    // Initialize event handlers after DOM is ready
    setTimeout(() => this.initializeEventHandlers(), 100);
  }

  /**
   * Initialize event handlers for add/delete buttons
   */
  private static initializeEventHandlers(): void {
    // Remove existing listener if it exists
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler);
    }

    // Create bound function and store reference
    this.boundClickHandler = this.handleGlobalClick.bind(this);

    // Add global click listener
    document.addEventListener('click', this.boundClickHandler);
  }

  /**
   * Handle all click events globally
   */
  private static handleGlobalClick(event: Event): void {
    const target = event.target as HTMLElement;

    if (target.classList.contains('doc-add-button')) {
      event.preventDefault();
      this.handleAddButton(target);
    } else if (target.classList.contains('doc-delete-button')) {
      event.preventDefault();
      this.handleDeleteButton(target);
    }
  }

  /**
   * Handle add button click - add new row to table
   */
  private static handleAddButton(button: HTMLElement): void {
    // Find the table container
    const tableContainer = button.closest('.doc-table-container');
    if (!tableContainer) return;

    // Find the table body
    const tableBody = tableContainer.querySelector('table tbody');
    if (!tableBody) return;

    // Get the structure from existing rows or create default
    const existingRow = tableBody.querySelector('tr');
    if (!existingRow) return;

    // Extract column structure from header or existing row
    const columns = this.getTableColumns(tableContainer);

    // Create new empty row
    const newRow = document.createElement('tr');
    newRow.innerHTML = this.generateEmptyTableRow(columns);

    // Add to table
    tableBody.appendChild(newRow);

    // Focus first input
    const firstInput = newRow.querySelector(
      'input, select, textarea'
    ) as HTMLElement;
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * Get table columns from existing structure
   */
  private static getTableColumns(tableContainer: Element): string[] {
    const headers = tableContainer.querySelectorAll('th');
    const columns: string[] = [];

    headers.forEach((header) => {
      const text = header.textContent?.trim();
      if (text && text !== 'Actions') {
        // Convert display name back to tag name
        const tagName = this.displayNameToTagName(text);
        columns.push(tagName);
      }
    });

    return columns;
  }

  /**
   * Convert display name back to tag name (reverse of formatTagName)
   */
  private static displayNameToTagName(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/^(.)/, (match) => match.toUpperCase());
  }

  /**
   * Generate empty table row HTML
   */
  private static generateEmptyTableRow(columns: string[]): string {
    let html = '';

    columns.forEach((tagName) => {
      const schemaInfo = this.schemaInfo[tagName] || {};
      const defaultValue = schemaInfo.defaultValue || '';
      const formattedTagName = this.formatTagName(tagName);

      html += `<td data-xml-tag="${tagName}" data-content="${defaultValue}" data-content-type="text">`;

      if (this.hasEnumeration(tagName)) {
        // Create dropdown for enum fields
        const enumValues = this.getEnumerationValues(tagName);
        html += `<select class="doc-enum-select" data-xml-tag="${tagName}" data-content="">`;
        html += `<option value="">Select ${formattedTagName}</option>`;
        enumValues.forEach((value) => {
          html += `<option value="${value}">${value}</option>`;
        });
        html += '</select>';
      } else {
        // Create input field
        const inputType = this.getInputType(defaultValue || 'text');
        html += `<input type="${inputType}" 
                  class="doc-text-input" 
                  data-xml-tag="${tagName}" 
                  data-content=""
                  data-content-type="text"
                  value="" 
                  placeholder="Enter ${formattedTagName.toLowerCase()}" />`;
      }

      html += '</td>';
    });

    // Add delete button column
    html +=
      '<td><button class="doc-delete-button" type="button">Delete</button></td>';

    return html;
  }

  /**
   * Handle delete button click
   */
  private static handleDeleteButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (row && confirm('Are you sure you want to delete this row?')) {
      row.remove();
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
    documentation?: string;
  } {
    if (!this.xsdContent) return {};

    try {
      const parser = new DOMParser();
      const xsdDoc = parser.parseFromString(this.xsdContent, 'application/xml');

      const elements = xsdDoc.querySelectorAll('xs\\:element, element');
      for (const element of elements) {
        const elementName = element.getAttribute('name');
        if (elementName === tagName) {
          const result: any = {};

          const documentation = element.querySelector(
            'xs\\:annotation xs\\:documentation, annotation documentation'
          );
          if (documentation) {
            result.hasDocumentation = true;
            result.documentation = documentation.textContent?.trim();
          }

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
   * Convert XML content to WYSIWYG HTML format with input fields and tables
   */
  static xmlToWysiwyg(xmlContent: string, isEditable: boolean = true): string {
    try {
      const unescapedXml = this.unescapeHTML(xmlContent);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescapedXml, 'application/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return `<div class="xml-error">XML Parsing Error: ${parseError.textContent}</div>`;
      }

      let html = '<div class="xml-document document-preview">';
      if (xmlDoc.documentElement) {
        html += this.processNode(xmlDoc.documentElement, 0, isEditable);
      }
      html += '</div>';

      // Initialize event handlers after HTML is rendered
      setTimeout(() => this.initializeEventHandlers(), 100);

      return html;
    } catch (error) {
      return `<div class="xml-error">Error converting XML: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</div>`;
    }
  }

  /**
   * Process XML node and convert to document-style HTML with proper input fields and tables
   */
  private static processNode(
    node: Element,
    level: number = 0,
    isEditable: boolean = true
  ): string {
    let result = '';

    if (node.nodeType === Node.ELEMENT_NODE) {
      const hasTextContent =
        node.textContent &&
        node.textContent.trim() &&
        node.children.length === 0;
      const hasChildElements = node.children.length > 0;

      // Detect if this node represents a collection of repeated elements
      const isCollection =
        hasChildElements &&
        Array.from(node.children).every(
          (child) =>
            child.nodeType === Node.ELEMENT_NODE &&
            child.tagName === node.children[0].tagName
        );

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
      } else if (isCollection && level <= 2) {
        // Handle collection of repeated elements as a table
        const childTagName = node.children[0]?.tagName;
        result += `<div class="doc-table-container" data-xml-tag="${node.tagName}" data-level="${level}">`;

        if (isEditable) {
          result += `<div class="doc-section-container">
            <label class="doc-field-label hidden"><strong>${this.formatTagName(
              node.tagName
            )}:</strong></label>
            <button class="doc-add-button" type="button">Add ${this.formatTagName(
              childTagName
            )}</button>
          </div>`;
        } else {
          result += `<h2 class="doc-section" data-xml-tag="${
            node.tagName
          }" data-level="${level}">${this.formatTagName(node.tagName)}</h2>`;
        }

        // Create table for repeated elements
        if (childTagName) {
          const headers = Array.from(node.children[0].children).map(
            (child) => child.tagName
          );
          result += `<table class="doc-table">`;

          // Table header
          result += '<thead><tr>';
          headers.forEach((header) => {
            result += `<th>${this.formatTagName(header)}</th>`;
          });
          if (isEditable) {
            result += '<th>Actions</th>';
          }
          result += '</tr></thead>';

          // Table body
          result += '<tbody>';
          Array.from(node.children).forEach((child) => {
            result += '<tr>';
            Array.from(child.children).forEach((grandchild) => {
              const text = grandchild.textContent?.trim() || '';
              const tagName = grandchild.tagName;
              const formattedTagName = this.formatTagName(tagName);
              const contentType = this.getContentType(text);
              const additionalInfo = this.parseAdditionalSchemaInfo(tagName);

              result += `<td data-xml-tag="${tagName}" data-content="${text}" data-content-type="${contentType}">`;

              if (this.hasEnumeration(tagName)) {
                const enumValues = this.getEnumerationValues(tagName);
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
              } else {
                if (isEditable) {
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
                    const inputType = this.getInputType(text);
                    result += `<input type="${inputType}" 
                              class="doc-text-input" 
                              data-xml-tag="${tagName}" 
                              data-content="${text}"
                              data-content-type="${contentType}"
                              value="${text}" 
                              placeholder="Enter ${formattedTagName.toLowerCase()}"${validationAttrs} />`;
                  }
                } else {
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
              }
              result += '</td>';
            });
            if (isEditable) {
              result +=
                '<td><button class="doc-delete-button" type="button">Delete</button></td>';
            }
            result += '</tr>';
          });
          result += '</tbody>';
          result += '</table>';
        }
        result += '</div>';
      } else if (hasChildElements && level <= 2) {
        // Handle non-collection containers
        if (level === 1) {
          if (isEditable) {
            result += `<div class="doc-section-container">
              <label class="doc-field-label"><strong>Section:</strong></label>
              <input type="text" class="doc-section-input" value="${this.formatTagName(
                node.tagName
              )}" 
                     data-xml-tag="${node.tagName}" data-level="${level}" 
                     placeholder="Enter section name" />
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

      // Add attributes as metadata
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

      // Handle text content
      if (hasTextContent) {
        const text = node.textContent?.trim() || '';
        const tagName = node.tagName;
        const formattedTagName = this.formatTagName(tagName);
        const additionalInfo = this.parseAdditionalSchemaInfo(tagName);

        if (this.hasEnumeration(tagName)) {
          const enumValues = this.getEnumerationValues(tagName);
          result += `<div class="doc-field-container" data-xml-tag="${tagName}" data-content="${text}" data-content-type="enum">`;
          result += `<label class="doc-field-label"><strong>${formattedTagName}:</strong></label>`;
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
          const inputType = this.getInputType(text);
          const contentType = this.getContentType(text);
          result += `<div class="doc-field-container" data-xml-tag="${tagName}" data-content="${text}" data-content-type="${contentType}">`;
          result += `<label class="doc-field-label"><strong>${formattedTagName}:</strong></label>`;
          if (additionalInfo.hasDocumentation) {
            result += `<div class="doc-field-help" title="${'Additional information available'}">ℹ️</div>`;
          }
          if (isEditable) {
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
      } else if (hasChildElements && !isCollection) {
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
   * Convert WYSIWYG HTML back to XML
   */
  static wysiwygToXml(htmlContent: string): string {
    try {
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      const xmlDocument = container.querySelector('.xml-document');
      if (!xmlDocument) {
        throw new Error('No XML document found in WYSIWYG editor');
      }
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

    // Handle attributes
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

    // Find content elements
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
      `[data-xml-tag="${tagName}"] .doc-content, [data-xml-tag="${tagName}"] .doc-table-container`
    );

    if (
      textInputs.length > 0 ||
      selectElements.length > 0 ||
      contentElements.length > 0
    ) {
      xml += '>';
      textInputs.forEach((input) => {
        const inputElement = input as HTMLInputElement | HTMLTextAreaElement;
        const content =
          inputElement.value || inputElement.getAttribute('data-content') || '';
        xml += this.escapeXmlContent(content);
      });
      selectElements.forEach((select) => {
        const selectElement = select as HTMLSelectElement;
        const selectedValue =
          selectElement.value ||
          selectElement.getAttribute('data-content') ||
          '';
        xml += this.escapeXmlContent(selectedValue);
      });
      contentElements.forEach((contentElement) => {
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
      xml += '>';
      const processedTags = new Set<string>();
      childContainers.forEach((childContainer) => {
        const isTable = childContainer.classList.contains(
          'doc-table-container'
        );
        if (isTable) {
          const childElements = childContainer.querySelectorAll('tr');
          const childTagName = Array.from(childElements)[0]
            ?.querySelector('td')
            ?.getAttribute('data-xml-tag')
            ?.split('.')[0];
          if (childTagName && !processedTags.has(childTagName)) {
            processedTags.add(childTagName);
            childElements.forEach((row) => {
              const rowXml = `<${childTagName}>`;
              const cells = row.querySelectorAll('td[data-xml-tag]');
              let cellXml = '';
              cells.forEach((cell) => {
                const cellTag = cell.getAttribute('data-xml-tag');
                const content =
                  (
                    cell.querySelector('input, textarea, select') as
                      | HTMLInputElement
                      | HTMLTextAreaElement
                      | HTMLSelectElement
                  )?.value ||
                  cell.getAttribute('data-content') ||
                  cell.textContent?.trim() ||
                  '';
                if (cellTag) {
                  cellXml += `<${cellTag}>${this.escapeXmlContent(
                    content
                  )}</${cellTag}>`;
                }
              });
              xml += `${rowXml}${cellXml}</${childTagName}>`;
            });
          }
        } else {
          const childElements =
            childContainer.querySelectorAll('[data-xml-tag]');
          childElements.forEach((childElement) => {
            const childTag = childElement.getAttribute('data-xml-tag');
            if (childTag && !processedTags.has(childTag)) {
              processedTags.add(childTag);
              xml += this.buildXmlElement(container, childTag, level + 1);
            }
          });
        }
      });
      xml += `</${tagName}>`;
    } else {
      xml += '/>';
    }

    return xml;
  }

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
