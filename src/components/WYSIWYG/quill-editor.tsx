// import ReactQuill from 'react-quill-new';
// import 'react-quill-new/dist/quill.snow.css';

// // WYSIWYG Editor Component
// export const _WYSIWYGEditor = () => {
//   const modules = {
//     toolbar: [
//       [{ header: [1, 2, 3, false] }],
//       ['bold', 'italic', 'underline', 'strike'],
//       [{ color: [] }, { background: [] }],
//       [{ align: [] }],
//       [{ list: 'ordered' }, { list: 'bullet' }],
//       ['link'],
//       [{ indent: '-1' }, { indent: '+1' }],
//       ['clean'],
//     ],
//   };

//   const formats = [
//     'header',
//     'bold',
//     'italic',
//     'underline',
//     'strike',
//     'color',
//     'background',
//     'align',
//     'list',
//     // 'bullet',
//     'link',
//     'indent',
//   ];

//   // Add styles to document head (no jsx syntax)
//   React.useEffect(() => {
//     const styleId = 'quill-custom-styles';
//     if (!document.getElementById(styleId)) {
//       const style = document.createElement('style');
//       style.id = styleId;
//       style.textContent = `
//       .xml-editor-quill .ql-container {
//         min-height: 300px;
//         border-radius: 0 0 8px 8px;
//         font-family: 'Times New Roman', serif;
//       }
//       .xml-editor-quill .ql-toolbar {
//         border-radius: 8px 8px 0 0;
//       }
//       .xml-editor-quill .ql-editor {
//         font-family: 'Times New Roman', serif;
//         font-size: 14px;
//         line-height: 1.6;
//         min-height: 300px;
//       }
//     `;
//       document.head.appendChild(style);
//     }
//   }, []);

//   return (
//     <div className='xml-editor-quill border rounded-lg overflow-hidden'>
//       <ReactQuill
//         theme='snow'
//         value={editorContent}
//         onChange={setEditorContent}
//         modules={modules}
//         formats={formats}
//         placeholder='Edit your XML preview here...'
//       />
//     </div>
//   );
// };
