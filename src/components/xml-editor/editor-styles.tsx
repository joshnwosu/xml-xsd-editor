import React from 'react';

export const EditorStyles: React.FC = () => {
  return (
    <style>{`
      /* Document container styling */
      .xml-document {
        max-width: none;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        line-height: 1.6;
        color: #111827;
        background: white;
        padding: 2rem;
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
      
      /* Headings with improved typography */
      .doc-heading,
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-weight: 600;
        color: #111827;
        margin: 2.5rem 0 1.5rem 0;
        line-height: 1.25;
        page-break-after: avoid;
        letter-spacing: -0.025em;
      }
      
      h1:first-child,
      .doc-title:first-child {
        margin-top: 0;
      }
      
      h1, .doc-heading[data-level="1"] {
        font-size: 2.25rem;
        font-weight: 700;
        border-bottom: 3px solid #f3f4f6;
        padding-bottom: 1rem;
        margin-bottom: 2rem;
      }
      
      h2, .doc-heading[data-level="2"] {
        font-size: 1.875rem;
        font-weight: 600;
      }
      
      h3, .doc-heading[data-level="3"] {
        font-size: 1.5rem;
        font-weight: 600;
      }
      
      h4, .doc-heading[data-level="4"] {
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      h5, h6 {
        font-size: 1.125rem;
        font-weight: 600;
      }
      
      /* Document title - enhanced */
      .doc-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 2rem;
        text-align: center;
        border-bottom: 4px solid #3b82f6;
        padding-bottom: 1.5rem;
        letter-spacing: -0.025em;
      }
      
      /* Section headers - more refined */
      .doc-section {
        font-size: 1.5rem;
        font-weight: 600;
        color: #374151;
        margin: 2.5rem 0 1.5rem 0;
        border-left: 4px solid #3b82f6;
        padding-left: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: linear-gradient(to right, #f8fafc, transparent);
        padding-top: 0.75rem;
        padding-bottom: 0.75rem;
        border-radius: 0 8px 8px 0;
      }

      .doc-section-container {
        margin: 2rem 0 1rem 0;
      }

      .doc-field-label {
        font-weight: 600;
        margin-bottom: 0.5rem;
        display: block;
        color: #374151;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* Enhanced buttons */
      .doc-add-button {
        padding: 0.75rem 1.5rem;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
        border-radius: 8px;
        margin-left: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
        letter-spacing: 0.025em;
      }

      .doc-add-button:hover {
        background: linear-gradient(135deg, #1d4ed8, #1e40af);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        transform: translateY(-1px);
      }

      .doc-add-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
      }

      .doc-delete-button {
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(239, 68, 68, 0.2);
      }

      .doc-delete-button:hover {
        background: linear-gradient(135deg, #dc2626, #b91c1c);
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        transform: translateY(-1px);
      }

      .doc-delete-button:active {
        transform: translateY(0);
        box-shadow: 0 1px 3px rgba(239, 68, 68, 0.2);
      }
      
      .doc-subsection {
        font-size: 1.25rem;
        font-weight: 600;
        color: #4b5563;
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #f3f4f6;
      }
      
      .doc-metadata {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        padding: 1rem 1.5rem;
        border-radius: 8px;
        margin: 1.5rem 0;
        border-left: 4px solid #64748b;
        font-size: 0.875rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .doc-attr {
        color: #475569;
        margin-right: 1.5rem;
        font-weight: 500;
      }
      
      .doc-field,
      .doc-field-container {
        margin: 1rem 0;
        padding: 0.5rem 0;
      }
      
      .doc-paragraph {
        margin: 1.5rem 0;
        padding: 1rem 0;
        text-align: justify;
        font-size: 1rem;
        line-height: 1.7;
        color: #374151;
      }
      
      .doc-email {
        margin: 1rem 0;
        padding: 0.75rem 0;
      }
      
      .doc-phone {
        margin: 1rem 0;
        padding: 0.75rem 0;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      }
      
      .doc-date {
        margin: 1rem 0;
        padding: 0.75rem 0;
        font-style: italic;
        font-weight: 500;
      }
      
      .doc-number {
        margin: 1rem 0;
        padding: 0.75rem 0;
        font-weight: 500;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
      }
      
      .doc-content {
        margin-left: 0;
        margin-top: 1rem;
      }

      /* Enhanced link and value styling */
      .doc-url a, .doc-email a {
        font-weight: 500;
        color: #2563eb;
        text-decoration: none;
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        border-left: 3px solid #2563eb;
        cursor: pointer;
        transition: all 0.2s ease;
        display: inline-block;
      }

      .doc-url a:hover, .doc-email a:hover {
        background: linear-gradient(135deg, #dbeafe, #bfdbfe);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
      }

      .phone-value {
        font-weight: 600;
        color: #0891b2;
        background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        border-left: 3px solid #0891b2;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        display: inline-block;
      }

      .currency-value {
        font-weight: 600;
        color: #059669;
        background: linear-gradient(135deg, #f0fdf4, #dcfce7);
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        border-left: 3px solid #059669;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        display: inline-block;
      }

      .time-value,
      .date-value {
        font-weight: 500;
        color: #7c3aed;
        background: linear-gradient(135deg, #faf5ff, #f3e8ff);
        padding: 0.375rem 0.75rem;
        border-radius: 6px;
        border-left: 3px solid #7c3aed;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        display: inline-block;
      }

      /* Clean table design - only row separators */
      .doc-table-container {
        margin: 2rem 0;
        background: white;
        border-radius: 12px;
        overflow: auto;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
        max-width: 100%;
      }
      
      .doc-table {
        width: 100%;
        min-width: 600px;
        border-collapse: collapse;
        margin: 0;
        background: white;
        border: none;
        font-size: 0.875rem;
        table-layout: auto;
      }
      
      .doc-table th,
      .doc-table td {
        min-width: 180px;
        padding: 1rem;
        text-align: left;
        vertical-align: middle;
        border: none;
        border-right: none;
        position: relative;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      .doc-table th:last-child,
      .doc-table td:last-child {
        width: 120px;
        min-width: 120px;
      }
      
      .doc-table th {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        font-weight: 600;
        color: #374151;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #e2e8f0;
      }
      
      .doc-table tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background-color 0.15s ease;
      }
      
      .doc-table tbody tr:hover {
        background: #f8fafc;
      }
      
      .doc-table tbody tr:last-child {
        border-bottom: none;
      }
      
      /* Remove all vertical borders */
      .doc-table th:not(:last-child),
      .doc-table td:not(:last-child) {
        border-right: none;
      }
      
      .doc-table td:focus-within {
        background: linear-gradient(135deg, #eff6ff, #dbeafe);
        outline: none;
        position: relative;
      }
      
      .doc-table td:focus-within::after {
        content: '';
        position: absolute;
        inset: 0;
        border: 2px solid #3b82f6;
        border-radius: 4px;
        pointer-events: none;
      }
      
      /* Enhanced form inputs */
      .doc-table input,
      .doc-table textarea,
      .doc-table select,
      .doc-text-input,
      .doc-textarea-input,
      .doc-enum-select {
        min-width: 140px;
        width: 100%;
        box-sizing: border-box;
        padding: 0.75rem;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        background: white;
        font-family: inherit;
        font-size: 0.875rem;
        color: #374151;
        transition: all 0.2s ease;
        line-height: 1.5;
      }
      
      .doc-table input:focus,
      .doc-table textarea:focus,
      .doc-table select:focus,
      .doc-text-input:focus,
      .doc-textarea-input:focus,
      .doc-enum-select:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        background: #fefeff;
      }

      .doc-table input::placeholder,
      .doc-table textarea::placeholder,
      .doc-text-input::placeholder,
      .doc-textarea-input::placeholder {
        color: #9ca3af;
        opacity: 1;
      }

      .doc-enum-select,
      .doc-table select {
        cursor: pointer;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 0.75rem center;
        background-repeat: no-repeat;
        background-size: 1rem;
        padding-right: 2.5rem;
        appearance: none;
      }

      .doc-textarea-input {
        resize: vertical;
        min-height: 5rem;
        font-family: inherit;
      }
      
      /* Rest of the styles remain the same but with enhanced spacing and typography */
      .doc-paragraph {
        font-size: 1rem;
        line-height: 1.7;
        margin: 1.5rem 0;
        color: #374151;
        text-align: justify;
        text-indent: 0;
        background: transparent;
        border: none;
        outline: none;
        padding: 0;
      }
      
      .doc-paragraph:focus {
        background: #f9fafb;
        padding: 1rem;
        border-radius: 8px;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      .doc-list {
        margin: 2rem 0;
        padding-left: 0;
      }
      
      .doc-item {
        margin: 1rem 0 1rem 2.5rem;
        position: relative;
        line-height: 1.7;
        font-size: 1rem;
        color: #374151;
        list-style: none;
      }
      
      .doc-item:before {
        content: "•";
        position: absolute;
        left: -2rem;
        color: #6b7280;
        font-weight: 600;
        font-size: 1.25rem;
      }
      
      .doc-list[data-type="ordered"] {
        counter-reset: list-counter;
      }
      
      .doc-list[data-type="ordered"] .doc-item {
        counter-increment: list-counter;
      }
      
      .doc-list[data-type="ordered"] .doc-item:before {
        content: counter(list-counter) ".";
        left: -2.5rem;
        width: 2rem;
        text-align: right;
        font-weight: 600;
      }
      
      .doc-item:focus {
        background: #f9fafb;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
      }
      
      .doc-quote {
        border-left: 4px solid #d1d5db;
        padding-left: 2rem;
        margin: 2rem 0;
        font-style: italic;
        color: #4b5563;
        font-size: 1.125rem;
        position: relative;
        background: linear-gradient(135deg, #f9fafb, transparent);
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;
        border-radius: 0 8px 8px 0;
      }
      
      .doc-quote:before {
        content: """;
        font-size: 4rem;
        color: #d1d5db;
        position: absolute;
        left: -0.75rem;
        top: -1rem;
        font-family: Georgia, serif;
        font-weight: 400;
      }
      
      .doc-code {
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        padding: 2rem;
        margin: 2rem 0;
        font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
        font-size: 0.875rem;
        line-height: 1.6;
        color: #1f2937;
        overflow-x: auto;
        white-space: pre-wrap;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      
      .doc-link {
        color: #2563eb;
        text-decoration: underline;
        text-decoration-color: #bfdbfe;
        text-underline-offset: 0.25em;
        transition: all 0.2s ease;
        font-weight: 500;
      }
      
      .doc-link:hover {
        color: #1d4ed8;
        text-decoration-color: #2563eb;
        text-decoration-thickness: 2px;
      }
      
      .doc-image {
        max-width: 100%;
        height: auto;
        margin: 2rem 0;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      }
      
      .doc-emphasis,
      em {
        font-style: italic;
        color: #374151;
        font-weight: 500;
      }
      
      .doc-strong,
      strong {
        font-weight: 700;
        color: #111827;
      }
      
      [contenteditable]:focus {
        outline: none;
      }
      
      [contenteditable] *:focus {
        outline: 2px solid #3b82f6;
        outline-offset: 2px;
        border-radius: 8px;
      }
      
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
        
        .doc-add-button,
        .doc-delete-button {
          display: none;
        }

        .doc-table {
          box-shadow: none;
        }
      }
      
      .no-xml-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 400px;
        text-align: center;
      }
      
      .no-xml-content h3 {
        color: #6b7280;
        font-size: 1.5rem;
        margin-bottom: 1rem;
        font-weight: 600;
      }
      
      .no-xml-content p {
        color: #9ca3af;
        font-size: 1rem;
        max-width: 400px;
        line-height: 1.6;
      }
      
      .error {
        color: #dc3545;
        font-style: italic;
        text-align: center;
        padding: 2rem;
        background: linear-gradient(135deg, #fef2f2, #fee2e2);
        border-radius: 12px;
        border: 2px solid #fecaca;
        font-weight: 500;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .xml-document {
          padding: 1rem;
        }

        .doc-table th,
        .doc-table td {
          padding: 0.75rem 0.5rem;
        }

        .doc-section {
          flex-direction: column;
          align-items: flex-start;
          gap: 1rem;
        }

        .doc-add-button {
          margin-left: 0;
          margin-top: 0.5rem;
        }
      }

      .hidden {
        display: none;
      }
    `}</style>
  );
};
