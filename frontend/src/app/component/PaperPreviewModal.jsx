import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer, FileDown, Columns } from 'lucide-react';
import { renderTextWithMath } from './QuestionComponents';

// We use html-docx-js via CDN (window.htmlDocx)

const PaperPreviewModal = ({ 
  isOpen, 
  onClose, 
  examData, 
  initialFormat = 'pdf', 
  initialColumns = 1 
}) => {
  const { t } = useTranslation();
  const printRef = useRef(null);
  
  const [format, setFormat] = useState(initialFormat);
  const [columns, setColumns] = useState(initialColumns);

  if (!isOpen || !examData) return null;

  const handlePrintPdf = () => {
    // We can use standard window.print() but restrict it to only print the preview area via CSS
    // A better approach is to create an iframe or open a new window to print just the content, 
    // or use CSS @media print to hide everything else.
    // For simplicity, let's use the @media print approach. We will add a print-only class to the modal content.
    window.print();
  };

  const handleExportDocx = () => {
    if (!printRef.current) return;
    
    // Clone the print reference to manipulate it without affecting the UI
    const clone = printRef.current.cloneNode(true);
    
    // Remove MathML as it causes corrupted/blank DOCX files in MS Word
    const mathmlElements = clone.querySelectorAll('.katex-mathml');
    mathmlElements.forEach(el => el.remove());

    // Remove SVGs as html-docx-js doesn't support them well
    const svgs = clone.querySelectorAll('svg');
    svgs.forEach(el => el.remove());

    // Construct a full HTML document string including styles for the export
    const contentHtml = clone.innerHTML;
    
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${examData.name}</title>
          <style>
            body { font-family: "Sarabun", "TH Sarabun New", sans-serif; }
            .question-block { margin-bottom: 20px; page-break-inside: avoid; }
            .choices { margin-left: 20px; }
            .choice { margin-bottom: 5px; }
            img { max-width: 100%; height: auto; }
            .grid-cols-2 { column-count: 2; column-gap: 40px; }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;">${examData.name}</h1>
          ${examData.description ? `<p style="text-align: center;">${examData.description}</p>` : ''}
          <hr />
          <div class="${columns === 2 ? 'grid-cols-2' : ''}">
            ${contentHtml}
          </div>
        </body>
      </html>
    `;

    try {
      const converted = window.htmlDocx.asBlob(fullHtml, { orientation: 'portrait', margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } });
      
      // Trigger download
      const url = URL.createObjectURL(converted);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${examData.name}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX Export failed:', err);
      alert('Failed to export DOCX. Please try PDF export instead.');
    }
  };

  const handleExport = () => {
    if (format === 'pdf') {
      handlePrintPdf();
    } else {
      handleExportDocx();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 print-wrapper">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-[95vh] border border-slate-200 dark:border-slate-700 print-modal-inner">
        
        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-t-2xl hide-on-print">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              {t('exam.paperPreview', 'Paper Preview')}
            </h2>
            
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
            
            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setFormat('pdf')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${format === 'pdf' ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                PDF
              </button>
              <button 
                onClick={() => setFormat('docx')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${format === 'docx' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                DOCX
              </button>
            </div>

            <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setColumns(1)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${columns === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Columns size={14} className="opacity-50" /> 1
              </button>
              <button 
                onClick={() => setColumns(2)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${columns === 2 ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
              >
                <Columns size={14} /> 2
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-zense-navy dark:bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors"
            >
              {format === 'pdf' ? <Printer size={18} /> : <FileDown size={18} />}
              {t('exam.export', 'Export')} {format.toUpperCase()}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* A4 Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 custom-scrollbar flex justify-center">
          
          {/* Printable Container */}
          <div className="print-area bg-white text-black p-10 shadow-lg w-full max-w-[210mm] min-h-[297mm]">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{examData.name}</h1>
              {examData.description && <p className="text-gray-600">{examData.description}</p>}
            </div>

            <div ref={printRef} className={`text-sm ${columns === 2 ? 'columns-1 sm:columns-2 gap-8' : ''}`} style={{ columnFill: 'auto' }}>
              {examData.questions && examData.questions.map((q, idx) => {
                const prevGroup = idx > 0 ? examData.questions[idx - 1].group?.id : null;
                const showGroupHeader = q.group && q.group.id !== prevGroup;

                return (
                  <div key={q.id} className="mb-6 break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                    {showGroupHeader && (
                      <div className="mb-3 p-3 border border-gray-300 rounded bg-gray-50">
                        <h4 className="font-bold text-sm mb-1 uppercase">Scenario</h4>
                        {q.group.text && <div className="mb-2">{renderTextWithMath(q.group.text)}</div>}
                        {q.group.image_url && <img src={q.group.image_url} alt="Group" className="max-w-full h-auto mt-2" />}
                      </div>
                    )}
                    
                    <div className="flex items-start gap-2 mb-2">
                      <span className="font-bold whitespace-nowrap">{idx + 1}.</span>
                      <div className="flex-1">
                        {renderTextWithMath(q.text)}
                        {q.image_url && <img src={q.image_url} alt="Question" className="max-w-full h-auto mt-2 block" />}
                      </div>
                    </div>
                    
                    <div className="pl-6 space-y-1">
                      {q.choices && q.choices.map((c, cIdx) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <span className="font-semibold">{String.fromCharCode(65 + cIdx)}.</span>
                          <div className="flex-1">
                            {renderTextWithMath(c.text)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperPreviewModal;
