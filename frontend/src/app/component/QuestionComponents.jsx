import React, { useState } from 'react';
import axios from 'axios';
import { X, Image as ImageIcon } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export const renderTextWithMath = (text) => {
  if (!text) return null;
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map((part, index) => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      return <BlockMath key={index} math={part.slice(2, -2)} />;
    } else if (part.startsWith('$') && part.endsWith('$')) {
      return <InlineMath key={index} math={part.slice(1, -1)} />;
    }
    return <span key={index} className="whitespace-pre-wrap">{part}</span>;
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
      const res = await axios.post('http://localhost:8000/api/upload-image/', formDataObj, {
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
