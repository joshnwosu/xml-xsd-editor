export const styles = `
  .wysiwyg-content .xml-heading {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin: 1rem 0 0.5rem 0;
    padding: 0.5rem;
    background: linear-gradient(to right, #3b82f6, #1d4ed8);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    border-bottom: 2px solid #e5e7eb;
  }

  .wysiwyg-content .xml-paragraph {
    margin: 0.75rem 0;
    line-height: 1.6;
    color: #374151;
    padding: 0.5rem;
    background: #f9fafb;
    border-left: 3px solid #3b82f6;
    border-radius: 0.25rem;
  }

  .wysiwyg-content .xml-list {
    margin: 1rem 0;
    padding-left: 1.5rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .wysiwyg-content .xml-list-item {
    margin: 0.5rem 0;
    padding: 0.25rem 0.5rem;
    background: white;
    border-radius: 0.25rem;
    border-left: 3px solid #10b981;
  }

  .wysiwyg-content .xml-bold {
    font-weight: bold;
    color: #1f2937;
    background: #fef3c7;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }

  .wysiwyg-content .xml-emphasis {
    font-style: italic;
    color: #7c3aed;
    background: #f3e8ff;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }

  .wysiwyg-content .xml-code {
    font-family: monospace;
    background: #1f2937;
    color: #f9fafb;
    padding: 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    margin: 0.5rem 0;
    display: block;
  }

  .wysiwyg-content .xml-link {
    color: #2563eb;
    text-decoration: underline;
    background: #dbeafe;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .wysiwyg-content .xml-element {
    margin: 0.5rem 0;
    padding: 0.75rem;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    position: relative;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .wysiwyg-content .xml-element::before {
    content: attr(data-xml-tag);
    position: absolute;
    top: -8px;
    left: 12px;
    background: #3b82f6;
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .wysiwyg-content .xml-table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .wysiwyg-content .xml-row {
    border-bottom: 1px solid #e5e7eb;
  }

  .wysiwyg-content .xml-cell {
    padding: 0.75rem;
    border-right: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .wysiwyg-editor {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
  }

  .wysiwyg-editor:focus {
    outline: none;
  }

  .wysiwyg-editor [contenteditable="true"]:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
    border-radius: 0.25rem;
  }
`;
