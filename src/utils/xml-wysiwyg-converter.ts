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
    enumDocumentation?: { [value: string]: string };
    defaultValue?: string;
  };
}

export class XmlWysiwygConverter {
  private static schemaInfo: SchemaInfo = {};
  private static xsdContent: string = '';
  private static boundClickHandler: ((event: Event) => void) | null = null;
  private static documentMetadata = {
    title: '',
    author: '',
    date: new Date().toLocaleDateString(),
    pageNumber: 1,
  };

  // Optimization properties
  private static updateCallback: ((xmlContent: string) => void) | null = null;
  private static updateDebounceTimer: NodeJS.Timeout | null = null;
  private static parsedXsdCache = new Map<string, any>();
  private static enumCache = new Map<
    string,
    { values: string[]; documentation: { [value: string]: string } }
  >();

  /**
   * Set a callback to be called when XML changes
   */
  static onXmlChange(callback: (xmlContent: string) => void): void {
    this.updateCallback = callback;
  }

  /**
   * Clear the callback
   */
  static clearCallback(): void {
    this.updateCallback = null;
    // Clear caches when callback is cleared
    this.parsedXsdCache.clear();
    this.enumCache.clear();
  }

  /**
   * Trigger XML update with debouncing
   */
  private static triggerXmlUpdate(): void {
    if (!this.updateCallback) return;

    // Clear existing timer
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    // Debounce updates
    this.updateDebounceTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        try {
          const wysiwygDoc = document.querySelector('.wysiwyg-document');
          if (wysiwygDoc) {
            const xml = this.buildXmlFromDocument(wysiwygDoc);
            const formatted = this.formatXml(xml);
            this.updateCallback!(formatted);
          }
        } catch (error) {
          console.error('Error updating XML:', error);
        }
      });
    }, 300);
  }

  /**
   * Set schema information for dropdown rendering
   */
  static setSchemaInfo(schema: SchemaInfo, xsdContent?: string): void {
    this.schemaInfo = schema;
    if (xsdContent) {
      this.xsdContent = xsdContent;
      // Clear cache when new XSD is set
      this.parsedXsdCache.clear();
      this.enumCache.clear();
      // Parse and store enum documentation from XSD
      this.enrichSchemaWithDocumentation();
    }
    // Initialize event handlers after DOM is ready
    setTimeout(() => this.initializeEventHandlers(), 100);
  }

  /**
   * Render WYSIWYG header with PDF styling
   */
  private static renderHeader(
    rootElement: Element | null,
    isEditable: boolean
  ): string {
    if (!rootElement) return '';

    const title = this.formatTagName(rootElement.tagName);
    let html = `<div class="wysiwyg-header">`;

    if (isEditable) {
      html += `<input type="text" class="wysiwyg-title-input" value="${title}" 
               data-xml-tag="${rootElement.tagName}" placeholder="Document Title" />`;
    } else {
      html += `<h1>${title}</h1>`;
    }

    // Add metadata for attributes
    if (rootElement.attributes.length > 0) {
      html += '<div class="wysiwyg-metadata">';
      for (let i = 0; i < rootElement.attributes.length; i++) {
        const attr = rootElement.attributes[i];
        if (i > 0) html += '<span> | </span>';
        html += `<span>${this.formatTagName(attr.name)}: ${attr.value}</span>`;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Render WYSIWYG footer
   */
  private static renderFooter(): string {
    return `
      <div class="wysiwyg-footer">
        <span>Page ${this.documentMetadata.pageNumber}</span>
        <span>${this.documentMetadata.date}</span>
      </div>
    `;
  }

  /**
   * Optimized XML to WYSIWYG conversion with async processing
   */
  static async xmlToWysiwygAsync(
    xmlContent: string,
    isEditable: boolean = true
  ): Promise<string> {
    return new Promise((resolve) => {
      const processXml = () => {
        try {
          const unescapedXml = this.unescapeHTML(xmlContent);
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(
            unescapedXml,
            'application/xml'
          );

          const parseError = xmlDoc.querySelector('parsererror');
          if (parseError) {
            resolve(
              `<div class="wysiwyg-error">XML Parsing Error: ${parseError.textContent}</div>`
            );
            return;
          }

          if (xmlDoc.documentElement) {
            this.documentMetadata.title = this.formatTagName(
              xmlDoc.documentElement.tagName
            );
          }

          let html = `
            <div class="wysiwyg-document">
              <style>
                ${this.getOptimizedWysiwygStyles()}
              </style>
              <div class="wysiwyg-page">
                ${this.renderHeader(xmlDoc.documentElement, isEditable)}
                <div class="wysiwyg-content">
          `;

          if (xmlDoc.documentElement) {
            html += this.processNodeOptimized(
              xmlDoc.documentElement,
              0,
              isEditable
            );
          }

          html += `
                </div>
                ${this.renderFooter()}
              </div>
            </div>
          `;

          requestAnimationFrame(() => {
            this.initializeEventHandlers();
          });

          resolve(html);
        } catch (error) {
          resolve(
            `<div class="wysiwyg-error">Error converting XML: ${
              error instanceof Error ? error.message : 'Unknown error'
            }</div>`
          );
        }
      };

      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(processXml);
      } else {
        setTimeout(processXml, 0);
      }
    });
  }

  /**
   * Standard synchronous XML to WYSIWYG conversion (fallback)
   */
  static xmlToWysiwyg(xmlContent: string, isEditable: boolean = true): string {
    try {
      const unescapedXml = this.unescapeHTML(xmlContent);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescapedXml, 'application/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return `<div class="wysiwyg-error">XML Parsing Error: ${parseError.textContent}</div>`;
      }

      if (xmlDoc.documentElement) {
        this.documentMetadata.title = this.formatTagName(
          xmlDoc.documentElement.tagName
        );
      }

      let html = `
        <div class="wysiwyg-document">
          <style>
            ${this.getOptimizedWysiwygStyles()}
          </style>
          <div class="wysiwyg-page">
            ${this.renderHeader(xmlDoc.documentElement, isEditable)}
            <div class="wysiwyg-content">
      `;

      if (xmlDoc.documentElement) {
        html += this.processNode(xmlDoc.documentElement, 0, isEditable);
      }

      html += `
            </div>
            ${this.renderFooter()}
          </div>
        </div>
      `;

      setTimeout(() => this.initializeEventHandlers(), 100);

      return html;
    } catch (error) {
      return `<div class="wysiwyg-error">Error converting XML: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</div>`;
    }
  }

  /**
   * Optimized node processing with early returns
   */
  private static processNodeOptimized(
    node: Element,
    level: number = 0,
    isEditable: boolean = true
  ): string {
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    let result = '';
    const childCount = node.children.length;

    // Early return for text nodes
    if (childCount === 0 && node.textContent?.trim()) {
      return this.renderField(node, isEditable);
    }

    // Check if collection (all children have same tag)
    if (childCount > 0) {
      const firstChildTag = node.children[0]?.tagName;
      const isCollection =
        firstChildTag &&
        Array.from(node.children).every(
          (child) => child.tagName === firstChildTag
        );

      if (level === 0) {
        // Process root children
        for (let i = 0; i < childCount; i++) {
          result += this.processNodeOptimized(
            node.children[i] as Element,
            level + 1,
            isEditable
          );
        }
      } else if (isCollection && level <= 2) {
        result += this.renderTableOptimized(node, level, isEditable);
      } else if (!isCollection && level === 1) {
        // Section
        result += `<h2 class="wysiwyg-section" data-xml-tag="${
          node.tagName
        }">${this.formatTagName(node.tagName)}</h2>`;

        if (node.attributes.length > 0) {
          result += this.renderAttributes(node, isEditable);
        }

        for (let i = 0; i < childCount; i++) {
          result += this.processNodeOptimized(
            node.children[i] as Element,
            level + 1,
            isEditable
          );
        }
      } else if (!isCollection && level === 2) {
        // Subsection
        result += `<h3 class="wysiwyg-subsection" data-xml-tag="${
          node.tagName
        }">${this.formatTagName(node.tagName)}</h3>`;

        for (let i = 0; i < childCount; i++) {
          result += this.processNodeOptimized(
            node.children[i] as Element,
            level + 1,
            isEditable
          );
        }
      } else if (!isCollection) {
        // Container
        for (let i = 0; i < childCount; i++) {
          result += this.processNodeOptimized(
            node.children[i] as Element,
            level + 1,
            isEditable
          );
        }
      }
    }

    return result;
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
   * Render a field with label and value (PDF style)
   */
  private static renderField(node: Element, isEditable: boolean): string {
    const tagName = node.tagName;
    const text = node.textContent?.trim() || '';
    const formattedLabel = this.formatTagName(tagName);
    const contentType = this.getContentType(text);
    const additionalInfo = this.parseAdditionalSchemaInfo(tagName);

    let html = `<div class="wysiwyg-field-group">`;
    html += `<span class="wysiwyg-field-label">${formattedLabel}:</span>`;

    if (isEditable) {
      // Always show display span by default for editable fields
      let displayValue = text || 'N/A';

      // Format display value based on content type
      if (contentType === 'email') {
        displayValue = text;
      } else if (contentType === 'url') {
        displayValue = text;
      } else if (contentType === 'date' && text) {
        displayValue = this.formatDate(text);
      } else if (contentType === 'currency') {
        displayValue = text;
      }

      // Special handling for enum fields
      if (this.hasEnumeration(tagName)) {
        displayValue = text || 'Not specified';
      }

      html += `<span class="wysiwyg-field-display" style="display: inline-block;">${displayValue}</span>`;

      if (this.hasEnumeration(tagName)) {
        // Create searchable trigger button (hidden by default)
        const triggerId = `searchable-${tagName}-${Date.now()}`;
        html += `<button type="button" 
                  id="${triggerId}"
                  class="wysiwyg-searchable-trigger" 
                  data-xml-tag="${tagName}" 
                  data-current-value="${text}"
                  style="display: none;">
                  ${text || 'Not specified'}
                </button>`;
      } else {
        let validationAttrs = '';
        if (additionalInfo.minLength)
          validationAttrs += ` minlength="${additionalInfo.minLength}"`;
        if (additionalInfo.maxLength)
          validationAttrs += ` maxlength="${additionalInfo.maxLength}"`;
        if (additionalInfo.pattern)
          validationAttrs += ` pattern="${additionalInfo.pattern}"`;

        // Add input (hidden by default)
        if (text.length > 100 || contentType === 'paragraph') {
          html += `<textarea class="wysiwyg-textarea-input" 
                    data-xml-tag="${tagName}" 
                    data-content="${text}"
                    placeholder="Enter ${formattedLabel.toLowerCase()}"
                    rows="4"
                    style="display: none;"${validationAttrs}>${text}</textarea>`;
        } else {
          const inputType = this.getInputType(text);
          html += `<input type="${inputType}" 
                    class="wysiwyg-text-input" 
                    data-xml-tag="${tagName}" 
                    data-content="${text}"
                    value="${text}" 
                    placeholder="Enter ${formattedLabel.toLowerCase()}"
                    style="display: none;"${validationAttrs} />`;
        }
      }

      // Add edit/save/cancel buttons with icons
      html += `<div class="wysiwyg-field-buttons">`;
      html += `<button class="wysiwyg-edit-field-button" type="button" title="Edit">✏️</button>`;
      html += `<button class="wysiwyg-save-field-button" style="display: none;" type="button" title="Save">💾</button>`;
      html += `<button class="wysiwyg-cancel-field-button" style="display: none;" type="button" title="Cancel">❌</button>`;
      html += `</div>`;
    } else {
      // Non-editable mode - format based on content type
      let valueHtml = '';
      switch (contentType) {
        case 'email':
          valueHtml = `<a href="mailto:${text}" class="wysiwyg-link">${text}</a>`;
          break;
        case 'url':
          valueHtml = `<a href="${text}" target="_blank" class="wysiwyg-link">${text}</a>`;
          break;
        case 'date':
          valueHtml = `<span class="wysiwyg-date">${this.formatDate(
            text
          )}</span>`;
          break;
        case 'currency':
          valueHtml = `<span class="wysiwyg-currency">${text}</span>`;
          break;
        case 'paragraph':
          html += `</div><div class="wysiwyg-text-block">${text}`;
          valueHtml = '';
          break;
        default:
          valueHtml = `<span class="wysiwyg-field-value">${
            text || 'N/A'
          }</span>`;
      }
      if (valueHtml) {
        html += valueHtml;
      }
    }

    html += '</div>';
    return html;
  }

  /**
   * Render attributes as metadata
   */
  private static renderAttributes(node: Element, isEditable: boolean): string {
    if (node.attributes.length === 0) return '';

    let html = '<div class="wysiwyg-metadata-block">';
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      html += `
        <div class="wysiwyg-metadata-item">
          <span class="wysiwyg-metadata-label">${this.formatTagName(
            attr.name
          )}:</span>`;

      if (isEditable) {
        html += `<input type="text" class="wysiwyg-text-input" 
                  data-attr-name="${attr.name}" 
                  value="${attr.value}" 
                  style="flex: 1; font-size: 9pt;" />`;
      } else {
        html += `<span class="wysiwyg-metadata-value">${attr.value}</span>`;
      }

      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  /**
   * Standard node processing (non-optimized fallback)
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

      const isCollection =
        hasChildElements &&
        Array.from(node.children).every(
          (child) =>
            child.nodeType === Node.ELEMENT_NODE &&
            child.tagName === node.children[0].tagName
        );

      if (level === 0 && hasChildElements) {
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
        return result;
      }

      if (isCollection && level <= 2) {
        result += this.renderTableOptimized(node, level, isEditable);
      } else if (hasChildElements && !isCollection && level === 1) {
        result += `<h2 class="wysiwyg-section" data-xml-tag="${
          node.tagName
        }">${this.formatTagName(node.tagName)}</h2>`;

        if (node.attributes.length > 0) {
          result += this.renderAttributes(node, isEditable);
        }

        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
      } else if (hasChildElements && !isCollection && level === 2) {
        result += `<h3 class="wysiwyg-subsection" data-xml-tag="${
          node.tagName
        }">${this.formatTagName(node.tagName)}</h3>`;

        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
      } else if (hasTextContent) {
        result += this.renderField(node, isEditable);
      } else if (hasChildElements && !isCollection) {
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
      }
    }

    return result;
  }

  /**
   * Optimized table rendering with virtual scrolling
   */
  private static renderTableOptimized(
    node: Element,
    _level: number,
    isEditable: boolean
  ): string {
    const childTagName = node.children[0]?.tagName;
    if (!childTagName) return '';

    const rowCount = node.children.length;
    const headers = Array.from(node.children[0].children).map(
      (child) => child.tagName
    );

    // Use virtual scrolling for large tables
    const useVirtualScroll = rowCount > 100;
    const initialRows = useVirtualScroll ? 50 : rowCount;

    let html = `<div class="wysiwyg-table-container" 
                     data-collection-tag="${node.tagName}" 
                     data-item-tag="${childTagName}"
                     ${useVirtualScroll ? 'data-virtual-scroll="true"' : ''}>`;

    html += `<h3 class="wysiwyg-subsection" data-xml-tag="${
      node.tagName
    }">${this.formatTagName(node.tagName)}</h3>`;

    if (isEditable) {
      html += `<button class="wysiwyg-add-button" type="button">Add ${this.formatTagName(
        childTagName
      )}</button>`;
    }

    html += '<div class="wysiwyg-table-wrapper">';
    html += '<table class="wysiwyg-table">';

    // Header
    html += '<thead><tr>';
    headers.forEach((header) => {
      html += `<th>${this.formatTagName(header)}</th>`;
    });
    if (isEditable) {
      html += '<th class="wysiwyg-table-actions">Actions</th>';
    }
    html += '</tr></thead>';

    // Body - render only initial rows for performance
    html += '<tbody>';
    for (
      let rowIndex = 0;
      rowIndex < Math.min(initialRows, rowCount);
      rowIndex++
    ) {
      html += this.renderTableRow(
        node.children[rowIndex],
        rowIndex,
        isEditable
      );
    }
    html += '</tbody>';
    html += '</table>';

    if (useVirtualScroll) {
      // Store remaining data for load more functionality
      html += `<div class="wysiwyg-load-more" 
                    data-start-index="${initialRows}" 
                    data-total-rows="${rowCount}">
                 <button type="button">
                   Load More (${rowCount - initialRows} remaining)
                 </button>
               </div>`;
    }

    html += '</div></div>';

    return html;
  }

  /**
   * Render a single table row
   */
  private static renderTableRow(
    child: Element,
    rowIndex: number,
    isEditable: boolean
  ): string {
    let html = '<tr>';

    Array.from(child.children).forEach((grandchild, colIndex) => {
      const text = grandchild.textContent?.trim() || '';
      const tagName = grandchild.tagName;

      html += `<td data-xml-tag="${tagName}">`;
      html += `<span class="wysiwyg-cell-display">${text || 'N/A'}</span>`;

      if (isEditable) {
        if (this.hasEnumeration(tagName)) {
          const triggerId = `searchable-${tagName}-${rowIndex}-${colIndex}`;
          html += `<button type="button" 
                    id="${triggerId}"
                    class="wysiwyg-searchable-trigger" 
                    data-xml-tag="${tagName}" 
                    data-current-value="${text}"
                    style="display: none;">
                    ${text || 'Not specified'}
                  </button>`;
        } else {
          const inputType = this.getInputType(text);
          html += `<input type="${inputType}" 
                    class="wysiwyg-text-input" 
                    data-xml-tag="${tagName}" 
                    value="${text}" 
                    placeholder="${this.formatTagName(tagName)}" 
                    style="display: none;"
                    disabled />`;
        }
      }

      html += '</td>';
    });

    if (isEditable) {
      html += '<td class="wysiwyg-table-actions">';
      html += `<button class="wysiwyg-edit-row-button" type="button" title="Edit">✏️</button>`;
      html += `<button class="wysiwyg-save-row-button" style="display: none;" type="button" title="Save">💾</button>`;
      html += `<button class="wysiwyg-cancel-row-button" style="display: none;" type="button" title="Cancel">❌</button>`;
      html += `<button class="wysiwyg-delete-button" type="button" title="Delete">🗑️</button>`;
      html += '</td>';
    }

    html += '</tr>';
    return html;
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
   * Enrich schema info with documentation extracted from XSD
   */
  private static enrichSchemaWithDocumentation(): void {
    Object.keys(this.schemaInfo).forEach((tagName) => {
      if (this.schemaInfo[tagName].type === 'enum') {
        const enumData = this.parseEnumerationWithDocumentation(tagName);
        if (enumData.values.length > 0) {
          this.schemaInfo[tagName].enumValues = enumData.values;
          this.schemaInfo[tagName].enumDocumentation = enumData.documentation;
        }
      }
    });
  }

  /**
   * Optimized enumeration parsing with caching
   */
  private static parseEnumerationWithDocumentation(tagName: string): {
    values: string[];
    documentation: { [value: string]: string };
  } {
    // Check cache first
    if (this.enumCache.has(tagName)) {
      return this.enumCache.get(tagName)!;
    }

    const result = {
      values: [] as string[],
      documentation: {} as { [value: string]: string },
    };

    if (!this.xsdContent) return result;

    try {
      // Parse XSD only once and cache it
      let xsdDoc = this.parsedXsdCache.get(this.xsdContent);
      if (!xsdDoc) {
        const parser = new DOMParser();
        xsdDoc = parser.parseFromString(this.xsdContent, 'application/xml');
        this.parsedXsdCache.set(this.xsdContent, xsdDoc);
      }

      // Collect all simpleType definitions
      const typeDefinitions = new Map<
        string,
        { values: string[]; documentation: { [value: string]: string } }
      >();

      const simpleTypes = xsdDoc.querySelectorAll(
        'xs\\:simpleType, simpleType'
      );
      simpleTypes.forEach((simpleType: Element) => {
        const typeName = simpleType.getAttribute('name');
        if (!typeName) return;

        const typeData = {
          values: [] as string[],
          documentation: {} as { [value: string]: string },
        };

        const restriction = simpleType.querySelector(
          'xs\\:restriction, restriction'
        );
        if (restriction) {
          const enumerations = restriction.querySelectorAll(
            'xs\\:enumeration, enumeration'
          );

          enumerations.forEach((enumNode) => {
            const value = enumNode.getAttribute('value');
            if (value) {
              typeData.values.push(value);

              // Try annotation first
              const annotation = enumNode.querySelector(
                'xs\\:annotation, annotation'
              );
              if (annotation) {
                const documentation = annotation.querySelector(
                  'xs\\:documentation, documentation'
                );
                if (documentation && documentation.textContent) {
                  typeData.documentation[value] =
                    documentation.textContent.trim();
                }
              }

              // If no annotation, try extracting from comments
              if (!typeData.documentation[value]) {
                const comment = this.extractCommentForEnumValue(
                  value,
                  this.xsdContent
                );
                if (comment) {
                  typeData.documentation[value] = comment;
                }
              }
            }
          });
        }

        if (typeData.values.length > 0) {
          typeDefinitions.set(typeName, typeData);
        }
      });

      // Find the element and check its type
      const elements = xsdDoc.querySelectorAll('xs\\:element, element');

      for (const element of elements) {
        const elementName = element.getAttribute('name');

        if (elementName === tagName) {
          const elementType = element.getAttribute('type');

          if (elementType) {
            const cleanType = elementType.includes(':')
              ? elementType.split(':')[1]
              : elementType;

            const typeData = typeDefinitions.get(cleanType);
            if (typeData) {
              result.values = typeData.values;
              result.documentation = typeData.documentation;
              this.enumCache.set(tagName, result);
              return result;
            }
          }

          // Check for inline simpleType
          const inlineSimpleType = element.querySelector(
            'xs\\:simpleType, simpleType'
          );
          if (inlineSimpleType) {
            const restriction = inlineSimpleType.querySelector(
              'xs\\:restriction, restriction'
            );
            if (restriction) {
              const enumerations = restriction.querySelectorAll(
                'xs\\:enumeration, enumeration'
              );

              enumerations.forEach((enumNode: any) => {
                const value = enumNode.getAttribute('value');
                if (value) {
                  result.values.push(value);

                  const comment = this.extractCommentForEnumValue(
                    value,
                    this.xsdContent
                  );
                  if (comment) {
                    result.documentation[value] = comment;
                  }
                }
              });
            }
          }

          if (result.values.length > 0) {
            this.enumCache.set(tagName, result);
            return result;
          }
        }
      }

      // Check if tagName matches a type definition directly
      const directTypeData = typeDefinitions.get(tagName);
      if (directTypeData) {
        result.values = directTypeData.values;
        result.documentation = directTypeData.documentation;
      }

      // Cache the result
      this.enumCache.set(tagName, result);
    } catch (error) {
      console.warn('Error parsing enumeration:', error);
    }

    return result;
  }

  /**
   * Extract comment for a specific enumeration value
   */
  private static extractCommentForEnumValue(
    value: string,
    xsdContent: string
  ): string | null {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const patterns = [
      new RegExp(
        `<(?:xs:)?enumeration\\s+value="${escapedValue}"[^>]*>\\s*<!--\\s*([^-]+(?:-[^-]+)*)\\s*-->\\s*</(?:xs:)?enumeration>`,
        'si'
      ),
      new RegExp(
        `<(?:xs:)?enumeration\\s+value="${escapedValue}"[^>]*>\\s*\\n?\\s*<!--\\s*([^-]+(?:-[^-]+)*)\\s*-->`,
        'si'
      ),
      new RegExp(
        `<(?:xs:)?enumeration\\s+value="${escapedValue}"[^>]*><!--\\s*([^-]+(?:-[^-]+)*)\\s*-->`,
        'si'
      ),
      new RegExp(
        `<!--\\s*([^-]+(?:-[^-]+)*)\\s*-->\\s*\\n?\\s*<(?:xs:)?enumeration\\s+value="${escapedValue}"`,
        'si'
      ),
      new RegExp(
        `<(?:xs:)?enumeration\\s+value="${escapedValue}"[^>]*/?>\\s*<!--\\s*([^-]+(?:-[^-]+)*)\\s*-->`,
        'si'
      ),
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(xsdContent);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  /**
   * Initialize event handlers
   */
  private static initializeEventHandlers(): void {
    if (this.boundClickHandler) {
      document.removeEventListener('click', this.boundClickHandler);
    }

    this.boundClickHandler = this.handleGlobalClick.bind(this);
    document.addEventListener('click', this.boundClickHandler);
  }

  /**
   * Handle all click events globally
   */
  private static handleGlobalClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Check for searchable option clicks
    const optionElement = target.closest('.wysiwyg-searchable-option');
    if (
      optionElement &&
      optionElement.classList.contains('wysiwyg-searchable-option')
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.selectSearchableOption(optionElement as HTMLElement);
      return;
    }

    // Check for load more button in tables
    if (target.closest('.wysiwyg-load-more button')) {
      event.preventDefault();
      this.handleLoadMoreRows(target);
      return;
    }

    // Handle other buttons
    if (target.classList.contains('wysiwyg-add-button')) {
      event.preventDefault();
      this.handleAddButton(target);
    } else if (target.classList.contains('wysiwyg-delete-button')) {
      event.preventDefault();
      this.handleDeleteButton(target);
    } else if (target.classList.contains('wysiwyg-edit-field-button')) {
      event.preventDefault();
      this.handleEditFieldButton(target);
    } else if (target.classList.contains('wysiwyg-save-field-button')) {
      event.preventDefault();
      this.handleSaveFieldButton(target);
    } else if (target.classList.contains('wysiwyg-edit-row-button')) {
      event.preventDefault();
      this.handleEditRowButton(target);
    } else if (target.classList.contains('wysiwyg-save-row-button')) {
      event.preventDefault();
      this.handleSaveRowButton(target);
    } else if (target.classList.contains('wysiwyg-cancel-field-button')) {
      event.preventDefault();
      this.handleCancelFieldButton(target);
    } else if (target.classList.contains('wysiwyg-cancel-row-button')) {
      event.preventDefault();
      this.handleCancelRowButton(target);
    } else if (target.classList.contains('wysiwyg-searchable-trigger')) {
      event.preventDefault();
      this.openSearchableDropdown(target);
    } else if (target.classList.contains('wysiwyg-searchable-close')) {
      event.preventDefault();
      this.closeSearchableDropdown();
    }
  }

  /**
   * Handle edit field button click
   */
  private static handleEditFieldButton(button: HTMLElement): void {
    const fieldGroup = button.closest('.wysiwyg-field-group');
    if (!fieldGroup) return;

    const displaySpan = fieldGroup.querySelector(
      '.wysiwyg-field-display'
    ) as HTMLElement;
    const input = fieldGroup.querySelector(
      'input, textarea'
    ) as HTMLInputElement;
    const searchableTrigger = fieldGroup.querySelector(
      '.wysiwyg-searchable-trigger'
    ) as HTMLElement;

    if (displaySpan) {
      const currentValue = displaySpan.textContent || '';

      if (searchableTrigger) {
        // For searchable dropdown
        searchableTrigger.setAttribute('data-original-value', currentValue);
        searchableTrigger.setAttribute(
          'data-current-value',
          currentValue === 'Not specified' ? '' : currentValue
        );
        searchableTrigger.textContent = currentValue;

        displaySpan.style.display = 'none';
        searchableTrigger.style.display = 'inline-block';
      } else if (input) {
        // For regular inputs
        input.setAttribute('data-original-value', currentValue);
        input.value = currentValue === 'N/A' ? '' : currentValue;

        displaySpan.style.display = 'none';
        input.style.display = 'block';
        input.classList.remove('hidden');
        input.focus();
      }

      // Switch buttons
      button.style.display = 'none';
      const saveButton = fieldGroup.querySelector(
        '.wysiwyg-save-field-button'
      ) as HTMLElement;
      const cancelButton = fieldGroup.querySelector(
        '.wysiwyg-cancel-field-button'
      ) as HTMLElement;
      if (saveButton) saveButton.style.display = 'inline-flex';
      if (cancelButton) cancelButton.style.display = 'inline-flex';
    }
  }

  /**
   * Handle cancel field button click
   */
  private static handleCancelFieldButton(button: HTMLElement): void {
    const fieldGroup = button.closest('.wysiwyg-field-group');
    if (!fieldGroup) return;

    const displaySpan = fieldGroup.querySelector(
      '.wysiwyg-field-display'
    ) as HTMLElement;
    const input = fieldGroup.querySelector(
      'input, textarea'
    ) as HTMLInputElement;
    const searchableTrigger = fieldGroup.querySelector(
      '.wysiwyg-searchable-trigger'
    ) as HTMLElement;

    if (displaySpan) {
      if (searchableTrigger) {
        // For searchable dropdown
        const originalValue =
          searchableTrigger.getAttribute('data-original-value') ||
          'Not specified';
        displaySpan.textContent = originalValue;
        searchableTrigger.style.display = 'none';
      } else if (input) {
        // For regular inputs
        const originalValue = input.getAttribute('data-original-value') || '';
        displaySpan.textContent = originalValue || 'N/A';
        input.style.display = 'none';
      }

      displaySpan.style.display = 'inline-block';

      // Switch buttons
      button.style.display = 'none';
      const saveButton = fieldGroup.querySelector(
        '.wysiwyg-save-field-button'
      ) as HTMLElement;
      if (saveButton) saveButton.style.display = 'none';
      const editButton = fieldGroup.querySelector(
        '.wysiwyg-edit-field-button'
      ) as HTMLElement;
      if (editButton) editButton.style.display = 'inline-flex';
    }
  }

  /**
   * Handle edit row button click
   */
  private static handleEditRowButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (!row) return;

    // Store original values for all cells
    row.querySelectorAll('td[data-xml-tag]').forEach((cell) => {
      const displaySpan = cell.querySelector(
        '.wysiwyg-cell-display'
      ) as HTMLElement;
      const input = cell.querySelector('input, textarea') as HTMLInputElement;
      const searchableTrigger = cell.querySelector(
        '.wysiwyg-searchable-trigger'
      ) as HTMLElement;

      if (displaySpan) {
        const currentValue = displaySpan.textContent || '';

        if (searchableTrigger) {
          searchableTrigger.setAttribute('data-original-value', currentValue);
          searchableTrigger.setAttribute(
            'data-current-value',
            currentValue === 'N/A' ? '' : currentValue
          );
          searchableTrigger.textContent =
            currentValue === 'N/A' ? 'Not specified' : currentValue;
          displaySpan.style.display = 'none';
          searchableTrigger.style.display = 'block';
        } else if (input) {
          input.setAttribute('data-original-value', currentValue);
          input.value = currentValue === 'N/A' ? '' : currentValue;
          displaySpan.style.display = 'none';
          input.style.display = 'block';
          input.disabled = false;
        }
      }
    });

    // Add editing class to row
    row.classList.add('editing');

    // Switch buttons
    button.style.display = 'none';
    const saveButton = button.parentElement?.querySelector(
      '.wysiwyg-save-row-button'
    ) as HTMLElement;
    const cancelButton = button.parentElement?.querySelector(
      '.wysiwyg-cancel-row-button'
    ) as HTMLElement;
    if (saveButton) saveButton.style.display = 'inline-flex';
    if (cancelButton) cancelButton.style.display = 'inline-flex';

    // Focus first input
    const firstInput = row.querySelector(
      'input:not(.wysiwyg-searchable-trigger), textarea'
    ) as HTMLElement;
    if (firstInput) firstInput.focus();
  }

  /**
   * Handle cancel row button click
   */
  private static handleCancelRowButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (!row) return;

    // Restore original values for all cells
    row.querySelectorAll('td[data-xml-tag]').forEach((cell) => {
      const displaySpan = cell.querySelector(
        '.wysiwyg-cell-display'
      ) as HTMLElement;
      const input = cell.querySelector('input, textarea') as HTMLInputElement;
      const searchableTrigger = cell.querySelector(
        '.wysiwyg-searchable-trigger'
      ) as HTMLElement;

      if (displaySpan) {
        if (searchableTrigger) {
          const originalValue =
            searchableTrigger.getAttribute('data-original-value') || '';
          displaySpan.textContent = originalValue;
          searchableTrigger.style.display = 'none';
        } else if (input) {
          const originalValue = input.getAttribute('data-original-value') || '';
          input.value = originalValue;
          input.style.display = 'none';
          input.disabled = true;
        }

        displaySpan.style.display = 'block';
      }
    });

    // Remove editing class from row
    row.classList.remove('editing');

    // Switch buttons
    button.style.display = 'none';
    const saveButton = button.parentElement?.querySelector(
      '.wysiwyg-save-row-button'
    ) as HTMLElement;
    if (saveButton) saveButton.style.display = 'none';
    const editButton = button.parentElement?.querySelector(
      '.wysiwyg-edit-row-button'
    ) as HTMLElement;
    if (editButton) editButton.style.display = 'inline-flex';
  }

  /**
   * Handle add button click - add new row to table
   */
  private static handleAddButton(button: HTMLElement): void {
    // Find the table container
    const tableContainer = button.closest('.wysiwyg-table-container');
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
    newRow.classList.add('editing');
    newRow.innerHTML = this.generateEmptyTableRow(columns, true);

    // Add to table
    tableBody.appendChild(newRow);

    // Focus first input
    const firstInput = newRow.querySelector(
      'input:not(.wysiwyg-searchable-trigger), textarea'
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
  private static generateEmptyTableRow(
    columns: string[],
    isNew: boolean = false
  ): string {
    let html = '';

    columns.forEach((tagName, index) => {
      const schemaInfo = this.schemaInfo[tagName] || {};
      const defaultValue = schemaInfo.defaultValue || '';
      const formattedTagName = this.formatTagName(tagName);

      html += `<td data-xml-tag="${tagName}" data-content="${defaultValue}" data-content-type="text">`;

      // Add display span (hidden for new rows)
      html += `<span class="wysiwyg-cell-display" style="display: ${
        isNew ? 'none' : 'block'
      };">${defaultValue || 'N/A'}</span>`;

      if (this.hasEnumeration(tagName)) {
        // Create searchable trigger button for enum fields
        const triggerId = `searchable-${tagName}-${Date.now()}-${index}`;
        html += `<button type="button" 
                  id="${triggerId}"
                  class="wysiwyg-searchable-trigger" 
                  data-xml-tag="${tagName}" 
                  data-current-value=""
                  style="display: ${isNew ? 'block' : 'none'};">
                  Not specified
                </button>`;
      } else {
        // Create input field
        const inputType = this.getInputType(defaultValue || 'text');
        html += `<input type="${inputType}" 
                  class="wysiwyg-text-input" 
                  data-xml-tag="${tagName}" 
                  data-content=""
                  data-content-type="text"
                  value="" 
                  placeholder="Enter ${formattedTagName.toLowerCase()}" 
                  style="display: ${isNew ? 'block' : 'none'};"
                  ${!isNew ? 'disabled' : ''} />`;
      }

      html += '</td>';
    });

    // Add action buttons column with icons
    html += '<td class="wysiwyg-table-actions">';
    if (isNew) {
      html += `<button class="wysiwyg-save-row-button" type="button" title="Save">💾</button>`;
      html += `<button class="wysiwyg-cancel-row-button" type="button" title="Cancel">❌</button>`;
    } else {
      html += `<button class="wysiwyg-edit-row-button" type="button" title="Edit">✏️</button>`;
      html += `<button class="wysiwyg-save-row-button" style="display: none;" type="button" title="Save">💾</button>`;
      html += `<button class="wysiwyg-cancel-row-button" style="display: none;" type="button" title="Cancel">❌</button>`;
    }
    html += `<button class="wysiwyg-delete-button" type="button" title="Delete">🗑️</button>`;
    html += '</td>';

    return html;
  }

  /**
   * Handle load more rows for virtual scrolling
   */
  private static handleLoadMoreRows(target: HTMLElement): void {
    const loadMoreDiv = target.closest('.wysiwyg-load-more');
    if (!loadMoreDiv) return;

    const tableContainer = loadMoreDiv.closest('.wysiwyg-table-container');
    if (!tableContainer) return;

    // Implementation would load more rows from stored data
    // This is a placeholder for the actual implementation
    console.log('Load more rows functionality to be implemented');
  }

  /**
   * Open searchable dropdown modal
   */
  private static openSearchableDropdown(trigger: HTMLElement): void {
    this.closeSearchableDropdown();

    const fieldGroup = trigger.closest('.wysiwyg-field-group');
    const cell = trigger.closest('td');
    const container = fieldGroup || cell;
    if (!container) return;

    const tagName = trigger.getAttribute('data-xml-tag') || '';
    const currentValue = trigger.getAttribute('data-current-value') || '';
    const formattedTagName = this.formatTagName(tagName);

    const modal = document.createElement('div');
    modal.className = 'wysiwyg-searchable-modal';
    modal.setAttribute('data-xml-tag', tagName);
    modal.setAttribute('data-trigger-id', trigger.id || '');
    (modal as any)._trigger = trigger;

    modal.innerHTML = `
      <div class="wysiwyg-searchable-content" role="dialog" aria-modal="true">
        <div class="wysiwyg-searchable-header">
          <h3>Select ${formattedTagName}</h3>
          <button class="wysiwyg-searchable-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="wysiwyg-searchable-search">
          <input type="text" 
                 class="wysiwyg-searchable-input" 
                 placeholder="Search ${formattedTagName.toLowerCase()}..." 
                 aria-label="Search options" />
        </div>
        <div class="wysiwyg-searchable-options" role="listbox">
          <div class="wysiwyg-loading">Loading options...</div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      this.populateDropdownOptions(modal, tagName, currentValue);
    });
  }

  /**
   * Populate dropdown options with virtual scrolling
   */
  private static populateDropdownOptions(
    modal: Element,
    tagName: string,
    currentValue: string
  ): void {
    const optionsContainer: any = modal.querySelector(
      '.wysiwyg-searchable-options'
    );
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    const schemaInfo = this.schemaInfo[tagName];
    const enumValues = schemaInfo?.enumValues || [];
    const enumDocs = schemaInfo?.enumDocumentation || {};

    // Virtual scrolling for large lists
    const useVirtualScroll = enumValues.length > 50;
    const visibleOptions = useVirtualScroll ? 50 : enumValues.length;

    if (useVirtualScroll) {
      optionsContainer.setAttribute('data-virtual-scroll', 'true');
      optionsContainer.style.maxHeight = '400px';
      optionsContainer.style.overflowY = 'auto';
    }

    // Not specified option
    const notSpecifiedOption = this.createDropdownOption(
      '',
      'Not specified',
      '',
      currentValue === ''
    );
    optionsContainer.appendChild(notSpecifiedOption);

    // Create visible options using DocumentFragment
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < Math.min(visibleOptions, enumValues.length); i++) {
      const value = enumValues[i];
      const documentation = enumDocs[value] || '';
      const isSelected = value === currentValue;
      const optionElement = this.createDropdownOption(
        value,
        value,
        documentation,
        isSelected
      );
      fragment.appendChild(optionElement);
    }
    optionsContainer.appendChild(fragment);

    // Add load more button for virtual scrolling
    if (useVirtualScroll && enumValues.length > visibleOptions) {
      const loadMore = document.createElement('div');
      loadMore.className = 'wysiwyg-load-more-options';
      loadMore.innerHTML = `<button type="button">Load ${
        enumValues.length - visibleOptions
      } more options</button>`;
      loadMore.addEventListener('click', () => {
        this.loadMoreDropdownOptions(
          optionsContainer,
          enumValues,
          enumDocs,
          currentValue,
          visibleOptions
        );
      });
      optionsContainer.appendChild(loadMore);
    }

    // Set up search with debouncing
    const searchInput = modal.querySelector(
      '.wysiwyg-searchable-input'
    ) as HTMLInputElement;
    if (searchInput) {
      let searchDebounce: NodeJS.Timeout;

      const newSearchInput = searchInput.cloneNode(true) as HTMLInputElement;
      searchInput.parentNode?.replaceChild(newSearchInput, searchInput);

      newSearchInput.addEventListener('input', (e) => {
        e.stopPropagation();
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          const searchTerm = newSearchInput.value.toLowerCase();
          const options = optionsContainer.querySelectorAll(
            '.wysiwyg-searchable-option'
          );

          requestAnimationFrame(() => {
            options.forEach((option: any) => {
              const text = (option.textContent || '').toLowerCase();
              (option as HTMLElement).style.display = text.includes(searchTerm)
                ? 'flex'
                : 'none';
            });
          });
        }, 150);
      });

      newSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const firstVisible = optionsContainer.querySelector(
            '.wysiwyg-searchable-option:not([style*="none"])'
          ) as HTMLElement;
          if (firstVisible) firstVisible.focus();
        }
      });

      requestAnimationFrame(() => newSearchInput.focus());
    }

    this.attachOptionHandlers(optionsContainer, modal);
    this.setupModalCloseHandlers(modal);
  }

  /**
   * Load more dropdown options
   */
  private static loadMoreDropdownOptions(
    container: Element,
    enumValues: string[],
    enumDocs: { [key: string]: string },
    currentValue: string,
    startIndex: number
  ): void {
    const fragment = document.createDocumentFragment();
    const endIndex = Math.min(startIndex + 50, enumValues.length);

    for (let i = startIndex; i < endIndex; i++) {
      const value = enumValues[i];
      const documentation = enumDocs[value] || '';
      const isSelected = value === currentValue;
      const optionElement = this.createDropdownOption(
        value,
        value,
        documentation,
        isSelected
      );
      fragment.appendChild(optionElement);
    }

    const loadMoreBtn = container.querySelector('.wysiwyg-load-more-options');
    if (loadMoreBtn) {
      container.insertBefore(fragment, loadMoreBtn);

      if (endIndex >= enumValues.length) {
        loadMoreBtn.remove();
      } else {
        loadMoreBtn.innerHTML = `<button type="button">Load ${
          enumValues.length - endIndex
        } more options</button>`;
        loadMoreBtn.addEventListener('click', () => {
          this.loadMoreDropdownOptions(
            container,
            enumValues,
            enumDocs,
            currentValue,
            endIndex
          );
        });
      }
    }

    // Re-attach handlers to new options
    this.attachOptionHandlers(
      container,
      container.closest('.wysiwyg-searchable-modal')!
    );
  }

  /**
   * Create dropdown option element
   */
  private static createDropdownOption(
    value: string,
    displayText: string,
    documentation: string,
    isSelected: boolean
  ): HTMLElement {
    const option = document.createElement('div');
    option.className = `wysiwyg-searchable-option ${
      isSelected ? 'selected' : ''
    }`;
    option.setAttribute('data-value', value);
    option.setAttribute('role', 'option');
    option.setAttribute('tabindex', '0');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'wysiwyg-option-content';

    if (documentation && documentation.trim() !== '') {
      const formattedText = `${displayText} - ${documentation}`;
      const valueSpan = document.createElement('span');
      valueSpan.className = 'wysiwyg-option-value';
      valueSpan.textContent = formattedText;
      contentDiv.appendChild(valueSpan);
    } else {
      const valueSpan = document.createElement('span');
      valueSpan.className = 'wysiwyg-option-value';
      valueSpan.textContent = displayText;
      contentDiv.appendChild(valueSpan);
    }

    option.appendChild(contentDiv);

    if (isSelected) {
      const checkmark = document.createElement('span');
      checkmark.className = 'checkmark';
      checkmark.textContent = '✓';
      option.appendChild(checkmark);
    }

    return option;
  }

  /**
   * Attach event handlers to options
   */
  private static attachOptionHandlers(
    optionsContainer: Element,
    modal: Element
  ): void {
    const options = optionsContainer.querySelectorAll(
      '.wysiwyg-searchable-option'
    );

    options.forEach((option) => {
      const newOption = option.cloneNode(true) as HTMLElement;
      option.parentNode?.replaceChild(newOption, option);

      newOption.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleOptionSelection(newOption, modal);
      });

      newOption.addEventListener('keydown', (e) => {
        const evt = e as KeyboardEvent;
        if (evt.key === 'Enter' || evt.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          this.handleOptionSelection(newOption, modal);
        } else if (evt.key === 'ArrowDown') {
          e.preventDefault();
          const next = newOption.nextElementSibling as HTMLElement;
          if (
            next &&
            next.classList.contains('wysiwyg-searchable-option') &&
            next.style.display !== 'none'
          ) {
            next.focus();
          }
        } else if (evt.key === 'ArrowUp') {
          e.preventDefault();
          const prev = newOption.previousElementSibling as HTMLElement;
          if (
            prev &&
            prev.classList.contains('wysiwyg-searchable-option') &&
            prev.style.display !== 'none'
          ) {
            prev.focus();
          }
        }
      });
    });
  }

  /**
   * Setup modal close handlers
   */
  private static setupModalCloseHandlers(modal: Element): void {
    const bgClickHandler = (e: Event) => {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
        this.closeSearchableDropdown();
      }
    };

    const oldBgHandler = (modal as any)._bgClickHandler;
    if (oldBgHandler) {
      modal.removeEventListener('click', oldBgHandler);
    }

    modal.addEventListener('click', bgClickHandler);
    (modal as any)._bgClickHandler = bgClickHandler;

    const escapeHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeSearchableDropdown();
      }
    };

    const oldEscapeHandler = (modal as any)._escapeHandler;
    if (oldEscapeHandler) {
      document.removeEventListener('keydown', oldEscapeHandler);
    }

    document.addEventListener('keydown', escapeHandler);
    (modal as any)._escapeHandler = escapeHandler;
  }

  /**
   * Handle option selection
   */
  private static handleOptionSelection(
    option: HTMLElement,
    modal: Element
  ): void {
    const value = option.getAttribute('data-value') || '';
    const trigger = (modal as any)._trigger as HTMLElement;

    if (!trigger) {
      console.error('No trigger found for modal');
      return;
    }

    const displayText = value || 'Not specified';
    trigger.textContent = displayText;
    trigger.setAttribute('data-current-value', value);

    const fieldGroup = trigger.closest('.wysiwyg-field-group');
    const cell = trigger.closest('td');
    const container = fieldGroup || cell;

    if (container) {
      const displaySpan = container.querySelector(
        '.wysiwyg-field-display, .wysiwyg-cell-display'
      ) as HTMLElement;
      if (displaySpan && displaySpan.style.display === 'none') {
        trigger.setAttribute('data-pending-value', value);
      }
    }

    this.closeSearchableDropdown();
  }

  /**
   * Select searchable option
   */
  private static selectSearchableOption(option: HTMLElement): void {
    const modal = option.closest('.wysiwyg-searchable-modal');
    if (!modal) return;
    this.handleOptionSelection(option, modal);
  }

  /**
   * Close searchable dropdown
   */
  private static closeSearchableDropdown(): void {
    const modal = document.querySelector('.wysiwyg-searchable-modal');
    if (modal) {
      const escapeHandler = (modal as any)._escapeHandler;
      if (escapeHandler) {
        document.removeEventListener('keydown', escapeHandler);
      }

      const bgClickHandler = (modal as any)._bgClickHandler;
      if (bgClickHandler) {
        modal.removeEventListener('click', bgClickHandler);
      }

      (modal as any)._trigger = null;
      (modal as any)._escapeHandler = null;
      (modal as any)._bgClickHandler = null;

      modal.remove();
    }
  }

  // [All the button handlers remain the same - handleEditFieldButton, handleSaveFieldButton, etc.]
  // I'll include just the save handlers that trigger updates:

  /**
   * Handle save field button click
   */
  private static handleSaveFieldButton(button: HTMLElement): void {
    const fieldGroup = button.closest('.wysiwyg-field-group');
    if (!fieldGroup) return;

    const displaySpan = fieldGroup.querySelector(
      '.wysiwyg-field-display'
    ) as HTMLElement;
    const input = fieldGroup.querySelector(
      'input, textarea'
    ) as HTMLInputElement;
    const searchableTrigger = fieldGroup.querySelector(
      '.wysiwyg-searchable-trigger'
    ) as HTMLElement;

    if (displaySpan) {
      let newValue = '';

      if (searchableTrigger) {
        newValue =
          searchableTrigger.getAttribute('data-current-value') ||
          searchableTrigger.getAttribute('data-pending-value') ||
          '';
        searchableTrigger.removeAttribute('data-pending-value');
        searchableTrigger.style.display = 'none';
        newValue = newValue || 'Not specified';
      } else if (input) {
        newValue = input.value || 'N/A';
        input.setAttribute('data-content', newValue);
        input.style.display = 'none';
      }

      displaySpan.textContent = newValue;
      displaySpan.style.display = 'inline-block';

      button.style.display = 'none';
      const cancelButton = fieldGroup.querySelector(
        '.wysiwyg-cancel-field-button'
      ) as HTMLElement;
      if (cancelButton) cancelButton.style.display = 'none';
      const editButton = fieldGroup.querySelector(
        '.wysiwyg-edit-field-button'
      ) as HTMLElement;
      if (editButton) editButton.style.display = 'inline-flex';
    }

    this.triggerXmlUpdate();
  }

  /**
   * Handle save row button click
   */
  private static handleSaveRowButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (!row) return;

    row.querySelectorAll('td[data-xml-tag]').forEach((cell) => {
      const displaySpan = cell.querySelector(
        '.wysiwyg-cell-display'
      ) as HTMLElement;
      const input = cell.querySelector('input, textarea') as HTMLInputElement;
      const searchableTrigger = cell.querySelector(
        '.wysiwyg-searchable-trigger'
      ) as HTMLElement;

      if (displaySpan) {
        let newValue = '';

        if (searchableTrigger) {
          newValue = searchableTrigger.getAttribute('data-current-value') || '';
          if (!newValue) {
            newValue = displaySpan.getAttribute('data-pending-value') || '';
          }
          displaySpan.removeAttribute('data-pending-value');
          newValue = newValue || 'N/A';
          searchableTrigger.style.display = 'none';
        } else if (input) {
          newValue = input.value || 'N/A';
          input.setAttribute('data-content', newValue);
          input.style.display = 'none';
          input.disabled = true;
        }

        displaySpan.textContent = newValue;
        displaySpan.style.display = 'block';
      }
    });

    row.classList.remove('editing');

    button.style.display = 'none';
    const cancelButton = button.parentElement?.querySelector(
      '.wysiwyg-cancel-row-button'
    ) as HTMLElement;
    if (cancelButton) cancelButton.style.display = 'none';
    const editButton = button.parentElement?.querySelector(
      '.wysiwyg-edit-row-button'
    ) as HTMLElement;
    if (editButton) editButton.style.display = 'inline-flex';

    this.triggerXmlUpdate();
  }

  /**
   * Handle delete button click
   */
  private static handleDeleteButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (row && confirm('Are you sure you want to delete this row?')) {
      row.remove();
      this.triggerXmlUpdate();
    }
  }

  // [Include all other handler methods - they remain the same as in your original code]
  // handleEditFieldButton, handleCancelFieldButton, handleEditRowButton,
  // handleCancelRowButton, handleAddButton, etc.

  /**
   * Get optimized WYSIWYG styles
   */
  private static getOptimizedWysiwygStyles(): string {
    return `
      ${this.getWysiwygStyles()}
      
      /* Performance optimizations */
      .wysiwyg-table-container {
        contain: layout style;
      }
      
      .wysiwyg-searchable-modal {
        contain: layout style paint;
      }
      
      .wysiwyg-searchable-options {
        contain: layout style;
        will-change: scroll-position;
      }
      
      /* Virtual scrolling styles */
      .wysiwyg-load-more,
      .wysiwyg-load-more-options {
        text-align: center;
        padding: 10px;
      }
      
      .wysiwyg-load-more button,
      .wysiwyg-load-more-options button {
        padding: 8px 16px;
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .wysiwyg-load-more button:hover,
      .wysiwyg-load-more-options button:hover {
        background: #e0e0e0;
      }
      
      .wysiwyg-loading {
        padding: 20px;
        text-align: center;
        color: #666;
        font-style: italic;
      }
    `;
  }

  // [Include all remaining methods from your original code]
  // All the render methods, utility methods, XML conversion methods, etc.
  // They remain exactly the same as in your original implementation

  // I'll include the key ones for reference:

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
   * Get PDF-style CSS for WYSIWYG editor with searchable dropdown styles
   */
  private static getWysiwygStyles(): string {
    return `
      .wysiwyg-document {
        background: #ffffff;
        padding: 0px;
        min-height: 100vh;
        font-family: 'Ubuntu', 'Times New Roman', Times, serif;
      }

      .wysiwyg-loading {
      padding: 20px;
      text-align: center;
      color: #666;
      font-style: italic;
    }

      .wysiwyg-page {
        width: 100%;
        min-height: 11in;
        margin: 0 auto;
        background: white;
        padding: 0;
        position: relative;
      }

      .wysiwyg-header {
        padding: 0.5in 0.75in 0.25in 0.75in;
        border-bottom: 2px solid #333;
        margin-bottom: 0.25in;
      }

      .wysiwyg-header h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #000;
        margin: 0 0 8px 0;
        text-align: center;
      }

      .wysiwyg-title-input {
        font-size: 24pt;
        font-weight: bold;
        color: #000;
        width: 100%;
        text-align: center;
        border: none;
        border-bottom: 1px dashed #999;
        background: transparent;
        margin: 0 0 8px 0;
      }

      .wysiwyg-header .wysiwyg-metadata {
        display: flex;
        justify-content: space-between;
        font-size: 10pt;
        color: #666;
        margin-top: 8px;
      }

      .wysiwyg-content {
        padding: 0 0 1in 0;
        line-height: 1.6;
        color: #000;
      }

      .wysiwyg-footer {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0.25in 0.75in;
        border-top: 1px solid #ccc;
        font-size: 10pt;
        color: #666;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
      }

      .wysiwyg-section {
        margin: 24pt 0 12pt 0;
        font-size: 18pt;
        font-weight: bold;
        color: #000;
        border-bottom: 1px solid #333;
        padding-bottom: 4pt;
      }

      .wysiwyg-subsection {
        margin: 18pt 0 10pt 0;
        font-size: 14pt;
        font-weight: bold;
        color: #333;
      }

      .wysiwyg-field-group {
        margin: 12pt 0;
        display: flex;
        align-items: baseline;
        position: relative;
      }

      .wysiwyg-field-label {
        font-weight: bold;
        min-width: 140pt;
        color: #000;
        font-size: 11pt;
      }

      .wysiwyg-field-value {
        flex: 1;
        color: #000;
        font-size: 11pt;
      }

      .wysiwyg-field-display {
        flex: 1;
        font-size: 11pt;
        color: #000;
        display: inline-block;
        padding: 4pt 0;
      }

      .wysiwyg-cell-display {
        padding: 2pt 4pt;
        font-size: 10pt;
        color: #000;
        display: block;
      }

      .wysiwyg-text-input,
      .wysiwyg-textarea-input {
        flex: 1;
        padding: 4pt 6pt;
        border: 1px solid #999;
        border-radius: 2px;
        font-size: 11pt;
        font-family: inherit;
        background: #fafafa;
        display: none;
      }

      .wysiwyg-searchable-trigger {
        flex: 1;
        padding: 4pt 6pt;
        border: 1px solid #999;
        border-radius: 2px;
        font-size: 11pt;
        font-family: inherit;
        background: #fafafa;
        cursor: pointer;
        text-align: left;
        display: none;
        position: relative;
        transition: all 0.2s;
      }

      .wysiwyg-searchable-trigger:hover {
        border-color: #0066cc;
        background: white;
      }

      .wysiwyg-searchable-trigger::after {
        content: '▼';
        position: absolute;
        right: 8pt;
        top: 50%;
        transform: translateY(-50%);
        font-size: 8pt;
        color: #666;
      }

      .wysiwyg-searchable-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .wysiwyg-searchable-content {
        background: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s;
      }

      @keyframes slideUp {
        from { 
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .wysiwyg-searchable-header {
        padding: 16pt;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .wysiwyg-searchable-header h3 {
        margin: 0;
        font-size: 14pt;
        color: #333;
      }

      .wysiwyg-searchable-close {
        background: none;
        border: none;
        font-size: 18pt;
        color: #999;
        cursor: pointer;
        padding: 0;
        width: 24pt;
        height: 24pt;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: all 0.2s;
      }

      .wysiwyg-searchable-close:hover {
        background: #f5f5f5;
        color: #333;
      }

      .wysiwyg-searchable-search {
        padding: 12pt 16pt;
        border-bottom: 1px solid #e0e0e0;
      }

      .wysiwyg-searchable-input {
        width: 100%;
        padding: 8pt;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 11pt;
        font-family: inherit;
        transition: border-color 0.2s;
      }

      .wysiwyg-searchable-input:focus {
        outline: none;
        border-color: #0066cc;
        box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.1);
      }

      .wysiwyg-searchable-options {
        flex: 1;
        overflow-y: auto;
        padding: 8pt;
      }

      .wysiwyg-searchable-option {
        padding: 10pt 12pt;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin: 2pt 0;
        min-height: 40px;
      }

      .wysiwyg-option-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .wysiwyg-option-value {
        font-weight: 500;
        color: #333;
        font-size: 11pt;
      }

      .wysiwyg-option-doc {
        font-size: 9pt;
        color: #666;
        line-height: 1.3;
        margin-top: 2px;
      }

      .wysiwyg-searchable-option:hover {
        background: #f0f7ff;
      }

      .wysiwyg-searchable-option:hover .wysiwyg-option-doc {
        color: #555;
      }

      .wysiwyg-searchable-option.selected {
        background: #e3f2fd;
      }

      .wysiwyg-searchable-option.selected .wysiwyg-option-value {
        color: #0066cc;
        font-weight: 600;
      }

      .wysiwyg-searchable-option .checkmark {
        color: #0066cc;
        font-weight: bold;
        margin-left: 8px;
        flex-shrink: 0;
      }

      .wysiwyg-text-input.hidden,
      .wysiwyg-textarea-input.hidden {
        display: none !important;
      }

      .wysiwyg-text-input:disabled,
      .wysiwyg-textarea-input:disabled {
        background: #f5f5f5;
        border-color: #ddd;
        color: #555;
        cursor: not-allowed;
      }

      .wysiwyg-text-input:focus:not(:disabled),
      .wysiwyg-textarea-input:focus:not(:disabled) {
        outline: none;
        border-color: #0066cc;
        background: white;
      }

      .wysiwyg-textarea-input {
        resize: vertical;
        min-height: 60pt;
      }

      .wysiwyg-field-buttons {
        margin-left: 8pt;
        display: flex;
        gap: 4pt;
      }

      .wysiwyg-edit-field-button,
      .wysiwyg-save-field-button,
      .wysiwyg-cancel-field-button,
      .wysiwyg-edit-row-button,
      .wysiwyg-save-row-button,
      .wysiwyg-cancel-row-button {
        padding: 3pt 8pt;
        font-size: 12pt;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        white-space: nowrap;
        min-width: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        transition: background-color 0.2s;
      }

      .wysiwyg-edit-field-button:hover,
      .wysiwyg-edit-row-button:hover {
        background: #e3f2fd;
      }

      .wysiwyg-save-field-button:hover,
      .wysiwyg-save-row-button:hover {
        background: #e8f5e9;
      }

      .wysiwyg-cancel-field-button:hover,
      .wysiwyg-cancel-row-button:hover {
        background: #ffebee;
      }

      .wysiwyg-table-container {
        margin: 16pt 0;
        overflow-x: auto;
      }

      .wysiwyg-table-wrapper {
        overflow-x: auto;
        margin: 16pt 0;
        border: 1px solid #ddd;
        border-radius: 4px;
      }

      .wysiwyg-table {
        width: 100%;
        min-width: 600px;
        border-collapse: collapse;
        font-size: 10pt;
      }

      .wysiwyg-table thead {
        background: #f0f0f0;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .wysiwyg-table th {
        padding: 8pt;
        text-align: left;
        font-weight: bold;
        border: 1px solid #000;
        background: #e8e8e8;
        font-size: 10pt;
        white-space: nowrap;
      }

      .wysiwyg-table td {
        padding: 6pt 8pt;
        border: 1px solid #000;
        font-size: 10pt;
        min-width: 80px;
      }

      .wysiwyg-table tr:nth-child(even) {
        background: #f9f9f9;
      }

      .wysiwyg-table tr.editing {
        background: #fff3cd !important;
      }

      .wysiwyg-table input,
      .wysiwyg-table textarea {
        width: 100%;
        min-width: 80px;
        padding: 2pt 4pt;
        border: 1px solid #999;
        font-size: 10pt;
        background: white;
        display: none;
      }

      .wysiwyg-table .wysiwyg-searchable-trigger {
        width: 100%;
        min-width: 80px;
        padding: 2pt 4pt;
        border: 1px solid #999;
        font-size: 10pt;
        background: white;
        display: none;
      }

      .wysiwyg-table tr.editing input,
      .wysiwyg-table tr.editing textarea,
      .wysiwyg-table tr.editing .wysiwyg-searchable-trigger {
        display: block !important;
      }

      .wysiwyg-table input:disabled,
      .wysiwyg-table textarea:disabled {
        background: #f5f5f5;
        border-color: #ddd;
        color: #555;
        cursor: not-allowed;
      }

      .wysiwyg-table-actions {
        white-space: nowrap;
        text-align: center;
      }

      .wysiwyg-add-button {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 6pt 12pt;
        font-size: 10pt;
        cursor: pointer;
        border-radius: 3px;
        margin-bottom: 8pt;
      }

      .wysiwyg-add-button:hover {
        background: #45a049;
      }

      .wysiwyg-delete-button {
        background: transparent;
        border: none;
        padding: 4pt 8pt;
        font-size: 12pt;
        cursor: pointer;
        border-radius: 2px;
        margin: 0 2pt;
        min-width: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }

      .wysiwyg-delete-button:hover {
        background: #ffebee;
      }

      .wysiwyg-metadata-block {
        background: #f5f5f5;
        border: 1px solid #ddd;
        padding: 8pt;
        margin: 12pt 0;
        font-size: 9pt;
      }

      .wysiwyg-metadata-item {
        display: flex;
        margin: 4pt 0;
      }

      .wysiwyg-metadata-label {
        font-weight: bold;
        min-width: 80pt;
      }

      .wysiwyg-metadata-value {
        flex: 1;
      }

      .wysiwyg-text-block {
        margin: 12pt 0;
        text-align: justify;
        font-size: 11pt;
        line-height: 1.5;
      }

      .wysiwyg-link {
        color: #0066cc;
        text-decoration: underline;
      }

      .wysiwyg-date {
        font-style: italic;
      }

      .wysiwyg-currency {
        font-family: 'Courier New', monospace;
        text-align: right;
      }

      .wysiwyg-error {
        background: #fee;
        border: 1px solid #fcc;
        padding: 20px;
        margin: 20px;
        border-radius: 4px;
        color: #c00;
      }

      @media print {
        .wysiwyg-document {
          background: white;
          padding: 0;
        }

        .wysiwyg-page {
          box-shadow: none;
          margin: 0;
        }

        .wysiwyg-add-button,
        .wysiwyg-delete-button,
        .wysiwyg-edit-field-button,
        .wysiwyg-save-field-button,
        .wysiwyg-cancel-field-button,
        .wysiwyg-edit-row-button,
        .wysiwyg-save-row-button,
        .wysiwyg-cancel-row-button,
        .wysiwyg-searchable-trigger {
          display: none !important;
        }

        .wysiwyg-searchable-modal {
          display: none !important;
        }
      }
    `;
  }

  /**
   * Convert WYSIWYG HTML back to XML
   */
  static wysiwygToXml(htmlContent: string): string {
    try {
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      const xmlDocument = container.querySelector('.wysiwyg-document');
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

  // [Include all other methods like buildXmlFromDocument, extractFieldXml,
  // extractTableXml, formatXml, utility methods, etc. - they remain the same]

  private static buildXmlFromDocument(container: Element): string {
    const titleElement = container.querySelector(
      '.wysiwyg-title-input, .wysiwyg-header h1'
    );
    if (!titleElement) {
      throw new Error('No root XML element found');
    }

    const rootTag =
      titleElement.getAttribute('data-xml-tag') ||
      this.tagNameFromTitle(titleElement.textContent || '') ||
      'root';

    // Find content container
    const contentContainer = container.querySelector('.wysiwyg-content');
    if (!contentContainer) {
      return `<${rootTag}></${rootTag}>`;
    }

    // Build the XML
    let xml = `<${rootTag}>`;

    // Process the content in order, keeping track of what we've processed
    const processedIndices = new Set<number>();
    const children = Array.from(contentContainer.children);

    for (let i = 0; i < children.length; i++) {
      // Skip if already processed
      if (processedIndices.has(i)) continue;

      const element = children[i];

      if (element.classList.contains('wysiwyg-section')) {
        // Get the ACTUAL tag name from data attribute
        const sectionTag =
          element.getAttribute('data-xml-tag') ||
          this.tagNameFromTitle(element.textContent?.trim() || '');

        processedIndices.add(i);

        // Collect all elements until the next section or table
        const sectionFields: Element[] = [];
        let j = i + 1;

        while (j < children.length) {
          const nextElement = children[j];

          // Stop at next section or table container
          if (
            nextElement.classList.contains('wysiwyg-section') ||
            nextElement.classList.contains('wysiwyg-subsection') ||
            nextElement.classList.contains('wysiwyg-table-container')
          ) {
            break;
          }

          // Collect field groups
          if (nextElement.classList.contains('wysiwyg-field-group')) {
            sectionFields.push(nextElement);
            processedIndices.add(j);
          }

          j++;
        }

        // Build section XML
        xml += `<${sectionTag}>`;
        sectionFields.forEach((field) => {
          const fieldXml = this.extractFieldXml(field);
          if (fieldXml) xml += fieldXml;
        });
        xml += `</${sectionTag}>`;
      } else if (element.classList.contains('wysiwyg-table-container')) {
        // Handle tables/collections
        processedIndices.add(i);
        const tableXml = this.extractTableXmlWithStoredTags(element);
        if (tableXml) xml += tableXml;
      } else if (element.classList.contains('wysiwyg-field-group')) {
        // Standalone field (not part of any section)
        if (!processedIndices.has(i)) {
          processedIndices.add(i);
          const fieldXml = this.extractFieldXml(element);
          if (fieldXml) xml += fieldXml;
        }
      }
    }

    xml += `</${rootTag}>`;
    return xml;
  }

  private static extractTableXmlWithStoredTags(
    tableContainer: Element
  ): string {
    // Get the stored tag names
    const collectionTag = tableContainer.getAttribute('data-collection-tag');
    const itemTag = tableContainer.getAttribute('data-item-tag');

    if (!collectionTag || !itemTag) {
      // Fallback to the old method if tags aren't stored
      return this.extractTableXml(tableContainer);
    }

    let xml = `<${collectionTag}>`;

    // Process each row
    const rows = tableContainer.querySelectorAll('tbody tr');

    rows.forEach((row) => {
      const dataCells = row.querySelectorAll('td[data-xml-tag]');
      if (dataCells.length === 0) return;

      xml += `<${itemTag}>`;

      dataCells.forEach((cell) => {
        const cellTag = cell.getAttribute('data-xml-tag');
        if (!cellTag) return;

        const displaySpan = cell.querySelector('.wysiwyg-cell-display');
        let cellValue = '';

        if (displaySpan) {
          cellValue = displaySpan.textContent || '';
          if (cellValue === 'N/A' || cellValue === 'Not specified') {
            cellValue = '';
          }
        }

        if (cellValue) {
          xml += `<${cellTag}>${this.escapeXmlContent(cellValue)}</${cellTag}>`;
        }
      });

      xml += `</${itemTag}>`;
    });

    xml += `</${collectionTag}>`;

    return xml;
  }

  /**
   * Extract XML from a field group
   */
  private static extractFieldXml(fieldGroup: Element): string {
    const displaySpan = fieldGroup.querySelector('.wysiwyg-field-display');
    const input = fieldGroup.querySelector(
      'input, textarea'
    ) as HTMLInputElement;
    const searchableTrigger = fieldGroup.querySelector(
      '.wysiwyg-searchable-trigger'
    ) as HTMLElement;

    let fieldTag = '';
    let value = '';

    // Get the field tag
    if (input) {
      fieldTag = input.getAttribute('data-xml-tag') || '';
    } else if (searchableTrigger) {
      fieldTag = searchableTrigger.getAttribute('data-xml-tag') || '';
    }

    // Get the current value
    if (displaySpan) {
      value = displaySpan.textContent || '';
      // Clean up special values
      if (value === 'N/A' || value === 'Not specified') {
        value = '';
      }
    }

    // Only return XML if we have both tag and value
    if (fieldTag && value) {
      return `<${fieldTag}>${this.escapeXmlContent(value)}</${fieldTag}>`;
    }

    return '';
  }
  /**
   * Extract XML from a table container
   */
  private static extractTableXml(tableContainer: Element): string {
    let xml = '';

    // Get the collection name from the section title
    const sectionTitle =
      tableContainer
        .querySelector('.wysiwyg-subsection')
        ?.textContent?.trim() || '';
    const collectionTag = this.tagNameFromTitle(sectionTitle);

    if (!collectionTag) return '';

    // Determine item tag (e.g., "Employees" -> "Employee")
    let itemTag = collectionTag;
    if (collectionTag.endsWith('ies')) {
      // e.g., "Categories" -> "Category"
      itemTag = collectionTag.slice(0, -3) + 'y';
    } else if (collectionTag.endsWith('es')) {
      // e.g., "Addresses" -> "Address"
      itemTag = collectionTag.slice(0, -2);
    } else if (collectionTag.endsWith('s')) {
      // e.g., "Employees" -> "Employee"
      itemTag = collectionTag.slice(0, -1);
    }

    // Start collection tag
    xml += `<${collectionTag}>`;

    // Process each row
    const rows = tableContainer.querySelectorAll('tbody tr');

    rows.forEach((row) => {
      // Skip if this is an empty row or doesn't have data cells
      const dataCells = row.querySelectorAll('td[data-xml-tag]');
      if (dataCells.length === 0) return;

      xml += `<${itemTag}>`;

      // Process each cell in the row
      dataCells.forEach((cell) => {
        const cellTag = cell.getAttribute('data-xml-tag');
        if (!cellTag) return;

        // Get the value from display span (visible value)
        const displaySpan = cell.querySelector('.wysiwyg-cell-display');
        let cellValue = '';

        if (displaySpan) {
          cellValue = displaySpan.textContent || '';
          // Clean up special values
          if (cellValue === 'N/A' || cellValue === 'Not specified') {
            cellValue = '';
          }
        }

        // Only add the field if it has a value
        if (cellValue) {
          xml += `<${cellTag}>${this.escapeXmlContent(cellValue)}</${cellTag}>`;
        }
      });

      xml += `</${itemTag}>`;
    });

    xml += `</${collectionTag}>`;

    return xml;
  }

  /**
   * Convert display title back to original tag name
   * This reverses the formatTagName function
   */
  private static tagNameFromTitle(title: string): string {
    if (!title) return '';

    // This should reverse what formatTagName does:
    // formatTagName converts "CompanyInfo" to "Company Info"
    // So we need to convert "Company Info" back to "CompanyInfo"

    // Remove spaces and make camelCase
    const words = title.trim().split(/\s+/);

    if (words.length === 0) return '';

    // First word starts with lowercase (unless it's a single word)
    // Other words start with uppercase
    return words
      .map((word, index) => {
        if (index === 0 && words.length > 1) {
          // First word of multi-word: lowercase first letter
          return word.charAt(0).toLowerCase() + word.slice(1).toLowerCase();
        } else if (index === 0) {
          // Single word: keep original casing
          return word;
        } else {
          // Subsequent words: uppercase first letter
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
      })
      .join('');
  }

  // Utility methods (same as before)
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
      .replace(/-/g, ' ')
      .trim();
  }

  private static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
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

  // Add these helper methods if they don't exist
  // private static escapeHtml(str: string): string {
  //   const div = document.createElement('div');
  //   div.textContent = str;
  //   return div.innerHTML;
  // }

  // private static escapeHtmlAttribute(str: string): string {
  //   return str
  //     .replace(/&/g, '&amp;')
  //     .replace(/"/g, '&quot;')
  //     .replace(/'/g, '&#39;')
  //     .replace(/</g, '&lt;')
  //     .replace(/>/g, '&gt;');
  // }

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
