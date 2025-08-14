import React from 'react';

export const EditorStyles: React.FC = () => {
  return (
    <style>{`
      /* Document container styling */
      .xml-document {
        max-width: none;
        font-family: sans-serif;
        line-height: 1.6;
        color: #1a1a1a;
        background: white;
      }
      
      .document-editor {
        background: white !important;
      }
      
      /* Hide all XML structural elements completely */
      .xml-element,
      .xml-element-header,
      .xml-element-content,
      .xml-tag-name,
      .xml-attributes,
      .xml-attribute {
        display: none !important;
      }
      
      /* Document content elements - clean, document-like appearance */
      
      /* Headings */
      .doc-heading,
      h1, h2, h3, h4, h5, h6 {
        font-family: sans-serif;
        font-weight: bold;
        color: #111827;
        margin: 2rem 0 1rem 0;
        line-height: 1.2;
        page-break-after: avoid;
      }
      
      h1, .doc-heading[data-level="1"] {
        font-size: 2rem;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 0.5rem;
      }
      
      h2, .doc-heading[data-level="2"] {
        font-size: 1.75rem;
      }
      
      h3, .doc-heading[data-level="3"] {
        font-size: 1.5rem;
      }
      
      h4, .doc-heading[data-level="4"] {
        font-size: 1.25rem;
      }
      
      h5, h6 {
        font-size: 1.125rem;
      }
      
      /* Document title from your preview */
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

        display: flex;
        justify-content: space-between;
        align-items: center;
      }


      .doc-add-button {
        padding: 10px 20px;
        background-color: #3498db;
        color: #fff;
        border-radius: 8px;
        margin-left: 10px;
        font-size: 14px;
        font-weight: 400;
        cursor: pointer;
        
      }

      .doc-add-button:hover {
        background-color: #007bff;
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

      .doc-url a, .doc-email a {
        font-weight: bold;
        color: #007bff;
        text-decoration: none;
        background: #f8f9fa;
        padding: 2px 6px;
        border-radius: 4px;
        border-left: 3px solid #007bff;
        cursor: pointer;
      }

      .doc-url a:hover, .doc-email a:hover {
        text-decoration: underline;
      }

      .phone-value {
        font-weight: bold;
        color: #17a2b8;
        background: #d1ecf1;
        padding: 2px 8px;
        border-radius: 4px;
        border-left: 3px solid #17a2b8;
        font-family: monospace;
      }

      .currency-value {
        font-weight: bold;
        color: #28a745;
        background: #d4edda;
        padding: 2px 8px;
        border-radius: 4px;
        border-left: 3px solid #28a745;
        font-family: monospace;
      }

      .time-value,
      .date-value {
        font-weight: 500;
        color: #6f42c1;
        background: #f3e8ff;
        padding: 2px 8px;
        border-radius: 4px;
        border-left: 3px solid #6f42c1;
        font-family: monospace;
      }
      
      /* Paragraphs */
      .doc-paragraph {
        font-size: 16px;
        line-height: 1.6;
        margin: 1rem 0;
        color: #374151;
        text-align: justify;
        text-indent: 0;
        background: transparent;
        border: none;
        outline: none;
        padding: 0;
        font-family: sans-serif;
      }
      
      .doc-paragraph:focus {
        background: #f9fafb;
        padding: 0.5rem;
        border-radius: 0.25rem;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Lists */
      .doc-list {
        margin: 1.5rem 0;
        padding-left: 0;
      }
      
      .doc-item {
        margin: 0.75rem 0 0.75rem 2rem;
        position: relative;
        line-height: 1.6;
        font-size: 16px;
        color: #374151;
        list-style: none;
      }
      
      .doc-item:before {
        content: "•";
        position: absolute;
        left: -1.5rem;
        color: #6b7280;
        font-weight: bold;
        font-size: 1.2em;
      }
      
      .doc-list[data-type="ordered"] {
        counter-reset: list-counter;
      }
      
      .doc-list[data-type="ordered"] .doc-item {
        counter-increment: list-counter;
      }
      
      .doc-list[data-type="ordered"] .doc-item:before {
        content: counter(list-counter) ".";
        left: -2rem;
        width: 1.5rem;
        text-align: right;
      }
      
      .doc-item:focus {
        background: #f9fafb;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Sections */
      .doc-section {
        margin: 2rem 0;
      }
      
      /* Quotes */
      .doc-quote {
        border-left: 4px solid #d1d5db;
        padding-left: 2rem;
        margin: 2rem 0;
        font-style: italic;
        color: #4b5563;
        font-size: 1.125rem;
        position: relative;
      }
      
      .doc-quote:before {
        content: """;
        font-size: 4rem;
        color: #d1d5db;
        position: absolute;
        left: -0.5rem;
        top: -1rem;
        font-family: Georgia, serif;
      }
      
      .doc-quote:focus {
        background: #f9fafb;
        padding: 1rem 1rem 1rem 2rem;
        border-radius: 0.5rem;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Code blocks */
      .doc-code {
        background: #f3f4f6;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        padding: 1.5rem;
        margin: 2rem 0;
        font-family: 'Courier New', Courier, monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #1f2937;
        overflow-x: auto;
        white-space: pre-wrap;
      }
      
      .doc-code:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Tables */
      .doc-table {
        width: 100%;
        border-collapse: collapse;
        margin: 2rem 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        overflow: hidden;
      }
      
      .doc-table th,
      .doc-table td {
        padding: 0.75rem 1rem;
        border-right: 1px solid #e5e7eb;
        text-align: left;
        vertical-align: top;
      }
      
      .doc-table th {
        background: #f9fafb;
        font-weight: bold;
      }
      
      .doc-table tr {
        border-bottom: 1px solid #e5e7eb;
      }
      
      .doc-table tr:last-child {
        border-bottom: none;
      }
      
      .doc-table th:last-child,
      .doc-table td:last-child {
        border-right: none;
      }
      
      .doc-table td:focus {
        background: #f3f4f6;
        outline: 2px solid #3b82f6;
        outline-offset: -2px;
      }
      
      /* Links */
      .doc-link {
        color: #2563eb;
        text-decoration: underline;
        text-decoration-color: #bfdbfe;
        text-underline-offset: 0.2em;
        transition: all 0.2s ease;
      }
      
      .doc-link:hover {
        color: #1d4ed8;
        text-decoration-color: #2563eb;
      }
      
      .doc-link:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 0.125rem;
      }
      
      /* Images */
      .doc-image {
        max-width: 100%;
        height: auto;
        margin: 2rem 0;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .doc-image:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* Emphasis */
      .doc-emphasis,
      em {
        font-style: italic;
        color: #374151;
      }
      
      .doc-strong,
      strong {
        font-weight: bold;
        color: #111827;
      }
      
      /* Focus states for better accessibility */
      [contenteditable]:focus {
        outline: none;
      }
      
      [contenteditable] *:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 0.25rem;
      }
      
      /* Print styles */
      @media print {
        .document-editor {
          box-shadow: none !important;
          border: none !important;
          margin: 0 !important;
          padding: 1in !important;
        }
        
        .doc-heading,
        h1, h2, h3, h4, h5, h6 {
          page-break-after: avoid;
        }
        
        .doc-paragraph,
        .doc-item {
          orphans: 3;
          widows: 3;
        }
        
        .doc-section {
          page-break-inside: avoid;
        }
      }
      
      /* No content state */
      .no-xml-content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 400px;
      }
      
      .no-xml-content h3 {
        color: #6b7280;
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
      }
      
      .no-xml-content p {
        color: #9ca3af;
        font-size: 1rem;
      }
      
      .error {
        color: #dc3545;
        font-style: italic;
        text-align: center;
        padding: 20px;
      }

      .doc-field-container {
        margin: 8px 0;
        padding: 4px 0;
      }

      .doc-field-label {
        font-weight: bold;
        margin-right: 8px;
      }

      .doc-enum-select {
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: white;
        font-family: inherit;
        font-size: inherit;
        cursor: pointer;
      }

      .doc-enum-select:focus {
        outline: none;
        border-color: #3498db;
      }

    `}</style>
  );
};
