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
  private static documentMetadata = {
    title: '',
    author: '',
    date: new Date().toLocaleDateString(),
    pageNumber: 1,
  };

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
   * Initialize event handlers for add/delete/edit buttons
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
    }
  }

  /**
   * Handle edit field button click
   */
  private static handleEditFieldButton(button: HTMLElement): void {
    const fieldGroup = button.closest('.wysiwyg-field-group');
    if (!fieldGroup) return;

    const input = fieldGroup.querySelector(
      'input, textarea, select'
    ) as HTMLElement;
    const displaySpan = fieldGroup.querySelector('.wysiwyg-field-display');

    if (input && displaySpan) {
      // Hide display span and show input
      displaySpan.classList.add('hidden');
      input.classList.remove('hidden');

      // Focus the input
      (input as HTMLInputElement).focus();

      // Switch buttons
      button.classList.add('hidden');
      const saveButton = fieldGroup.querySelector('.wysiwyg-save-field-button');
      if (saveButton) {
        saveButton.classList.remove('hidden');
      }
    }
  }

  /**
   * Handle save field button click
   */
  private static handleSaveFieldButton(button: HTMLElement): void {
    const fieldGroup = button.closest('.wysiwyg-field-group');
    if (!fieldGroup) return;

    const input = fieldGroup.querySelector(
      'input, textarea, select'
    ) as HTMLInputElement;
    const displaySpan = fieldGroup.querySelector('.wysiwyg-field-display');

    if (input && displaySpan) {
      // Update display span with new value
      displaySpan.textContent = input.value || 'N/A';

      // Show display span and hide input
      displaySpan.classList.remove('hidden');
      input.classList.add('hidden');

      // Switch buttons
      button.classList.add('hidden');
      const editButton = fieldGroup.querySelector('.wysiwyg-edit-field-button');
      if (editButton) {
        editButton.classList.remove('hidden');
      }
    }
  }

  /**
   * Handle edit row button click
   */
  private static handleEditRowButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (!row) return;

    // Enable all inputs in this row
    row.querySelectorAll('input, select, textarea').forEach((input) => {
      (input as HTMLInputElement).disabled = false;
    });

    // Add editing class to row
    row.classList.add('editing');

    // Switch buttons
    button.classList.add('hidden');
    const saveButton = button.parentElement?.querySelector(
      '.wysiwyg-save-row-button'
    );
    if (saveButton) {
      saveButton.classList.remove('hidden');
    }
  }

  /**
   * Handle save row button click
   */
  private static handleSaveRowButton(button: HTMLElement): void {
    const row = button.closest('tr');
    if (!row) return;

    // Disable all inputs in this row
    row.querySelectorAll('input, select, textarea').forEach((input) => {
      (input as HTMLInputElement).disabled = true;
    });

    // Remove editing class from row
    row.classList.remove('editing');

    // Switch buttons
    button.classList.add('hidden');
    const editButton = button.parentElement?.querySelector(
      '.wysiwyg-edit-row-button'
    );
    if (editButton) {
      editButton.classList.remove('hidden');
    }
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
        // Create dropdown for enum fields (disabled by default)
        const enumValues = this.getEnumerationValues(tagName);
        html += `<select class="wysiwyg-enum-select" data-xml-tag="${tagName}" data-content="" disabled>`;
        html += `<option value="">Select ${formattedTagName}</option>`;
        enumValues.forEach((value) => {
          html += `<option value="${value}">${value}</option>`;
        });
        html += '</select>';
      } else {
        // Create input field (disabled by default)
        const inputType = this.getInputType(defaultValue || 'text');
        html += `<input type="${inputType}" 
                  class="wysiwyg-text-input" 
                  data-xml-tag="${tagName}" 
                  data-content=""
                  data-content-type="text"
                  value="" 
                  placeholder="Enter ${formattedTagName.toLowerCase()}" 
                  disabled />`;
      }

      html += '</td>';
    });

    // Add action buttons column with icons
    html += '<td class="wysiwyg-table-actions">';
    html += `<button class="wysiwyg-edit-row-button" type="button" title="Edit">✏️</button>`;
    html += `<button class="wysiwyg-save-row-button hidden" type="button" title="Save">💾</button>`;
    html += `<button class="wysiwyg-delete-button" type="button" title="Delete">✖</button>`;
    html += '</td>';

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
   * Get PDF-style CSS for WYSIWYG editor
   */
  private static getWysiwygStyles(): string {
    return `
      .wysiwyg-document {
        background: #ffffff;
        padding: 0px;
        min-height: 100vh;
        font-family: 'Ubuntu', 'Times New Roman', Times, serif;
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
        padding: 4pt 6pt;
        font-size: 11pt;
        color: #000;
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 2px;
      }

      .wysiwyg-field-display.hidden {
        display: none;
      }

      .wysiwyg-text-input,
      .wysiwyg-textarea-input,
      .wysiwyg-enum-select {
        flex: 1;
        padding: 4pt 6pt;
        border: 1px solid #999;
        border-radius: 2px;
        font-size: 11pt;
        font-family: inherit;
        background: #fafafa;
      }

      .wysiwyg-text-input.hidden,
      .wysiwyg-textarea-input.hidden,
      .wysiwyg-enum-select.hidden {
        display: none;
      }

      .wysiwyg-text-input:disabled,
      .wysiwyg-textarea-input:disabled,
      .wysiwyg-enum-select:disabled {
        background: #f5f5f5;
        border-color: #ddd;
        color: #555;
        cursor: not-allowed;
      }

      .wysiwyg-text-input:focus:not(:disabled),
      .wysiwyg-textarea-input:focus:not(:disabled),
      .wysiwyg-enum-select:focus:not(:disabled) {
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
      .wysiwyg-save-field-button {
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
      }

      .wysiwyg-edit-field-button {
        background: #2196F3;
        color: white;
        background: transparent;
      }

      .wysiwyg-edit-field-button:hover {
        background: #1976D2;
      }

      .wysiwyg-save-field-button {
        background: #4CAF50;
        color: white;
         background: transparent;
      }

      .wysiwyg-save-field-button:hover {
        background: #45a049;
      }

      .wysiwyg-edit-field-button.hidden,
      .wysiwyg-save-field-button.hidden {
        display: none;
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
      .wysiwyg-table select,
      .wysiwyg-table textarea {
        width: 100%;
        min-width: 80px;
        padding: 2pt 4pt;
        border: 1px solid #999;
        font-size: 10pt;
        background: white;
      }

      .wysiwyg-table input:disabled,
      .wysiwyg-table select:disabled,
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

      .wysiwyg-delete-button,
      .wysiwyg-edit-row-button,
      .wysiwyg-save-row-button {
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
      }

      .wysiwyg-delete-button {
        background: #f44336;
        color: black;
         background: transparent;
      }

      .wysiwyg-delete-button:hover {
        background: #da190b;
        color: white;
      }

      .wysiwyg-edit-row-button {
        background: #2196F3;
        color: white;
         background: transparent;
      }

      .wysiwyg-edit-row-button:hover {
        background: #1976D2;
      }

      .wysiwyg-save-row-button {
        background: #4CAF50;
        color: white;
         background: transparent;
      }

      .wysiwyg-save-row-button:hover {
        background: #45a049;
      }

      .wysiwyg-edit-row-button.hidden,
      .wysiwyg-save-row-button.hidden {
        display: none;
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
        .wysiwyg-delete-button {
          display: none;
        }
      }
    `;
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
   * Convert XML content to WYSIWYG HTML format with PDF-style layout
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

      // Extract document metadata
      if (xmlDoc.documentElement) {
        this.documentMetadata.title = this.formatTagName(
          xmlDoc.documentElement.tagName
        );
      }

      let html = `
        <div class="wysiwyg-document">
          <style>
            ${this.getWysiwygStyles()}
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

      // Initialize event handlers after HTML is rendered
      setTimeout(() => this.initializeEventHandlers(), 100);

      return html;
    } catch (error) {
      return `<div class="wysiwyg-error">Error converting XML: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</div>`;
    }
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
   * Process XML node and convert to document-style HTML with PDF layout
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

      // Skip root element content as it's handled in header
      if (level === 0 && hasChildElements) {
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
        return result;
      }

      // Handle different node types based on structure and level
      if (isCollection && level <= 2) {
        // Render as table with PDF styling
        result += this.renderTable(node, level, isEditable);
      } else if (hasChildElements && !isCollection && level === 1) {
        // Section header
        result += `<h2 class="wysiwyg-section">${this.formatTagName(
          node.tagName
        )}</h2>`;

        // Add attributes if present
        if (node.attributes.length > 0) {
          result += this.renderAttributes(node, isEditable);
        }

        // Process children
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
      } else if (hasChildElements && !isCollection && level === 2) {
        // Subsection
        result += `<h3 class="wysiwyg-subsection">${this.formatTagName(
          node.tagName
        )}</h3>`;

        // Process children
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
      } else if (hasTextContent) {
        // Render as field with PDF styling
        result += this.renderField(node, isEditable);
      } else if (hasChildElements && !isCollection) {
        // Container - process children
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1, isEditable);
        });
      }
    }

    return result;
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

    if (this.hasEnumeration(tagName)) {
      const enumValues = this.getEnumerationValues(tagName);
      if (isEditable) {
        // Add display span (visible by default)
        html += `<span class="wysiwyg-field-display">${
          text || 'Not specified'
        }</span>`;

        // Add select (hidden by default)
        html += `<select class="wysiwyg-enum-select hidden" data-xml-tag="${tagName}">`;
        html += `<option value="">Select ${formattedLabel}</option>`;
        enumValues.forEach((value) => {
          const selected = value === text ? 'selected' : '';
          html += `<option value="${value}" ${selected}>${value}</option>`;
        });
        html += '</select>';

        // Add edit/save buttons with icons
        html += `<div class="wysiwyg-field-buttons">`;
        html += `<button class="wysiwyg-edit-field-button" type="button" title="Edit">✏️</button>`;
        html += `<button class="wysiwyg-save-field-button hidden" type="button" title="Save">💾</button>`;
        html += `</div>`;
      } else {
        html += `<span class="wysiwyg-field-value">${
          text || 'Not specified'
        }</span>`;
      }
    } else {
      if (isEditable) {
        // Add display span (visible by default)
        html += `<span class="wysiwyg-field-display">${text || 'N/A'}</span>`;

        let validationAttrs = '';
        if (additionalInfo.minLength)
          validationAttrs += ` minlength="${additionalInfo.minLength}"`;
        if (additionalInfo.maxLength)
          validationAttrs += ` maxlength="${additionalInfo.maxLength}"`;
        if (additionalInfo.pattern)
          validationAttrs += ` pattern="${additionalInfo.pattern}"`;

        // Add input (hidden by default)
        if (text.length > 100 || contentType === 'paragraph') {
          html += `<textarea class="wysiwyg-textarea-input hidden" 
                    data-xml-tag="${tagName}" 
                    placeholder="Enter ${formattedLabel.toLowerCase()}"
                    rows="4"${validationAttrs}>${text}</textarea>`;
        } else {
          const inputType = this.getInputType(text);
          html += `<input type="${inputType}" 
                    class="wysiwyg-text-input hidden" 
                    data-xml-tag="${tagName}" 
                    value="${text}" 
                    placeholder="Enter ${formattedLabel.toLowerCase()}"${validationAttrs} />`;
        }

        // Add edit/save buttons with icons
        html += `<div class="wysiwyg-field-buttons">`;
        html += `<button class="wysiwyg-edit-field-button" type="button" title="Edit">✏️</button>`;
        html += `<button class="wysiwyg-save-field-button hidden" type="button" title="Save">💾</button>`;
        html += `</div>`;
      } else {
        // Format based on content type
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
   * Render a collection as a table with PDF styling
   */
  private static renderTable(
    node: Element,
    // @ts-ignore
    level: number,
    isEditable: boolean
  ): string {
    const childTagName = node.children[0]?.tagName;
    if (!childTagName) return '';

    // Get headers from first child
    const headers = Array.from(node.children[0].children).map(
      (child) => child.tagName
    );

    let html = `<div class="wysiwyg-table-container">`;
    html += `<h3 class="wysiwyg-subsection">${this.formatTagName(
      node.tagName
    )}</h3>`;

    if (isEditable) {
      html += `<button class="wysiwyg-add-button" type="button">Add ${this.formatTagName(
        childTagName
      )}</button>`;
    }

    // Add wrapper for overflow
    html += '<div class="wysiwyg-table-wrapper">';
    html += '<table class="wysiwyg-table">';

    // Table header
    html += '<thead><tr>';
    headers.forEach((header) => {
      html += `<th>${this.formatTagName(header)}</th>`;
    });
    if (isEditable) {
      html += '<th class="wysiwyg-table-actions">Actions</th>';
    }
    html += '</tr></thead>';

    // Table body
    html += '<tbody>';
    Array.from(node.children).forEach((child) => {
      html += '<tr>';
      Array.from(child.children).forEach((grandchild) => {
        const text = grandchild.textContent?.trim() || '';
        const tagName = grandchild.tagName;
        const contentType = this.getContentType(text);

        html += `<td data-xml-tag="${tagName}">`;

        if (isEditable) {
          if (this.hasEnumeration(tagName)) {
            const enumValues = this.getEnumerationValues(tagName);
            html += `<select class="wysiwyg-enum-select" data-xml-tag="${tagName}" disabled>`;
            enumValues.forEach((value) => {
              const selected = value === text ? 'selected' : '';
              html += `<option value="${value}" ${selected}>${value}</option>`;
            });
            html += '</select>';
          } else {
            const inputType = this.getInputType(text);
            html += `<input type="${inputType}" 
                      class="wysiwyg-text-input" 
                      data-xml-tag="${tagName}" 
                      value="${text}" 
                      placeholder="${this.formatTagName(tagName)}" 
                      disabled />`;
          }
        } else {
          switch (contentType) {
            case 'email':
              html += `<a href="mailto:${text}" class="wysiwyg-link">${text}</a>`;
              break;
            case 'url':
              html += `<a href="${text}" target="_blank" class="wysiwyg-link">${text}</a>`;
              break;
            case 'date':
              html += this.formatDate(text);
              break;
            case 'currency':
              html += `<span class="wysiwyg-currency">${text}</span>`;
              break;
            default:
              html += text || 'N/A';
          }
        }

        html += '</td>';
      });

      if (isEditable) {
        html += '<td class="wysiwyg-table-actions">';
        html += `<button class="wysiwyg-edit-row-button" type="button" title="Edit">✏️</button>`;
        html += `<button class="wysiwyg-save-row-button hidden" type="button" title="Save">💾</button>`;
        html += `<button class="wysiwyg-delete-button" type="button" title="Delete">✖</button>`;
        html += '</td>';
      }

      html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';
    html += '</div>'; // Close table wrapper
    html += '</div>'; // Close table container

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

  /**
   * Build XML from document structure
   */
  private static buildXmlFromDocument(container: Element): string {
    const titleElement = container.querySelector(
      '.wysiwyg-title-input, .wysiwyg-header h1'
    );
    if (!titleElement) {
      throw new Error('No root XML element found');
    }

    const rootTag =
      titleElement.getAttribute('data-xml-tag') ||
      titleElement.textContent?.replace(/\s+/g, '') ||
      'root';

    return this.buildXmlElement(container, rootTag, 0);
  }

  /**
   * Build XML element recursively
   */
  private static buildXmlElement(
    container: Element,
    tagName: string,
    // @ts-ignore
    level: number
  ): string {
    let xml = `<${tagName}`;

    // Handle attributes
    const attributeInputs = container.querySelectorAll(`input[data-attr-name]`);
    attributeInputs.forEach((input) => {
      const inputElement = input as HTMLInputElement;
      const attrName = inputElement.getAttribute('data-attr-name');
      const attrValue = inputElement.value || '';
      if (attrName && attrValue) {
        xml += ` ${attrName}="${this.escapeXmlAttribute(attrValue)}"`;
      }
    });

    // Find content elements
    const contentSections = container.querySelectorAll('.wysiwyg-content > *');

    if (contentSections.length > 0) {
      xml += '>';

      // Process each section
      contentSections.forEach((section) => {
        // Handle tables
        if (section.classList.contains('wysiwyg-table-container')) {
          const sectionTitle = section
            .querySelector('.wysiwyg-subsection')
            ?.textContent?.trim();

          // @ts-ignore
          const sectionTag = this.tagNameFromTitle(sectionTitle || '');

          const rows = section.querySelectorAll('tbody tr');
          rows.forEach((row) => {
            const firstCell = row.querySelector('td');
            const cellTag = firstCell?.getAttribute('data-xml-tag');
            if (cellTag) {
              const itemTag = cellTag.split('.')[0]; // Get base tag name
              xml += `<${itemTag}>`;

              row.querySelectorAll('td[data-xml-tag]').forEach((cell) => {
                const fieldTag = cell.getAttribute('data-xml-tag');
                const input = cell.querySelector(
                  'input, select, textarea'
                ) as HTMLInputElement;
                const value = input?.value || cell.textContent?.trim() || '';
                if (fieldTag) {
                  xml += `<${fieldTag}>${this.escapeXmlContent(
                    value
                  )}</${fieldTag}>`;
                }
              });

              xml += `</${itemTag}>`;
            }
          });
        }
        // Handle sections with headers
        else if (
          section.querySelector('.wysiwyg-section, .wysiwyg-subsection')
        ) {
          const sectionHeader = section.querySelector(
            '.wysiwyg-section, .wysiwyg-subsection'
          );
          const sectionTag = this.tagNameFromTitle(
            sectionHeader?.textContent || ''
          );
          xml += `<${sectionTag}>`;

          // Process fields in this section
          section.querySelectorAll('.wysiwyg-field-group').forEach((field) => {
            const input = field.querySelector(
              'input, select, textarea'
            ) as HTMLInputElement;
            if (input) {
              const fieldTag = input.getAttribute('data-xml-tag');
              const value = input.value || '';
              if (fieldTag) {
                xml += `<${fieldTag}>${this.escapeXmlContent(
                  value
                )}</${fieldTag}>`;
              }
            }
          });

          xml += `</${sectionTag}>`;
        }
        // Handle standalone fields
        else if (section.classList.contains('wysiwyg-field-group')) {
          const input = section.querySelector(
            'input, select, textarea'
          ) as HTMLInputElement;
          if (input) {
            const fieldTag = input.getAttribute('data-xml-tag');
            const value = input.value || '';
            if (fieldTag) {
              xml += `<${fieldTag}>${this.escapeXmlContent(
                value
              )}</${fieldTag}>`;
            }
          }
        }
      });

      xml += `</${tagName}>`;
    } else {
      xml += '/>';
    }

    return xml;
  }

  /**
   * Convert title text to tag name
   */
  private static tagNameFromTitle(title: string): string {
    return title
      .trim()
      .replace(/\s+/g, '')
      .replace(/^(.)/, (match) => match.toLowerCase());
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
