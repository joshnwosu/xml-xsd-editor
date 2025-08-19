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

export class XmlPdfConverter {
  private static schemaInfo: SchemaInfo = {};
  private static documentMetadata = {
    title: '',
    author: '',
    date: new Date().toLocaleDateString(),
    pageNumber: 1,
  };

  /**
   * Set schema information for rendering
   */
  static setSchemaInfo(schema: SchemaInfo): void {
    this.schemaInfo = schema;
  }

  /**
   * Convert XML content to PDF-style HTML format
   */
  static xmlToPdf(xmlContent: string): string {
    try {
      const unescapedXml = this.unescapeHTML(xmlContent);
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescapedXml, 'application/xml');

      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return `<div class="pdf-error">XML Parsing Error: ${parseError.textContent}</div>`;
      }

      // Extract document metadata
      if (xmlDoc.documentElement) {
        this.documentMetadata.title = this.formatTagName(
          xmlDoc.documentElement.tagName
        );
      }

      let html = `
        <div class="pdf-document">
          <style>
            ${this.getPdfStyles()}
          </style>
          <div class="pdf-page">
            ${this.renderHeader()}
            <div class="pdf-content">
      `;

      if (xmlDoc.documentElement) {
        html += this.processNode(xmlDoc.documentElement, 0);
      }

      html += `
            </div>
            ${this.renderFooter()}
          </div>
        </div>
      `;

      return html;
    } catch (error) {
      return `<div class="pdf-error">Error converting XML: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</div>`;
    }
  }

  /**
   * Get PDF-style CSS
   */
  private static getPdfStyles(): string {
    return `
      .pdf-document {
        background: #525659;
        padding: 20px;
        min-height: 100vh;
        font-family: 'Times New Roman', Times, serif;
      }

      .pdf-page {
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        background: white;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        padding: 0;
        position: relative;
      }

      .pdf-header {
        padding: 0.5in 0.75in 0.25in 0.75in;
        border-bottom: 2px solid #333;
        margin-bottom: 0.25in;
      }

      .pdf-header h1 {
        font-size: 24pt;
        font-weight: bold;
        color: #000;
        margin: 0 0 8px 0;
        text-align: center;
      }

      .pdf-header .pdf-metadata {
        display: flex;
        justify-content: space-between;
        font-size: 10pt;
        color: #666;
        margin-top: 8px;
      }

      .pdf-content {
        padding: 0 0.75in 1in 0.75in;
        line-height: 1.6;
        color: #000;
      }

      .pdf-footer {
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

      .pdf-section {
        margin: 24pt 0 12pt 0;
        font-size: 18pt;
        font-weight: bold;
        color: #000;
        border-bottom: 1px solid #333;
        padding-bottom: 4pt;
      }

      .pdf-subsection {
        margin: 18pt 0 10pt 0;
        font-size: 14pt;
        font-weight: bold;
        color: #333;
      }

      .pdf-field-group {
        margin: 12pt 0;
        display: flex;
        align-items: baseline;
      }

      .pdf-field-label {
        font-weight: bold;
        min-width: 140pt;
        color: #000;
        font-size: 11pt;
      }

      .pdf-field-value {
        flex: 1;
        color: #000;
        font-size: 11pt;
      }

      .pdf-table {
        width: 100%;
        border-collapse: collapse;
        margin: 16pt 0;
        font-size: 10pt;
      }

      .pdf-table thead {
        background: #f0f0f0;
      }

      .pdf-table th {
        padding: 8pt;
        text-align: left;
        font-weight: bold;
        border: 1px solid #000;
        background: #e8e8e8;
        font-size: 10pt;
      }

      .pdf-table td {
        padding: 6pt 8pt;
        border: 1px solid #000;
        font-size: 10pt;
      }

      .pdf-table tr:nth-child(even) {
        background: #f9f9f9;
      }

      .pdf-list {
        margin: 12pt 0;
        padding-left: 24pt;
      }

      .pdf-list-item {
        margin: 4pt 0;
        font-size: 11pt;
      }

      .pdf-text-block {
        margin: 12pt 0;
        text-align: justify;
        font-size: 11pt;
        line-height: 1.5;
      }

      .pdf-metadata-block {
        background: #f5f5f5;
        border: 1px solid #ddd;
        padding: 8pt;
        margin: 12pt 0;
        font-size: 9pt;
      }

      .pdf-metadata-item {
        display: flex;
        margin: 4pt 0;
      }

      .pdf-metadata-label {
        font-weight: bold;
        min-width: 80pt;
      }

      .pdf-metadata-value {
        flex: 1;
      }

      .pdf-page-break {
        page-break-after: always;
      }

      @media print {
        .pdf-document {
          background: white;
          padding: 0;
        }

        .pdf-page {
          box-shadow: none;
          margin: 0;
        }
      }

      .pdf-error {
        background: #fee;
        border: 1px solid #fcc;
        padding: 20px;
        margin: 20px;
        border-radius: 4px;
        color: #c00;
      }

      .pdf-link {
        color: #0066cc;
        text-decoration: underline;
      }

      .pdf-date {
        font-style: italic;
      }

      .pdf-currency {
        font-family: 'Courier New', monospace;
        text-align: right;
      }

      .pdf-code {
        font-family: 'Courier New', monospace;
        background: #f5f5f5;
        padding: 2pt 4pt;
        border: 1px solid #ddd;
      }
    `;
  }

  /**
   * Render PDF header
   */
  private static renderHeader(): string {
    return `
      <div class="pdf-header">
        <h1>${this.documentMetadata.title}</h1>
        <div class="pdf-metadata">
          <span>Document Date: ${this.documentMetadata.date}</span>
          <span>Generated: ${new Date().toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  /**
   * Render PDF footer
   */
  private static renderFooter(): string {
    return `
      <div class="pdf-footer">
        <span>© ${new Date().getFullYear()} - Confidential Document</span>
        <span>Page ${this.documentMetadata.pageNumber}</span>
      </div>
    `;
  }

  /**
   * Process XML node and convert to PDF-style HTML
   */
  private static processNode(node: Element, level: number = 0): string {
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

      // Skip root element title as it's in the header
      if (level === 0 && hasChildElements) {
        // Process children directly for root
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1);
        });
        return result;
      }

      // Handle different node types based on structure and level
      if (isCollection && level <= 2) {
        // Render as a table
        result += this.renderTable(node, level);
      } else if (hasChildElements && !isCollection && level === 1) {
        // Section header
        result += `<h2 class="pdf-section">${this.formatTagName(
          node.tagName
        )}</h2>`;

        // Add attributes if present
        if (node.attributes.length > 0) {
          result += this.renderAttributes(node);
        }

        // Process children
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1);
        });
      } else if (hasChildElements && !isCollection && level === 2) {
        // Subsection
        result += `<h3 class="pdf-subsection">${this.formatTagName(
          node.tagName
        )}</h3>`;

        // Process children
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1);
        });
      } else if (hasTextContent) {
        // Render as field
        result += this.renderField(node);
      } else if (hasChildElements && !isCollection) {
        // Container - process children
        Array.from(node.children).forEach((child) => {
          result += this.processNode(child as Element, level + 1);
        });
      }
    }

    return result;
  }

  /**
   * Render a field with label and value
   */
  private static renderField(node: Element): string {
    const tagName = node.tagName;
    const text = node.textContent?.trim() || '';
    const formattedLabel = this.formatTagName(tagName);
    const contentType = this.getContentType(text);

    let valueHtml = '';

    // Check if it's an enum field
    if (this.hasEnumeration(tagName)) {
      valueHtml = `<span class="pdf-field-value">${
        text || 'Not specified'
      }</span>`;
    } else {
      // Format based on content type
      switch (contentType) {
        case 'email':
          valueHtml = `<a href="mailto:${text}" class="pdf-link">${text}</a>`;
          break;
        case 'url':
          valueHtml = `<a href="${text}" target="_blank" class="pdf-link">${text}</a>`;
          break;
        case 'phone':
          valueHtml = `<span class="pdf-field-value">${text}</span>`;
          break;
        case 'date':
          valueHtml = `<span class="pdf-date">${this.formatDate(text)}</span>`;
          break;
        case 'currency':
          valueHtml = `<span class="pdf-currency">${text}</span>`;
          break;
        case 'paragraph':
          return `
            <div class="pdf-field-group">
              <div class="pdf-field-label">${formattedLabel}:</div>
            </div>
            <div class="pdf-text-block">${text}</div>
          `;
        default:
          valueHtml = `<span class="pdf-field-value">${text || 'N/A'}</span>`;
      }
    }

    return `
      <div class="pdf-field-group">
        <span class="pdf-field-label">${formattedLabel}:</span>
        ${valueHtml}
      </div>
    `;
  }

  /**
   * Render attributes as metadata
   */
  private static renderAttributes(node: Element): string {
    if (node.attributes.length === 0) return '';

    let html = '<div class="pdf-metadata-block">';
    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      html += `
        <div class="pdf-metadata-item">
          <span class="pdf-metadata-label">${this.formatTagName(
            attr.name
          )}:</span>
          <span class="pdf-metadata-value">${attr.value}</span>
        </div>
      `;
    }
    html += '</div>';
    return html;
  }

  /**
   * Render a collection as a table
   */
  private static renderTable(node: Element, level: number): string {
    const childTagName = node.children[0]?.tagName;
    if (!childTagName) return '';

    // Get headers from first child
    const headers = Array.from(node.children[0].children).map(
      (child) => child.tagName
    );

    let html = `<h3 class="pdf-subsection">${this.formatTagName(
      node.tagName
    )}</h3>`;
    html += '<table class="pdf-table">';

    // Table header
    html += '<thead><tr>';
    headers.forEach((header) => {
      html += `<th>${this.formatTagName(header)}</th>`;
    });
    html += '</tr></thead>';

    // Table body
    html += '<tbody>';
    Array.from(node.children).forEach((child, rowIndex) => {
      html += '<tr>';
      Array.from(child.children).forEach((grandchild) => {
        const text = grandchild.textContent?.trim() || '';
        const tagName = grandchild.tagName;
        const contentType = this.getContentType(text);

        html += '<td>';

        if (this.hasEnumeration(tagName)) {
          html += text || 'N/A';
        } else {
          switch (contentType) {
            case 'email':
              html += `<a href="mailto:${text}" class="pdf-link">${text}</a>`;
              break;
            case 'url':
              html += `<a href="${text}" target="_blank" class="pdf-link">${text}</a>`;
              break;
            case 'date':
              html += this.formatDate(text);
              break;
            case 'currency':
              html += `<span class="pdf-currency">${text}</span>`;
              break;
            default:
              html += text || 'N/A';
          }
        }

        html += '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody>';
    html += '</table>';

    return html;
  }

  // Utility methods (same as in XmlWysiwygConverter)
  private static hasEnumeration(tagName: string): boolean {
    const schemaInfo = this.schemaInfo[tagName];
    return (
      schemaInfo?.type === 'enum' &&
      Array.isArray(schemaInfo.enumValues) &&
      schemaInfo.enumValues.length > 0
    );
  }

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
    return phoneRegex.test(text);
  }

  private static isDate(text: string): boolean {
    const dateFormats = [
      /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/,
      /^\d{4}[-\/]\d{1,2}[-\/]\d{1,2}$/,
    ];
    return dateFormats.some((regex) => regex.test(text));
  }

  private static isNumber(text: string): boolean {
    return !isNaN(Number(text)) && text.trim() !== '';
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
}
