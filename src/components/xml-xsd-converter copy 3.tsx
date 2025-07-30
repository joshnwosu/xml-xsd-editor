import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Download,
  FileText,
  Code,
  Eye,
  Settings,
  Check,
  X,
  AlertCircle,
  Edit3,
  Save,
  RotateCcw,
} from 'lucide-react';
import WYSIWYGEditor from './WYSIWYG/custom-editor';

interface FileData {
  name: string;
  content: string;
  type: 'xml' | 'xsd';
}

const XMLXSDConverter: React.FC = () => {
  const [xmlFile, setXmlFile] = useState<FileData | null>(null);
  const [xsdFile, setXsdFile] = useState<FileData | null>(null);
  const [outputFormat, setOutputFormat] = useState<'word' | 'html' | 'pdf'>(
    'word'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
  } | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [activeTab, setActiveTab] = useState<
    'upload' | 'preview' | 'raw' | 'convert'
  >('upload');
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<string>('');
  const [rawXmlContent, setRawXmlContent] = useState<string>('');
  const [rawXsdContent, setRawXsdContent] = useState<string>('');
  const [rawViewMode, setRawViewMode] = useState<'xml' | 'xsd'>('xml');

  const [styleType, setStyleType] = useState<
    'document' | 'table' | 'list' | 'card'
  >('document');

  // Add a new state for storing the original XML content
  const [originalXmlContent, setOriginalXmlContent] = useState<string>('');

  const xmlInputRef = useRef<HTMLInputElement>(null);
  const xsdInputRef = useRef<HTMLInputElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);

  // Add new state for the WYSIWYG editor
  const [editorContent, setEditorContent] = useState<string>('');
  const [showWysiwygEditor, setShowWysiwygEditor] = useState(false);

  // Update the handleFileUpload function to store the original content:
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'xml' | 'xsd'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileData: FileData = {
        name: file.name,
        content: content,
        type: type,
      };

      if (type === 'xml') {
        setXmlFile(fileData);
        setRawXmlContent(content);
        setOriginalXmlContent(content); // Store the original content
        generatePreview(content);
      } else {
        setXsdFile(fileData);
        setRawXsdContent(content);
      }

      // Basic validation
      validateXML(content, type);
    };
    reader.readAsText(file);
  };

  const validateXML = (content: string, type: 'xml' | 'xsd') => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      const parserError = doc.querySelector('parsererror');

      if (parserError) {
        setValidationResult({
          valid: false,
          message: `Invalid ${type.toUpperCase()}: ${parserError.textContent}`,
        });
      } else {
        setValidationResult({
          valid: true,
          message: `Valid ${type.toUpperCase()} file loaded successfully`,
        });
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: `Error parsing ${type.toUpperCase()}: ${error}`,
      });
    }
  };

  const generateDocumentPreview = useCallback((xmlContent: string) => {
    // try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    // Transform XML to Word document-style HTML
    let html = '<div class="document-preview">';

    const processNode = (node: Element, level: number = 0): string => {
      let result = '';

      if (node.nodeType === Node.ELEMENT_NODE) {
        // Handle different XML elements as document components
        if (level === 0) {
          // Root element as document title
          result += `<h1 class="doc-title" data-xml-tag="${
            node.tagName
          }">${formatTagName(node.tagName)}</h1>`;
        } else if (level === 1) {
          // First level as section headers
          result += `<h2 class="doc-section" data-xml-tag="${
            node.tagName
          }">${formatTagName(node.tagName)}</h2>`;
        } else if (level === 2) {
          // Second level as subsection headers
          result += `<h3 class="doc-subsection" data-xml-tag="${
            node.tagName
          }">${formatTagName(node.tagName)}</h3>`;
        }

        // Add attributes as metadata
        if (node.attributes.length > 0) {
          result += '<div class="doc-metadata">';
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            result += `<span class="doc-attr" data-attr-name="${
              attr.name
            }" data-attr-value="${attr.value}"><strong>${formatTagName(
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

          // Format different types of content with data attributes for reverse mapping
          if (isEmail(text)) {
            result += `<p class="doc-email" data-xml-tag="${node.tagName}" data-content="${text}"><strong>Email:</strong> <a href="mailto:${text}">${text}</a></p>`;
          } else if (isPhone(text)) {
            result += `<p class="doc-phone" data-xml-tag="${node.tagName}" data-content="${text}"><strong>Phone:</strong> ${text}</p>`;
          } else if (isDate(text)) {
            result += `<p class="doc-date" data-xml-tag="${
              node.tagName
            }" data-content="${text}"><strong>Date:</strong> ${formatDate(
              text
            )}</p>`;
          } else if (isNumber(text)) {
            result += `<p class="doc-number" data-xml-tag="${node.tagName}" data-content="${text}"><strong>Value:</strong> ${text}</p>`;
          } else if (text.length > 100) {
            result += `<div class="doc-paragraph" data-xml-tag="${node.tagName}" data-content="${text}">${text}</div>`;
          } else {
            result += `<p class="doc-field" data-xml-tag="${node.tagName}" data-content="${text}">${text}</p>`;
          }
        } else if (node.children.length > 0) {
          // Process child elements
          result += `<div class="doc-content" data-xml-tag="${node.tagName}">`;
          Array.from(node.children).forEach((child) => {
            result += processNode(child as Element, level + 1);
          });
          result += '</div>';
        }
      }

      return result;
    };

    if (doc.documentElement) {
      html += processNode(doc.documentElement);
    }
    html += '</div>';

    return html;

    //   setPreviewContent(html);
    //   setEditableContent(html);
    // } catch (error) {
    //   const errorContent =
    //     '<div class="error">Error generating document preview</div>';
    //   setPreviewContent(errorContent);
    //   setEditableContent(errorContent);
    // }
  }, []);

  const generateTablePreview = (xmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    let html = '<div class="table-preview">';

    const processNodeToTable = (node: Element, level: number = 0): string => {
      let result = '';

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (level === 0) {
          // Root element as main table title
          result += `<h2 class="table-title">${formatTagName(
            node.tagName
          )}</h2>`;

          // Create main data table
          result += '<table class="data-table">';
          result += '<thead><tr><th>Field</th><th>Value</th></tr></thead>';
          result += '<tbody>';

          // Process children
          Array.from(node.children).forEach((child) => {
            result += processChildToTableRow(child as Element, 1);
          });

          result += '</tbody></table>';
        } else if (level === 1) {
          // First level children create section tables
          result += `<h3 class="section-title">${formatTagName(
            node.tagName
          )}</h3>`;
          result += '<table class="section-table">';
          result += '<thead><tr><th>Property</th><th>Value</th></tr></thead>';
          result += '<tbody>';

          // Add attributes as rows
          if (node.attributes.length > 0) {
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              result += `<tr class="attr-row">
              <td class="attr-name">${formatTagName(attr.name)}</td>
              <td class="attr-value">${attr.value}</td>
            </tr>`;
            }
          }

          // Process child elements
          Array.from(node.children).forEach((child) => {
            result += processChildToTableRow(child as Element, 2);
          });

          // If no children but has text content
          if (
            node.children.length === 0 &&
            node.textContent &&
            node.textContent.trim()
          ) {
            result += `<tr class="content-row">
            <td class="field-name">Content</td>
            <td class="field-value">${formatFieldValue(
              node.textContent.trim()
            )}</td>
          </tr>`;
          }

          result += '</tbody></table><br>';
        }
      }

      return result;
    };

    const processChildToTableRow = (node: Element, level: number): string => {
      let result = '';

      if (node.children.length === 0) {
        // Leaf node - create table row
        const text = node.textContent?.trim() || '';
        result += `<tr class="data-row">
        <td class="field-name">${formatTagName(node.tagName)}</td>
        <td class="field-value">${formatFieldValue(text)}</td>
      </tr>`;

        // Add attributes as separate rows if they exist
        if (node.attributes.length > 0) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            result += `<tr class="attr-row">
            <td class="field-name">${formatTagName(
              node.tagName
            )} - ${formatTagName(attr.name)}</td>
            <td class="field-value">${attr.value}</td>
          </tr>`;
          }
        }
      } else {
        // Node with children - create nested structure
        result += `<tr class="nested-row">
        <td class="field-name" colspan="2"><strong>${formatTagName(
          node.tagName
        )}</strong></td>
      </tr>`;

        // Add attributes
        if (node.attributes.length > 0) {
          for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes[i];
            result += `<tr class="attr-row">
            <td class="field-name indent">${formatTagName(attr.name)}</td>
            <td class="field-value">${attr.value}</td>
          </tr>`;
          }
        }

        // Process children
        Array.from(node.children).forEach((child) => {
          result += processChildToTableRow(child as Element, level + 1);
        });
      }

      return result;
    };

    const formatFieldValue = (text: string): string => {
      if (isEmail(text)) {
        return `<a href="mailto:${text}" class="email-link">${text}</a>`;
      } else if (isPhone(text)) {
        return `<span class="phone-number">${text}</span>`;
      } else if (isDate(text)) {
        return `<span class="date-value">${formatDate(text)}</span>`;
      } else if (isNumber(text)) {
        return `<span class="number-value">${text}</span>`;
      } else if (text.length > 50) {
        return `<div class="long-text">${text}</div>`;
      }
      return text;
    };

    if (doc.documentElement) {
      html += processNodeToTable(doc.documentElement);
    }
    html += '</div>';

    return html;
  };

  const generateListPreview = (xmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    let html = '<div class="list-preview">';

    const processNodeToList = (node: Element, level: number = 0): string => {
      let result = '';

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (level === 0) {
          // Root element as main title
          result += `<h2 class="list-title">${formatTagName(
            node.tagName
          )}</h2>`;
          result += '<ul class="root-list">';

          // Process children
          Array.from(node.children).forEach((child) => {
            result += processChildToListItem(child as Element, 1);
          });

          result += '</ul>';
        }
      }

      return result;
    };

    const processChildToListItem = (node: Element, level: number): string => {
      let result = '';
      const indent = level > 3 ? 'deep-indent' : `level-${level}`;

      result += `<li class="list-item ${indent}">`;

      // Add the element name as a label
      result += `<span class="element-label">${formatTagName(
        node.tagName
      )}</span>`;

      // Add attributes if they exist
      if (node.attributes.length > 0) {
        result += '<ul class="attribute-list">';
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          result += `<li class="attribute-item">
          <span class="attr-name">${formatTagName(attr.name)}:</span>
          <span class="attr-value">${attr.value}</span>
        </li>`;
        }
        result += '</ul>';
      }

      // Handle content
      if (node.children.length === 0) {
        // Leaf node with text content
        const text = node.textContent?.trim() || '';
        if (text) {
          result += `<div class="content-value">${formatListValue(text)}</div>`;
        }
      } else {
        // Node with children
        const hasDirectText =
          node.childNodes &&
          Array.from(node.childNodes).some(
            (child) =>
              child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
          );

        if (hasDirectText) {
          const directText = Array.from(node.childNodes)
            .filter((child) => child.nodeType === Node.TEXT_NODE)
            .map((child) => child.textContent?.trim())
            .filter((text) => text)
            .join(' ');

          if (directText) {
            result += `<div class="content-value">${formatListValue(
              directText
            )}</div>`;
          }
        }

        // Add children as nested list
        if (node.children.length > 0) {
          result += `<ul class="nested-list level-${level + 1}">`;
          Array.from(node.children).forEach((child) => {
            result += processChildToListItem(child as Element, level + 1);
          });
          result += '</ul>';
        }
      }

      result += '</li>';
      return result;
    };

    const formatListValue = (text: string): string => {
      if (isEmail(text)) {
        return `<a href="mailto:${text}" class="email-link">
        <span class="value-type">📧</span> ${text}
      </a>`;
      } else if (isPhone(text)) {
        return `<span class="phone-number">
        <span class="value-type">📞</span> ${text}
      </span>`;
      } else if (isDate(text)) {
        return `<span class="date-value">
        <span class="value-type">📅</span> ${formatDate(text)}
      </span>`;
      } else if (isNumber(text)) {
        return `<span class="number-value">
        <span class="value-type">🔢</span> ${text}
      </span>`;
      } else if (text.length > 100) {
        return `<div class="long-text">
        <span class="value-type">📄</span> 
        <div class="text-content">${text}</div>
      </div>`;
      } else if (text.toLowerCase().includes('http')) {
        return `<a href="${text}" target="_blank" class="url-link">
        <span class="value-type">🔗</span> ${text}
      </a>`;
      }
      return `<span class="text-value">${text}</span>`;
    };

    if (doc.documentElement) {
      html += processNodeToList(doc.documentElement);
    }
    html += '</div>';

    return html;
  };

  const generateCardPreview = (xmlContent: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    let html = '<div class="card-preview">';

    const processNodeToCards = (node: Element, level: number = 0): string => {
      let result = '';

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (level === 0) {
          // Root element as main header
          result += `<div class="main-header-card">
          <h2 class="card-main-title">${formatTagName(node.tagName)}</h2>
          <div class="card-subtitle">XML Document Overview</div>
        </div>`;

          result += '<div class="cards-container">';

          // Process children as individual cards
          Array.from(node.children).forEach((child, index) => {
            result += processChildToCard(child as Element, 1, index);
          });

          result += '</div>';
        }
      }

      return result;
    };

    const processChildToCard = (
      node: Element,
      level: number,
      index: number
    ): string => {
      let result = '';
      const cardClass = getCardClass(level, index);

      result += `<div class="data-card ${cardClass}">`;

      // Card header
      result += `<div class="card-header">
      <div class="card-title">
        <span class="card-icon">${getCardIcon(node.tagName, level)}</span>
        ${formatTagName(node.tagName)}
      </div>
      ${level <= 2 ? `<div class="card-level">Level ${level}</div>` : ''}
    </div>`;

      // Card body
      result += '<div class="card-body">';

      // Add attributes if they exist
      if (node.attributes.length > 0) {
        result += '<div class="card-attributes">';
        result += '<div class="attributes-header">Attributes</div>';
        result += '<div class="attributes-grid">';

        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          result += `<div class="attribute-chip">
          <span class="attr-key">${formatTagName(attr.name)}</span>
          <span class="attr-val">${attr.value}</span>
        </div>`;
        }
        result += '</div></div>';
      }

      // Handle content
      if (node.children.length === 0) {
        // Leaf node with text content
        const text = node.textContent?.trim() || '';
        if (text) {
          result += `<div class="card-content">
          <div class="content-header">Content</div>
          <div class="content-value">${formatCardValue(text)}</div>
        </div>`;
        }
      } else {
        // Node with children
        const hasDirectText =
          node.childNodes &&
          Array.from(node.childNodes).some(
            (child) =>
              child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
          );

        if (hasDirectText) {
          const directText = Array.from(node.childNodes)
            .filter((child) => child.nodeType === Node.TEXT_NODE)
            .map((child) => child.textContent?.trim())
            .filter((text) => text)
            .join(' ');

          if (directText) {
            result += `<div class="card-content">
            <div class="content-header">Direct Content</div>
            <div class="content-value">${formatCardValue(directText)}</div>
          </div>`;
          }
        }

        // Add children as nested cards or compact items
        if (node.children.length > 0) {
          if (level < 3) {
            // Create nested cards for shallow levels
            result += '<div class="nested-cards">';
            result += '<div class="nested-header">Child Elements</div>';
            result += '<div class="nested-cards-grid">';

            Array.from(node.children).forEach((child, childIndex) => {
              result += processChildToCard(
                child as Element,
                level + 1,
                childIndex
              );
            });

            result += '</div></div>';
          } else {
            // Create compact list for deeper levels
            result += '<div class="compact-children">';
            result += '<div class="compact-header">Child Elements</div>';
            result += '<div class="compact-list">';

            Array.from(node.children).forEach((child) => {
              const childText = child.textContent?.trim() || '';
              result += `<div class="compact-item">
              <span class="compact-label">${formatTagName(child.tagName)}</span>
              ${
                childText
                  ? `<span class="compact-value">${formatCardValue(
                      childText,
                      true
                    )}</span>`
                  : ''
              }
            </div>`;
            });

            result += '</div></div>';
          }
        }
      }

      result += '</div>'; // Close card-body
      result += '</div>'; // Close data-card

      return result;
    };

    const getCardClass = (level: number, index: number): string => {
      const levelClasses = ['primary-card', 'secondary-card', 'tertiary-card'];
      const baseClass = levelClasses[level - 1] || 'default-card';
      const colorVariant = [
        'blue',
        'purple',
        'green',
        'orange',
        'pink',
        'teal',
      ][index % 6];
      return `${baseClass} ${colorVariant}-variant`;
    };

    const getCardIcon = (tagName: string, level: number): string => {
      const icons = {
        1: ['🏠', '📋', '📊', '📁', '🔖', '📌'],
        2: ['📄', '📝', '🔧', '⚙️', '📈', '🎯'],
        3: ['🔸', '🔹', '📎', '🏷️', '💠', '🔺'],
      };

      const levelIcons = icons[level as keyof typeof icons] || icons[3];
      const hash = tagName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      return levelIcons[hash % levelIcons.length];
    };

    const formatCardValue = (
      text: string,
      compact: boolean = false
    ): string => {
      if (isEmail(text)) {
        return `<div class="value-email ${compact ? 'compact' : ''}">
        <span class="value-icon">📧</span>
        <a href="mailto:${text}" class="email-link">${text}</a>
      </div>`;
      } else if (isPhone(text)) {
        return `<div class="value-phone ${compact ? 'compact' : ''}">
        <span class="value-icon">📞</span>
        <span class="phone-number">${text}</span>
      </div>`;
      } else if (isDate(text)) {
        return `<div class="value-date ${compact ? 'compact' : ''}">
        <span class="value-icon">📅</span>
        <span class="date-value">${formatDate(text)}</span>
      </div>`;
      } else if (isNumber(text)) {
        return `<div class="value-number ${compact ? 'compact' : ''}">
        <span class="value-icon">🔢</span>
        <span class="number-value">${text}</span>
      </div>`;
      } else if (text.toLowerCase().includes('http')) {
        return `<div class="value-url ${compact ? 'compact' : ''}">
        <span class="value-icon">🔗</span>
        <a href="${text}" target="_blank" class="url-link">${
          compact ? 'Link' : text
        }</a>
      </div>`;
      } else if (text.length > 100 && !compact) {
        return `<div class="value-text-long">
        <span class="value-icon">📄</span>
        <div class="long-text-content">${text}</div>
      </div>`;
      }

      return `<div class="value-text ${compact ? 'compact' : ''}">
      <span class="text-content">${
        compact && text.length > 30 ? text.substring(0, 30) + '...' : text
      }</span>
    </div>`;
    };

    if (doc.documentElement) {
      html += processNodeToCards(doc.documentElement);
    }
    html += '</div>';

    return html;
  };

  const generatePreview = useCallback(
    (xmlContent: string) => {
      try {
        let html = '';

        switch (styleType) {
          case 'table':
            html = generateTablePreview(xmlContent);
            break;
          case 'list':
            html = generateListPreview(xmlContent);
            break;
          case 'card':
            html = generateCardPreview(xmlContent);
            break;
          default:
            html = generateDocumentPreview(xmlContent);
            break;
        }

        setPreviewContent(html);
        setEditableContent(html);
      } catch (error) {
        const errorContent =
          '<div class="error">Error generating document preview</div>';
        setPreviewContent(errorContent);
        setEditableContent(errorContent);
      }
    },
    [styleType]
  );

  useEffect(() => {
    if (xmlFile && originalXmlContent) {
      generatePreview(originalXmlContent);
    }
  }, [styleType, generatePreview]);

  // Helper functions for content formatting
  const formatTagName = (tagName: string): string => {
    return tagName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const isEmail = (text: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
  };

  const isPhone = (text: string): boolean => {
    return /^[\+]?[1-9][\d]{0,15}$/.test(text.replace(/[-\s\(\)]/g, ''));
  };

  const isDate = (text: string): boolean => {
    const dateRegex = /\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/;
    return !isNaN(Date.parse(text)) && dateRegex.test(text);
  };

  const isNumber = (text: string): boolean => {
    return !isNaN(Number(text)) && text.trim() !== '';
  };

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const handleEditSave = () => {
    try {
      // Use the current editor content
      const newContent = showWysiwygEditor ? editorContent : editableContent;
      setPreviewContent(newContent);
      setEditableContent(newContent);

      setIsEditing(false);
      setShowWysiwygEditor(false);

      // Show success message
      setValidationResult({
        valid: true,
        message: 'Preview updated successfully. Original XML unchanged.',
      });
    } catch (error) {
      setValidationResult({
        valid: false,
        message: `Error updating preview: ${error}`,
      });
      setIsEditing(false);
      setShowWysiwygEditor(false);
    }
  };

  // Add a function to reset the preview to original:
  const resetToOriginal = () => {
    if (originalXmlContent) {
      generatePreview(originalXmlContent);
      setValidationResult({
        valid: true,
        message: 'Preview reset to original XML content',
      });
    }
  };

  const handleRawContentSave = () => {
    if (rawViewMode === 'xml' && rawXmlContent) {
      if (xmlFile) {
        const updatedXmlFile = {
          ...xmlFile,
          content: rawXmlContent,
        };
        setXmlFile(updatedXmlFile);
        generatePreview(rawXmlContent);
        validateXML(rawXmlContent, 'xml');
      }
    } else if (rawViewMode === 'xsd' && rawXsdContent) {
      if (xsdFile) {
        const updatedXsdFile = {
          ...xsdFile,
          content: rawXsdContent,
        };
        setXsdFile(updatedXsdFile);
        validateXML(rawXsdContent, 'xsd');
      }
    }
  };

  const handleConvert = async () => {
    if (!xmlFile) {
      alert('Please upload an XML file first');
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate conversion process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (outputFormat === 'word') {
        // Generate Word-compatible HTML
        const wordHTML = generateWordCompatibleHTML(xmlFile.content);
        downloadWordDocument(wordHTML, xmlFile.name);
      } else if (outputFormat === 'html') {
        downloadHTMLDocument(previewContent, xmlFile.name);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      alert('Error during conversion. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateWordCompatibleHTML = (xmlContent: string): string => {
    return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="Microsoft Word">
    <meta name="Originator" content="Microsoft Word">
    <title>XML Document</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowRevisions/>
            <w:DoNotPrintRevisions/>
            <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
            <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
            <w:UseMarginsForDrawingGridOrigin/>
            <w:ValidateAgainstSchemas/>
            <w:SaveIfXMLInvalid>false</w:SaveIfXMLInvalid>
            <w:IgnoreMixedContent>false</w:IgnoreMixedContent>
            <w:AlwaysShowPlaceholderText>false</w:AlwaysShowPlaceholderText>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page { margin: 1in; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.6; 
            margin: 0; 
            color: #000;
        }
        .document-preview { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #333;
        }
        .doc-title { 
            font-size: 18pt; 
            font-weight: bold; 
            color: #000; 
            margin-bottom: 20px; 
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
        }
        .doc-section { 
            font-size: 14pt; 
            font-weight: bold; 
            color: #000; 
            margin: 20px 0 10px 0; 
            border-left: 4px solid #000;
            padding-left: 10px;
        }
        .doc-subsection { 
            font-size: 12pt; 
            font-weight: bold; 
            color: #000; 
            margin: 15px 0 8px 0; 
        }
        .doc-metadata { 
            background: #f5f5f5; 
            padding: 8px 12px; 
            border: 1px solid #ccc; 
            margin: 8px 0;
            font-size: 10pt;
        }
        .doc-field, .doc-paragraph, .doc-email, .doc-phone, .doc-date, .doc-number { 
            margin: 8px 0; 
            font-size: 12pt;
        }
        .doc-content { 
            margin-left: 0px; 
            margin-top: 10px;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 10px 0; 
        }
        th, td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: left; 
            font-size: 10pt;
        }
        th { 
            background-color: #f0f0f0; 
            font-weight: bold;
        }
    </style>
</head>
<body>
    ${previewContent}
</body>
</html>`;
  };

  const downloadWordDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.xml', '')}_converted.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadHTMLDocument = (content: string, filename: string) => {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>XML Preview</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .xml-element { margin: 4px 0; }
        .xml-tag { color: #0066cc; font-weight: bold; }
        .xml-attr { color: #cc6600; }
        .xml-text { color: #000; margin-left: 20px; }
        .xml-children { margin-left: 20px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('.xml', '')}_preview.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-800 mb-2'>
            XML/XSD Document Converter
          </h1>
          <p className='text-gray-600'>
            Convert XML documents to Word, HTML, and other formats
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className='flex justify-center mb-6'>
          <div className='bg-white rounded-lg p-1 shadow-lg'>
            {(['upload', 'preview', 'raw', 'convert'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-blue-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              validationResult.valid
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <div className='flex items-center'>
              {validationResult.valid ? (
                <Check className='w-5 h-5 mr-2' />
              ) : (
                <X className='w-5 h-5 mr-2' />
              )}
              <span>{validationResult.message}</span>
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className='grid md:grid-cols-2 gap-6 mb-6'>
            {/* XML Upload */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <div className='flex items-center mb-4'>
                <FileText className='w-6 h-6 text-blue-500 mr-2' />
                <h3 className='text-xl font-semibold'>Upload XML File</h3>
              </div>

              <div
                onClick={() => xmlInputRef.current?.click()}
                className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors'
              >
                <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 mb-2'>
                  {xmlFile ? xmlFile.name : 'Click to upload XML file'}
                </p>
                <p className='text-sm text-gray-400'>Supports .xml files</p>
              </div>

              <input
                ref={xmlInputRef}
                type='file'
                accept='.xml'
                onChange={(e) => handleFileUpload(e, 'xml')}
                className='hidden'
              />

              {xmlFile && (
                <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center'>
                    <Check className='w-5 h-5 text-green-500 mr-2' />
                    <span className='text-green-700'>
                      XML file loaded successfully
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* XSD Upload */}
            <div className='bg-white rounded-xl shadow-lg p-6'>
              <div className='flex items-center mb-4'>
                <Code className='w-6 h-6 text-purple-500 mr-2' />
                <h3 className='text-xl font-semibold'>
                  Upload XSD Schema (Optional)
                </h3>
              </div>

              <div
                onClick={() => xsdInputRef.current?.click()}
                className='border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors'
              >
                <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-600 mb-2'>
                  {xsdFile ? xsdFile.name : 'Click to upload XSD schema'}
                </p>
                <p className='text-sm text-gray-400'>Supports .xsd files</p>
              </div>

              <input
                ref={xsdInputRef}
                type='file'
                accept='.xsd'
                onChange={(e) => handleFileUpload(e, 'xsd')}
                className='hidden'
              />

              {xsdFile && (
                <div className='mt-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
                  <div className='flex items-center'>
                    <Check className='w-5 h-5 text-green-500 mr-2' />
                    <span className='text-green-700'>
                      XSD schema loaded successfully
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Eye className='w-6 h-6 text-green-500 mr-2' />
                <h3 className='text-xl font-semibold'>XML Preview</h3>
              </div>

              {xmlFile && (
                <div className='flex space-x-2'>
                  <select
                    value={styleType}
                    onChange={(e) =>
                      setStyleType(
                        e.target.value as 'document' | 'table' | 'list' | 'card'
                      )
                    }
                    className='px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='document'>Document Style</option>
                    <option value='table'>Table Style</option>
                    <option value='list'>List Style</option>
                    <option value='card'>Card Style</option>
                  </select>

                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setShowWysiwygEditor(true);
                          setEditorContent(editableContent);
                        }}
                        className='flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
                      >
                        <Edit3 className='w-4 h-4 mr-2' />
                        Edit with WYSIWYG
                      </button>
                      <button
                        onClick={resetToOriginal}
                        className='flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                      >
                        <RotateCcw className='w-4 h-4 mr-2' />
                        Reset to Original
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEditSave}
                        className='flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
                      >
                        <Save className='w-4 h-4 mr-2' />
                        Save Changes
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setShowWysiwygEditor(false);
                          setEditorContent('');
                        }}
                        className='flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors'
                      >
                        <RotateCcw className='w-4 h-4 mr-2' />
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {xmlFile ? (
              <div className='border rounded-lg p-6 max-h-96 overflow-auto bg-white shadow-inner'>
                <style>{`
      .document-preview { 
        font-family: Arial, sans-serif;
        line-height: 1.6; 
        color: #333;
      }
      .doc-title { 
        font-size: 24px; 
        font-weight: bold; 
        color: #2c3e50; 
        margin-bottom: 20px; 
        text-align: center;
        border-bottom: 2px solid #3498db;
        padding-bottom: 10px;
      }
      .doc-section { 
        font-size: 18px; 
        font-weight: bold; 
        color: #34495e; 
        margin: 20px 0 10px 0; 
        border-left: 4px solid #3498db;
        padding-left: 10px;
      }
      .doc-subsection { 
        font-size: 16px; 
        font-weight: bold; 
        color: #5d6d7e; 
        margin: 15px 0 8px 0; 
      }
      .doc-metadata { 
        background: #f8f9fa; 
        padding: 8px 12px; 
        border-radius: 4px; 
        margin: 8px 0;
        border-left: 3px solid #6c757d;
        font-size: 14px;
      }
      .doc-attr { 
        color: #495057; 
        margin-right: 15px; 
      }
      .doc-field { 
        margin: 8px 0; 
        padding: 4px 0;
      }
      .doc-paragraph { 
        margin: 12px 0; 
        padding: 10px 0;
        text-align: justify;
      }
      .doc-email { 
        margin: 8px 0; 
        padding: 6px 0;
      }
      .doc-email a { 
        color: #007bff; 
        text-decoration: none; 
      }
      .doc-email a:hover { 
        text-decoration: underline; 
      }
      .doc-phone { 
        margin: 8px 0; 
        padding: 6px 0;
        font-family: monospace;
      }
      .doc-date { 
        margin: 8px 0; 
        padding: 6px 0;
        font-style: italic;
      }
      .doc-number { 
        margin: 8px 0; 
        padding: 6px 0;
        font-weight: 500;
      }
      .doc-content { 
        margin-left: 0px; 
        margin-top: 10px;
      }
      .error { 
        color: #dc3545; 
        font-style: italic; 
        text-align: center; 
        padding: 20px;
      }
      .wysiwyg-editor .ql-editor {
        min-height: 300px;
      }

.table-preview {
  font-family: Arial, sans-serif;
  line-height: 1.4;
}

.table-title {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
  padding-bottom: 10px;
  border-bottom: 3px solid #3498db;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #34495e;
  margin: 20px 0 10px 0;
  padding: 8px 12px;
  background: #f8f9fa;
  border-left: 4px solid #3498db;
}

.data-table, .section-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.data-table thead th, .section-table thead th {
  background: #3498db;
  color: white;
  padding: 12px 8px;
  text-align: left;
  font-weight: bold;
  border: 1px solid #2980b9;
}

.data-table tbody td, .section-table tbody td {
  padding: 10px 8px;
  border: 1px solid #bdc3c7;
  vertical-align: top;
}

.field-name {
  background: #ecf0f1;
  font-weight: 600;
  color: #2c3e50;
  width: 30%;
}

.field-value {
  background: white;
  color: #34495e;
}

.attr-row .field-name {
  background: #e8f4f8;
  font-style: italic;
}

.nested-row td {
  background: #d5dbdb !important;
  font-weight: bold;
  color: #2c3e50;
}

.indent {
  padding-left: 20px;
}

.email-link {
  color: #3498db;
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.phone-number {
  font-family: monospace;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
}

.date-value {
  color: #8e44ad;
  font-weight: 500;
}

.number-value {
  font-family: monospace;
  color: #27ae60;
  font-weight: 600;
}

.long-text {
  max-width: 300px;
  word-wrap: break-word;
  line-height: 1.5;
}

.data-row:nth-child(even) {
  background: #f8f9fa;
}

.data-row:hover {
  background: #e3f2fd;
}




.list-preview {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #2c3e50;
}

.list-title {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 24px;
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.root-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  margin: 12px 0;
  padding: 12px 16px;
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
}

.list-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.level-1 {
  background: #f8f9ff;
  border-left: 4px solid #667eea;
  margin-left: 0;
}

.level-2 {
  background: #fff5f5;
  border-left: 4px solid #f093fb;
  margin-left: 20px;
}

.level-3 {
  background: #f0fff4;
  border-left: 4px solid #00d4aa;
  margin-left: 40px;
}

.deep-indent {
  background: #fffbf0;
  border-left: 4px solid #ffd93d;
  margin-left: 60px;
}

.element-label {
  font-weight: 600;
  color: #4a5568;
  font-size: 16px;
  display: inline-block;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: rgba(255,255,255,0.8);
  border-radius: 4px;
  text-transform: capitalize;
}

.level-1 .element-label {
  font-size: 18px;
  color: #667eea;
  font-weight: 700;
}

.level-2 .element-label {
  font-size: 16px;
  color: #764ba2;
}

.level-3 .element-label {
  font-size: 14px;
  color: #00a085;
}

.attribute-list {
  list-style: none;
  padding: 8px 0 8px 16px;
  margin: 8px 0;
  background: rgba(255,255,255,0.5);
  border-radius: 4px;
  border: 1px dashed #cbd5e0;
}

.attribute-item {
  margin: 4px 0;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.attr-name {
  font-weight: 600;
  color: #2d3748;
  margin-right: 8px;
  min-width: 80px;
}

.attr-value {
  color: #4a5568;
  background: #edf2f7;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.nested-list {
  list-style: none;
  padding: 8px 0 0 0;
  margin: 8px 0 0 0;
}

.content-value {
  margin: 8px 0;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
}

.value-type {
  font-size: 14px;
  margin-right: 6px;
  opacity: 0.8;
}

.email-link {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
}

.email-link:hover {
  text-decoration: underline;
  color: #2c5aa0;
}

.phone-number {
  color: #38a169;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
}

.date-value {
  color: #805ad5;
  font-weight: 500;
}

.number-value {
  color: #dd6b20;
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}

.url-link {
  color: #3182ce;
  text-decoration: none;
  word-break: break-all;
}

.url-link:hover {
  text-decoration: underline;
}

.long-text {
  margin: 8px 0;
}

.text-content {
  margin-top: 8px;
  padding: 12px;
  background: #f7fafc;
  border-radius: 4px;
  line-height: 1.7;
  color: #2d3748;
}

.text-value {
  color: #4a5568;
  font-weight: 400;
}

.level-1:before {
  content: "▶";
  color: #667eea;
  margin-right: 8px;
  font-weight: bold;
}

.level-2:before {
  content: "▸";
  color: #764ba2;
  margin-right: 8px;
}

.level-3:before {
  content: "•";
  color: #00a085;
  margin-right: 8px;
  font-size: 18px;
}

.deep-indent:before {
  content: "◦";
  color: #ffa000;
  margin-right: 8px;
}


/* Card Preview Styles */
.card-preview {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
}

.main-header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.card-main-title {
  font-size: 32px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-subtitle {
  font-size: 16px;
  opacity: 0.9;
  font-weight: 400;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin: 0;
}

.data-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
}

.data-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.15);
}

/* Card variants */
.blue-variant { border-top: 4px solid #3182ce; }
.purple-variant { border-top: 4px solid #805ad5; }
.green-variant { border-top: 4px solid #38a169; }
.orange-variant { border-top: 4px solid #dd6b20; }
.pink-variant { border-top: 4px solid #d53f8c; }
.teal-variant { border-top: 4px solid #319795; }

.card-header {
  padding: 16px 20px;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  display: flex;
  align-items: center;
}

.card-icon {
  font-size: 20px;
  margin-right: 8px;
}

.card-level {
  background: #4299e1;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.card-body {
  padding: 20px;
}

.card-attributes {
  margin-bottom: 16px;
}

.attributes-header {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.attributes-header:before {
  content: "🏷️";
  margin-right: 6px;
}

.attributes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attribute-chip {
  background: #edf2f7;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.attr-key {
  font-weight: 600;
  color: #2d3748;
}

.attr-val {
  color: #4a5568;
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', monospace;
}

.card-content {
  margin-bottom: 16px;
}

.content-header {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.content-header:before {
  content: "📝";
  margin-right: 6px;
}

.content-value {
  background: #f7fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px;
}

.nested-cards {
  margin-top: 16px;
}

.nested-header {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.nested-header:before {
  content: "📂";
  margin-right: 6px;
}

.nested-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.secondary-card {
  transform: scale(0.95);
  margin: 4px;
}

.tertiary-card {
  transform: scale(0.9);
  margin: 8px;
}

.compact-children {
  margin-top: 16px;
}

.compact-header {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.compact-header:before {
  content: "📋";
  margin-right: 6px;
}

.compact-list {
  background: #f7fafc;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.compact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed #cbd5e0;
}

.compact-item:last-child {
  border-bottom: none;
}

.compact-label {
  font-weight: 500;
  color: #2d3748;
  font-size: 14px;
}

.compact-value {
  color: #4a5568;
  font-size: 13px;
  max-width: 150px;
  text-align: right;
}

/* Value type styles */
.value-icon {
  margin-right: 8px;
  font-size: 16px;
}

.value-email, .value-phone, .value-date, .value-number, .value-url {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.value-email.compact, .value-phone.compact, .value-date.compact, 
.value-number.compact, .value-url.compact {
  padding: 4px 0;
  font-size: 13px;
}

.email-link {
  color: #3182ce;
  text-decoration: none;
  font-weight: 500;
}

.email-link:hover {
  text-decoration: underline;
}

.phone-number {
  color: #38a169;
  font-family: 'Monaco', monospace;
  font-weight: 500;
}

.date-value {
  color: #805ad5;
  font-weight: 500;
}

.number-value {
  color: #dd6b20;
  font-family: 'Monaco', monospace;
  font-weight: 600;
}

.url-link {
  color: #3182ce;
  text-decoration: none;
  word-break: break-all;
}

.url-link:hover {
  text-decoration: underline;
}

.value-text-long {
  display: flex;
  align-items: flex-start;
}

.long-text-content {
  margin-left: 8px;
  line-height: 1.6;
  color: #2d3748;
}

.value-text .text-content {
  color: #4a5568;
  line-height: 1.5;
}

.value-text.compact .text-content {
  font-size: 13px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }
  
  .nested-cards-grid {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
    `}</style>

                {isEditing && showWysiwygEditor ? (
                  <WYSIWYGEditor
                    editableContent={editableContent}
                    showWysiwygEditor={showWysiwygEditor}
                    onChange={(html) => setEditorContent(html)} // Make sure this updates editorContent
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: editableContent }} />
                )}
              </div>
            ) : (
              <div className='flex items-center justify-center h-32 text-gray-500'>
                <AlertCircle className='w-8 h-8 mr-2' />
                <span>
                  No XML file uploaded. Please upload an XML file to see the
                  preview.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Raw Tab */}
        {activeTab === 'raw' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center'>
                <Code className='w-6 h-6 text-orange-500 mr-2' />
                <h3 className='text-xl font-semibold'>Raw Content Editor</h3>
              </div>

              <div className='flex items-center space-x-4'>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => setRawViewMode('xml')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      rawViewMode === 'xml'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    XML
                  </button>
                  <button
                    onClick={() => setRawViewMode('xsd')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      rawViewMode === 'xsd'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    XSD
                  </button>
                </div>

                <button
                  onClick={handleRawContentSave}
                  className='flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'
                >
                  <Save className='w-4 h-4 mr-2' />
                  Save Changes
                </button>
              </div>
            </div>

            {rawViewMode === 'xml' ? (
              <div>
                {xmlFile ? (
                  <textarea
                    value={rawXmlContent || originalXmlContent}
                    onChange={(e) => setRawXmlContent(e.target.value)}
                    className='w-full h-96 p-4 border rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black'
                    placeholder='XML content will appear here...'
                  />
                ) : (
                  <div className='flex items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg'>
                    <span>No XML file uploaded</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {xsdFile ? (
                  <textarea
                    value={rawXsdContent || xsdFile.content} // Add fallback to xsdFile.content
                    onChange={(e) => setRawXsdContent(e.target.value)}
                    className='w-full h-96 p-4 border rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 text-black'
                    placeholder='XSD content will appear here...'
                  />
                ) : (
                  <div className='flex items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg'>
                    <span>No XSD file uploaded</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Convert Tab */}
        {activeTab === 'convert' && (
          <div className='bg-white rounded-xl shadow-lg p-6 mb-6'>
            <div className='flex items-center mb-6'>
              <Settings className='w-6 h-6 text-blue-500 mr-2' />
              <h3 className='text-xl font-semibold'>Convert & Export</h3>
            </div>

            {/* Output Format Selection */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Select Output Format
              </label>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {(['word', 'html', 'pdf'] as const).map((format) => (
                  <div
                    key={format}
                    onClick={() => setOutputFormat(format)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      outputFormat === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center'>
                      <FileText className='w-6 h-6 mr-3' />
                      <div>
                        <div className='font-medium'>
                          {format === 'word' && 'Microsoft Word'}
                          {format === 'html' && 'HTML Document'}
                          {format === 'pdf' && 'PDF Document'}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {format === 'word' && '.doc format'}
                          {format === 'html' && '.html format'}
                          {format === 'pdf' && '.pdf format (Coming Soon)'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Options */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-3'>
                Conversion Options
              </label>
              <div className='space-y-3'>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    className='form-checkbox h-4 w-4 text-blue-600'
                    defaultChecked
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Include XML attributes as metadata
                  </span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    className='form-checkbox h-4 w-4 text-blue-600'
                    defaultChecked
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Format dates and numbers
                  </span>
                </label>
                <label className='flex items-center'>
                  <input
                    type='checkbox'
                    className='form-checkbox h-4 w-4 text-blue-600'
                  />
                  <span className='ml-2 text-sm text-gray-700'>
                    Include XSD validation information
                  </span>
                </label>
              </div>
            </div>

            {/* Convert Button */}
            <div className='flex justify-center'>
              {xmlFile ? (
                <button
                  onClick={handleConvert}
                  disabled={isProcessing || outputFormat === 'pdf'}
                  className={`flex items-center px-8 py-3 rounded-lg font-medium transition-all ${
                    isProcessing || outputFormat === 'pdf'
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                      Converting...
                    </>
                  ) : (
                    <>
                      <Download className='w-5 h-5 mr-2' />
                      Convert to {outputFormat.toUpperCase()}
                      {outputFormat === 'pdf' && ' (Coming Soon)'}
                    </>
                  )}
                </button>
              ) : (
                <div className='text-center'>
                  <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-2' />
                  <p className='text-gray-500'>
                    Please upload an XML file first
                  </p>
                </div>
              )}
            </div>

            {/* Processing Status */}
            {isProcessing && (
              <div className='mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3'></div>
                  <span className='text-blue-700'>
                    Converting XML to {outputFormat.toUpperCase()}... This may
                    take a few moments.
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className='text-center text-gray-500 text-sm'>
          <p>
            © 2025 XML/XSD Document Converter. Built with React and TypeScript.
          </p>
        </div>
      </div>
    </div>
  );
};

export default XMLXSDConverter;
