import React, { useState } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import { X, Image as ImageIcon } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import katex from 'katex';

const HtmlMathRenderer = ({ content }) => {
  const processedContent = React.useMemo(() => {
    let clean = (content || '').replace(/&nbsp;/g, ' ').replace(/\u00A0/g, ' ');
    
    // Process block math: $$...$$
    clean = clean.replace(/\$\$([\s\S]*?)\$\$/g, (match, p1) => {
      // Remove any HTML tags that might have been inserted into the math block by Quill
      const mathRaw = p1.replace(/<[^>]+>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>');
      try {
        return katex.renderToString(mathRaw, { displayMode: true, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    // Process inline math: $...$
    clean = clean.replace(/\$([\s\S]*?)\$/g, (match, p1) => {
      // Remove any HTML tags that might have been inserted into the math block by Quill
      const mathRaw = p1.replace(/<[^>]+>/g, '')
                        .replace(/&amp;/g, '&')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>');
      try {
        return katex.renderToString(mathRaw, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });

    return clean;
  }, [content]);

  return (
    <div 
      className="quill-content prose prose-sm max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: processedContent }} 
    />
  );
};

export const renderTextWithMath = (text) => {
  if (!text) return null;
  
  // Check if it's HTML from Quill (Quill wraps everything in <p>, <h1>, etc)
  // We include [^>]* to allow for attributes like class="..."
  if (/^<(p|h[1-6]|ul|ol|blockquote|div|span)[^>]*>/i.test(text.trim())) {
    return <HtmlMathRenderer content={text} />;
  }

  // Fallback to old rendering logic for old plain text questions
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <BlockMath key={index} math={part.slice(2, -2)} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={index} math={part.slice(1, -1)} />;
    }
    
    // Parse basic markdown: **bold** and *italic* or _italic_
    const boldParts = part.split(/(\*\*[\s\S]*?\*\*)/g);
    return boldParts.map((bPart, bIndex) => {
      const renderItalic = (text, keyPrefix) => {
        const italicParts = text.split(/(\*[\s\S]*?\*|__[\s\S]*?__)/g);
        return italicParts.map((iPart, iIndex) => {
          if ((iPart.startsWith('*') && iPart.endsWith('*')) || (iPart.startsWith('__') && iPart.endsWith('__'))) {
            return <em key={`${keyPrefix}-i-${iIndex}`}>{iPart.startsWith('*') ? iPart.slice(1, -1) : iPart.slice(2, -2)}</em>;
          }
          return <span key={`${keyPrefix}-i-${iIndex}`} className="whitespace-pre-wrap">{iPart}</span>;
        });
      };

      if (bPart.startsWith('**') && bPart.endsWith('**')) {
        return <strong key={`${index}-b-${bIndex}`}>{renderItalic(bPart.slice(2, -2), `${index}-b-${bIndex}`)}</strong>;
      }
      return renderItalic(bPart, `${index}-b-${bIndex}`);
    });
  });
};

export const ImageUploadField = ({ label, value, onChange, placeholder }) => {
  const [mode, setMode] = useState('file'); // 'file' or 'url'
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    const formDataObj = new FormData();
    formDataObj.append('image', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/api/upload-image/', formDataObj, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      onChange(res.data.url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center justify-between">
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
        {!label && <div />}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${mode === 'url' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Enter URL
          </button>
        </div>
      </div>
      
      {mode === 'url' ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "https://example.com/image.jpg"}
          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {value && (
            <div className="relative w-full rounded-xl border border-slate-200 overflow-hidden group bg-slate-50 flex justify-center p-2">
              <img src={value} alt="Preview" className="max-h-[150px] object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => onChange('')}
                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <label className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors text-sm text-slate-500">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
            {isUploading ? (
              <span className="flex items-center gap-2 text-blue-600">
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ImageIcon size={16} /> {value ? 'Change Image File' : 'Choose Image File'}
              </span>
            )}
          </label>
        </div>
      )}
    </div>
  );
};

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export const RichTextEditor = ({ value, onChange, placeholder, simple = false, className = '' }) => {
  const modules = {
    toolbar: simple ? [
      ['bold', 'italic', 'underline'],
      ['clean']
    ] : [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['clean']
    ]
  };

  return (
    <div className={`w-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden ${className}`}>
      <style>{`
        .ql-toolbar.ql-snow {
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          border-color: #e2e8f0;
          background-color: #f8fafc;
        }
        .dark .ql-toolbar.ql-snow {
          border-color: #334155;
          background-color: #1e293b;
        }
        .ql-container.ql-snow {
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          border-color: #e2e8f0;
          font-size: 0.875rem;
          font-family: inherit;
        }
        .dark .ql-container.ql-snow {
          border-color: #334155;
          color: white;
        }
        .ql-editor {
          min-height: ${simple ? '60px' : '100px'};
        }
        .dark .ql-stroke {
          stroke: #94a3b8 !important;
        }
        .dark .ql-fill {
          fill: #94a3b8 !important;
        }
        .dark .ql-picker {
          color: #94a3b8 !important;
        }
      `}</style>
      <ReactQuill 
        theme="snow" 
        value={value || ''} 
        onChange={onChange} 
        placeholder={placeholder}
        modules={modules}
      />
    </div>
  );
};

