// utils/xml-wysiwyg-converter.ts
export interface XmlElement {
  tagName: string;
  attributes: Record<string, string>;
  children: (XmlElement | string)[];
  isTextNode?: boolean;
}

export class XmlWysiwygConverter {
  /**
   * Convert XML content to WYSIWYG HTML format
   */
  static xmlToWysiwyg(xmlContent: string): string {
    try {
      // Unescape HTML entities first
      const unescapedXml = this.unescapeHTML(xmlContent);

      // Parse XML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(unescapedXml, 'text/xml');

      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        return `<div class="xml-error">XML Parsing Error: ${parseError.textContent}</div>`;
      }

      // Convert XML structure to WYSIWYG HTML
      const htmlContent = this.convertXmlNodeToHtml(xmlDoc.documentElement);

      return `
        <div class="xml-document">
          <div class="xml-header">
            <h2 class="document-title">XML Document</h2>
            <div class="document-info">
              <span class="root-element">Root: &lt;${xmlDoc.documentElement.tagName}&gt;</span>
            </div>
          </div>
          <div class="xml-content">
            ${htmlContent}
          </div>
        </div>
      `;
    } catch (error) {
      return `<div class="xml-error">Error converting XML: ${
        error instanceof Error ? error.message : 'Unknown error'
      }</div>`;
    }
  }

  /**
   * Convert WYSIWYG HTML back to XML
   */
  static wysiwygToXml(htmlContent: string): string {
    try {
      // Create a temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;

      // Find the XML content area
      const xmlContent = container.querySelector('.xml-content');
      if (!xmlContent) {
        throw new Error('No XML content found in WYSIWYG editor');
      }

      // Convert HTML back to XML
      const xmlString = this.convertHtmlToXml(xmlContent);

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
   * Convert XML node to HTML representation
   */
  private static convertXmlNodeToHtml(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent?.trim();
      if (!textContent) return '';

      return `<span class="xml-text-content" contenteditable="true">${this.escapeHtml(
        textContent
      )}</span>`;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();

      // Create element representation
      let html = `<div class="xml-element" data-xml-tag="${tagName}">`;

      // Add element header with tag name and attributes
      html += `<div class="xml-element-header">`;
      html += `<span class="xml-tag-name">${tagName}</span>`;

      // Add attributes
      if (element.attributes.length > 0) {
        html += `<div class="xml-attributes">`;
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          html += `
            <div class="xml-attribute" data-attr-name="${attr.name}">
              <span class="attr-name">${attr.name}</span>=
              <span class="attr-value" contenteditable="true">"${this.escapeHtml(
                attr.value
              )}"</span>
            </div>
          `;
        }
        html += `</div>`;
      }

      html += `</div>`;

      // Add element content
      html += `<div class="xml-element-content">`;

      // Process child nodes
      const children = Array.from(node.childNodes);
      if (children.length === 0) {
        html += `<span class="xml-empty-element">Empty element</span>`;
      } else {
        // Check if element contains only text
        const hasOnlyText = children.every(
          (child) => child.nodeType === Node.TEXT_NODE
        );

        if (hasOnlyText) {
          const textContent = node.textContent?.trim();
          if (textContent) {
            html += `<div class="xml-text-only" contenteditable="true">${this.escapeHtml(
              textContent
            )}</div>`;
          }
        } else {
          children.forEach((child) => {
            html += this.convertXmlNodeToHtml(child);
          });
        }
      }

      html += `</div></div>`;

      return html;
    }

    return '';
  }

  /**
   * Convert HTML back to XML
   */
  private static convertHtmlToXml(htmlElement: Element): string {
    const xmlElements = htmlElement.querySelectorAll('.xml-element');
    if (xmlElements.length === 0) {
      throw new Error('No XML elements found');
    }

    // Find root element
    const rootElement = xmlElements[0];
    return this.convertHtmlElementToXml(rootElement);
  }

  /**
   * Convert individual HTML element back to XML
   */
  private static convertHtmlElementToXml(htmlElement: Element): string {
    const tagName = htmlElement.getAttribute('data-xml-tag');
    if (!tagName) {
      throw new Error('Missing XML tag name');
    }

    let xml = `<${tagName}`;

    // Add attributes
    const attributes = htmlElement.querySelectorAll('.xml-attribute');
    attributes.forEach((attr) => {
      const attrName = attr.getAttribute('data-attr-name');
      const attrValueElement = attr.querySelector('.attr-value');
      const attrValue = attrValueElement?.textContent?.replace(/"/g, '') || '';

      if (attrName) {
        xml += ` ${attrName}="${this.escapeXmlAttribute(attrValue)}"`;
      }
    });

    // Check for content
    const contentDiv = htmlElement.querySelector('.xml-element-content');
    if (!contentDiv) {
      xml += '/>';
      return xml;
    }

    // Check if it's a text-only element
    const textOnlyDiv = contentDiv.querySelector('.xml-text-only');
    if (textOnlyDiv) {
      const textContent = textOnlyDiv.textContent || '';
      xml += `>${this.escapeXmlContent(textContent)}</${tagName}>`;
      return xml;
    }

    // Check for nested elements
    const nestedElements = contentDiv.querySelectorAll(':scope > .xml-element');
    if (nestedElements.length > 0) {
      xml += '>';
      nestedElements.forEach((nestedElement) => {
        xml += this.convertHtmlElementToXml(nestedElement);
      });
      xml += `</${tagName}>`;
    } else {
      // Empty element
      xml += '/>';
    }

    return xml;
  }

  /**
   * Utility functions
   */
  private static unescapeHTML(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'");
  }

  private static escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
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
