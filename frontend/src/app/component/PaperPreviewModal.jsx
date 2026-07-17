import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer, FileDown, Columns } from 'lucide-react';
import { renderTextWithMath } from './QuestionComponents';
import api from '../../utils/api';

// We use html-docx-js via CDN (window.htmlDocx)

// A4 standard at 96 DPI (CSS Pixels)
const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const MARGIN = 96; // Equivalent to ~1 inch / 300px at 300DPI
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2); // 602
const CONTENT_HEIGHT = PAGE_HEIGHT - (MARGIN * 2); // 931
const GAP = 26; // gap between columns in 2-column mode
const COLUMN_WIDTH = (CONTENT_WIDTH - GAP) / 2; // 288

const PaperPreviewModal = ({
  isOpen,
  onClose,
  examData,
  initialFormat = 'pdf',
  initialColumns = 1
}) => {
  const { t } = useTranslation();

  const [format, setFormat] = useState(initialFormat);
  const [columns, setColumns] = useState(initialColumns);

  // Cover settings state
  const [university, setUniversity] = useState('มหาวิทยาลัยมหาสารคาม');
  const [faculty, setFaculty] = useState('สำนักศึกษาทั่วไป (Office of General Education)');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  const sortedQuestions = useMemo(() => {
    if (!examData?.questions) return [];

    // Group questions by scenario (group.id) to prevent identical scenarios from being split
    const grouped = {};
    const noGroup = [];

    examData.questions.forEach(q => {
      if (!q.group) {
        noGroup.push(q);
      } else {
        if (!grouped[q.group.id]) {
          grouped[q.group.id] = [];
        }
        grouped[q.group.id].push(q);
      }
    });

    const result = [];
    const seenGroups = new Set();
    const groupRanges = {}; // Map of groupId to { start, end }

    // First pass to determine ranges in the final array
    let currentIndex = 1;

    examData.questions.forEach(q => {
      if (!q.group) {
        result.push(q);
        currentIndex++;
      } else if (!seenGroups.has(q.group.id)) {
        seenGroups.add(q.group.id);
        const groupQ = grouped[q.group.id];
        
        // Record range
        groupRanges[q.group.id] = {
          start: currentIndex,
          end: currentIndex + groupQ.length - 1
        };
        
        // Add all questions for this group
        groupQ.forEach(gq => {
          // Attach range text to the first question of the group so we can render it
          result.push({
             ...gq, 
             _groupRange: groupRanges[q.group.id]
          });
          currentIndex++;
        });
      }
    });

    return result;
  }, [examData?.questions]);

  const [courseCode, setCourseCode] = useState(() => {
    return examData?.subjects?.length > 0 ? examData.subjects.map(s => s.id).join(', ') : '';
  });
  const [courseName, setCourseName] = useState(() => {
    return examData?.subjects?.length > 0 ? examData.subjects.map(s => s.name).join(', ') : '';
  });

  useEffect(() => {
    if (examData?.subjects?.length > 0) {
      setCourseCode(examData.subjects.map(s => s.id).join(', '));
      setCourseName(examData.subjects.map(s => s.name).join(', '));
    }
  }, [examData]);

  // Pagination state
  const measureRef = useRef(null);
  const printRef = useRef(null);
  const [isMeasuring, setIsMeasuring] = useState(true);
  const [paginatedPages, setPaginatedPages] = useState([]);

  // Calculate pagination whenever data or column setting changes
  useEffect(() => {
    if (!isOpen || !examData?.questions) return;

    setIsMeasuring(true);
    setPaginatedPages([]);

    let isCancelled = false;
    let timer = null;

    // Wait for custom fonts to load to ensure accurate height measurements
    document.fonts.ready.then(() => {
      if (isCancelled) return;

      timer = setTimeout(() => {
        if (isCancelled || !measureRef.current) return;

        const questionEls = Array.from(measureRef.current.children);

        let pages = [];
        let currentCols = columns === 1 ? [[]] : [[], []];
        let currentHeight = 0;
        let currentColIdx = 0;

        questionEls.forEach((el, index) => {
          const qObj = sortedQuestions[index];
          // Get full height including margins
          const style = window.getComputedStyle(el);
          const marginTop = parseFloat(style.marginTop) || 0;
          const marginBottom = parseFloat(style.marginBottom) || 0;
          const totalH = el.getBoundingClientRect().height + marginTop + marginBottom;

          // Add 80px safety buffer to ensure it doesn't overflow in MS Word DOCX rendering
          if (currentHeight + totalH > CONTENT_HEIGHT - 80) {
            if (columns === 1 || currentColIdx === 1) {
              // Push current page and start a new one
              pages.push(currentCols);
              currentCols = columns === 1 ? [[]] : [[], []];
              currentColIdx = 0;
              currentHeight = totalH;
              currentCols[currentColIdx].push({ ...qObj, originalIndex: index });
            } else {
              // Move to next column
              currentColIdx = 1;
              currentHeight = totalH;
              currentCols[currentColIdx].push({ ...qObj, originalIndex: index });
            }
          } else {
            currentHeight += totalH;
            currentCols[currentColIdx].push({ ...qObj, originalIndex: index });
          }
        });

        // Push the last page
        if (currentCols[0].length > 0 || (columns === 2 && currentCols[1].length > 0)) {
          pages.push(currentCols);
        }

        setPaginatedPages(pages);
        setIsMeasuring(false);
      }, 100);
    });

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, examData, columns]);

  if (!isOpen || !examData) return null;

  const handlePrintPdf = () => {
    if (!printRef.current) return;

    const clone = printRef.current.cloneNode(true);

    // Remove MathML
    const mathmlElements = clone.querySelectorAll('.katex-mathml');
    mathmlElements.forEach(el => el.remove());

    const contentHtml = clone.outerHTML;

    // Copy all styles from the parent document to ensure Tailwind works
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${examData.name || 'Exam Paper'}</title>
          ${styles}
          <style>
            body { font-family: "TH SarabunPSK", "Sarabun", "TH Sarabun New", sans-serif; font-size: 18px; line-height: 1.5; margin: 0; padding: 0; background: white; color: black; }
            .a4-page { width: ${PAGE_WIDTH}px; height: ${PAGE_HEIGHT}px; box-sizing: border-box; padding: ${MARGIN}px; page-break-after: always; background: white; margin: 0 auto; }
            .question-block { margin-bottom: 24px; page-break-inside: avoid; }
            .scenario-block { margin-bottom: 12px; padding: 12px; border: 2px solid #ccc; background-color: #f9fafb; border-radius: 8px; }
            @page { size: A4 portrait; margin: 0; }
            @media print {
              html, body { width: 210mm; height: 297mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .a4-page { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                height: 100% !important; 
                max-height: 297mm !important; 
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          ${contentHtml}
          <script>
            window.onload = () => {
              // Give styles a moment to apply, especially if loading via external link
              setTimeout(() => {
                window.print();
                setTimeout(() => { window.close(); }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
    } else {
      alert('Please allow popups for this website to print the PDF.');
    }
  };

  const handleExportDocx = async () => {
    if (!printRef.current) return;

    // Dynamically load html-docx-js if it's missing (e.g., after Vite HMR or CDN delay)
    if (typeof window.htmlDocx === 'undefined') {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/html-docx-js/dist/html-docx.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (e) {
        alert('Failed to load DOCX export library. Please check your internet connection.');
        return;
      }
    }

    // Clone the print reference to manipulate it without affecting the UI
    const clone = printRef.current.cloneNode(true);

    // Remove MathML as it causes corrupted/blank DOCX files in MS Word
    const mathmlElements = clone.querySelectorAll('.katex-mathml');
    mathmlElements.forEach(el => el.remove());

    // Remove SVGs as html-docx-js doesn't support them well
    const svgs = clone.querySelectorAll('svg');
    svgs.forEach(el => el.remove());

    // --- DOCX Compatibility Fixes ---
    // Word does not support Flexbox, so we convert flex layouts to tables.

    // 1. Convert 2-column layout (.column-container) to table
    const colContainers = clone.querySelectorAll('.column-container');
    colContainers.forEach(container => {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.border = 'none';
      const tr = document.createElement('tr');

      const cols = Array.from(container.children);
      cols.forEach((col, index) => {
        const td = document.createElement('td');
        td.style.width = `${100 / cols.length}%`;
        td.style.verticalAlign = 'top';
        if (index === 0 && cols.length > 1) td.style.paddingRight = '13px';
        if (index === 1 && cols.length > 1) td.style.paddingLeft = '13px';

        td.appendChild(col);
        tr.appendChild(td);
      });

      table.appendChild(tr);
      container.parentNode.replaceChild(table, container);
    });

    // 3. Convert .justify-between to table for cover page
    const justifyBetweens = clone.querySelectorAll('.justify-between');
    justifyBetweens.forEach(container => {
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.border = 'none';
      const tr = document.createElement('tr');

      const children = Array.from(container.children);
      children.forEach((child, index) => {
        const td = document.createElement('td');
        td.style.width = `${100 / children.length}%`;
        td.style.verticalAlign = 'bottom';
        if (index > 0) td.style.textAlign = 'right';

        td.appendChild(child);
        tr.appendChild(td);
      });

      table.appendChild(tr);
      container.parentNode.replaceChild(table, container);
    });

    // 4. Align signature block to right
    const justifyEnds = clone.querySelectorAll('.justify-end');
    justifyEnds.forEach(container => {
      container.style.textAlign = 'right';
    });

    // 5. Convert question text and choices (.flex.items-start) to tables to prevent line breaks
    const flexItemsStarts = clone.querySelectorAll('.items-start');
    flexItemsStarts.forEach(container => {
      const children = Array.from(container.children);
      if (children.length >= 2 && container.tagName.toLowerCase() !== 'table') {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.border = 'none';
        const tr = document.createElement('tr');

        children.forEach((child, index) => {
          const td = document.createElement('td');
          td.style.verticalAlign = 'top';

          if (index === 0) {
            td.style.width = '1%';
            td.style.whiteSpace = 'nowrap';
            td.style.paddingRight = '12px';
          } else {
            td.style.width = '99%';
          }

          td.appendChild(child);
          tr.appendChild(td);
        });

        table.appendChild(tr);
        container.parentNode.replaceChild(table, container);
      }
    });

    // 6. Fix image scaling for MS Word and pad with white
    const originalImages = printRef.current.querySelectorAll('img');
    const clonedImages = clone.querySelectorAll('img');
    clonedImages.forEach((img, i) => {
      const origImg = originalImages[i];
      if (origImg && origImg.complete && origImg.naturalWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 270;
          canvas.height = 150;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, 270, 150);
          
          const imgW = origImg.naturalWidth;
          const imgH = origImg.naturalHeight;
          const ratio = Math.min(270 / imgW, 150 / imgH);
          const newW = imgW * ratio;
          const newH = imgH * ratio;
          const x = (270 - newW) / 2;
          const y = (150 - newH) / 2;
          
          ctx.drawImage(origImg, x, y, newW, newH);
          img.src = canvas.toDataURL('image/png');
        } catch (e) {
          console.warn("Canvas cross-origin padding failed for DOCX", e);
        }
      }
      img.setAttribute('width', '270');
      img.setAttribute('height', '150');
      img.style.width = '270px';
      img.style.height = '150px';
      img.style.maxWidth = '270px';
    });

    // 7. Force explicit page breaks for DOCX to exactly match preview pagination
    const pages = clone.querySelectorAll('.a4-page');
    for (let i = 1; i < pages.length; i++) {
      const br = document.createElement('br');
      br.style.pageBreakBefore = 'always';
      br.style.clear = 'both';
      pages[i].insertBefore(br, pages[i].firstChild);
    }

    // Construct a full HTML document string including styles for the export
    const contentHtml = clone.innerHTML;

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${examData.name}</title>
          <style>
            body { font-family: "TH SarabunPSK", "Sarabun", "TH Sarabun New", sans-serif; font-size: 18px; line-height: 1.5; }
            table, td { margin: 0; padding: 0; }
            .a4-page { width: 100%; page-break-after: always; padding: 50px; }
            .question-block { margin-bottom: 24px; page-break-inside: avoid; }
            .scenario-block { margin-bottom: 12px; padding: 12px; border: 2px solid #ccc; background-color: #f9fafb; border-radius: 8px; }
            .choices { margin-left: 20px; }
            .choice { margin-bottom: 8px; }
            img { max-width: 100%; height: auto; }
            .cover-page { page-break-after: always; text-align: center; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .mt-16 { margin-top: 64px; }
            .mt-20 { margin-top: 80px; }
            .font-bold { font-weight: bold; }
            hr { border-top: 2px solid black; margin: 24px 0; }
          </style>
        </head>
        <body>
          ${contentHtml}
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

  const renderQuestionBlock = (q, idx) => {
    const prevGroup = idx > 0 ? sortedQuestions[idx - 1].group?.id : null;
    const showGroupHeader = q.group && q.group.id !== prevGroup;

    return (
      <div key={q.id} className="mb-6 break-inside-avoid question-block" style={{ pageBreakInside: 'avoid' }}>
        {showGroupHeader && (
          <div className="mb-3 p-3 border-2 border-gray-300 rounded bg-gray-50 scenario-block" style={{ border: '2px solid #ccc', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold uppercase">Scenario</span>
              {q._groupRange && (
                <span className="text-sm font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                  ใช้กับโจทย์ข้อ {q._groupRange.start} - {q._groupRange.end}
                </span>
              )}
            </div>
            {q.group.text && <div className="mb-2">{renderTextWithMath(q.group.text)}</div>}
            {q.group.image_url && <img src={q.group.image_url} alt="Group" className="mt-2 block bg-white" style={{ width: '270px', height: '150px', objectFit: 'contain' }} />}
          </div>
        )}

        <div className="flex items-start gap-3 mb-2">
          <span className="font-bold whitespace-nowrap">{idx + 1}.</span>
          <div className="flex-1">
            {renderTextWithMath(q.text)}
            {q.image_url && <img src={q.image_url} alt="Question" className="mt-2 block bg-white" style={{ width: '270px', height: '150px', objectFit: 'contain' }} />}
          </div>
        </div>

        <div className="pl-6 space-y-2 choices">
          {q.choices && q.choices.map((c, cIdx) => (
            <div key={c.id} className="flex items-start gap-2 choice">
              <span className="font-semibold">{String.fromCharCode(65 + cIdx)}.</span>
              <div className="flex-1">
                {renderTextWithMath(c.text)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-[1200px] flex flex-col h-[95vh] border border-slate-200 dark:border-slate-700">

        {/* Header Controls */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
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
              disabled={isMeasuring}
              className={`flex items-center gap-2 px-4 py-2 text-white font-semibold rounded-xl transition-colors ${isMeasuring ? 'bg-gray-400 cursor-not-allowed' : 'bg-zense-navy dark:bg-blue-600 hover:bg-blue-800 dark:hover:bg-blue-500'}`}
            >
              {format === 'pdf' ? <Printer size={18} /> : <FileDown size={18} />}
              {isMeasuring ? 'Calculating...' : `${t('exam.export', 'Export')} ${format.toUpperCase()}`}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar for Inputs */}
          <div className="w-80 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto shrink-0 bg-white dark:bg-slate-900">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-white">ตั้งค่าปกข้อสอบ</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">มหาวิทยาลัย / โรงเรียน</label>
                <input type="text" className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={university} onChange={e => setUniversity(e.target.value)} placeholder="เช่น มหาวิทยาลัยมหาสารคาม" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">คณะ / สาขา / สำนักวิชา</label>
                <input type="text" className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={faculty} onChange={e => setFaculty(e.target.value)} placeholder="เช่น สำนักศึกษาทั่วไป" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">ภาคการศึกษาที่</label>
                  <input type="text" className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={semester} onChange={e => setSemester(e.target.value)} placeholder="1" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-slate-500 mb-1">ปีการศึกษา</label>
                  <input type="text" className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2567" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">รหัสวิชา</label>
                <input type="text" className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={courseCode} onChange={e => setCourseCode(e.target.value)} placeholder="GEIT101" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">ชื่อรายวิชา</label>
                <input type="text" className="w-full p-2 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="เทคโนโลยีสารสนเทศเพื่อการดำรงชีวิต" />
              </div>
            </div>
          </div>

          {/* A4 Preview Area */}
          <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-950 p-4 sm:p-8 custom-scrollbar flex justify-center items-start">

            {/* Visual Scaling Wrapper for smaller screens */}
            <div className="transform-gpu origin-top scale-[0.6] sm:scale-[0.8] md:scale-90 lg:scale-100 transition-transform pb-20">

              {/* HIDDEN MEASUREMENT CONTAINER */}
              {isMeasuring && (
                <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1000, width: `${CONTENT_WIDTH}px`, fontFamily: '"TH SarabunPSK", "Sarabun", "TH Sarabun New", sans-serif', fontSize: '18px' }}>
                  <div ref={measureRef} style={{ width: columns === 1 ? '100%' : `${COLUMN_WIDTH}px` }}>
                    {sortedQuestions && sortedQuestions.map((q, idx) => renderQuestionBlock(q, idx))}
                  </div>
                </div>
              )}

              {/* PRINTABLE AREA */}
              <div ref={printRef} className="print-area text-black" style={{ fontFamily: '"TH SarabunPSK", "Sarabun", "TH Sarabun New", sans-serif', fontSize: '18px', color: 'black' }}>

                {/* 1. Cover Page */}
                <div className="a4-page cover-page bg-white shadow-xl mx-auto mb-8 text-left" style={{ width: `${PAGE_WIDTH}px`, height: `${PAGE_HEIGHT}px`, padding: `${MARGIN}px`, boxSizing: 'border-box' }}>
                  <div className="text-center mb-6">
                    <div className="font-bold" style={{ fontSize: '36px', marginBottom: '8px' }}>{university || '.........................................................'}</div>
                    <div style={{ fontSize: '28px' }}>{faculty || '.........................................................'}</div>
                  </div>

                  <div className="flex justify-between mb-4 text-base">
                    <div>ภาคการศึกษาที่ {semester || '.........'} ปีการศึกษา {academicYear || '.........'}</div>
                  </div>

                  <div className="flex justify-between mb-4 text-base">
                    <div>รหัสวิชา : {courseCode || '.........'}</div>
                    <div>ชื่อรายวิชา : {courseName || '...................................................'}</div>
                  </div>
                  <hr className="border-t-2 border-black mb-6" />

                  <div className="flex items-baseline mb-4 text-base w-full">
                    <span className="whitespace-nowrap">ชื่อ - นามสกุล&nbsp;</span>
                    <span className="text-gray-500 tracking-widest overflow-hidden">..................................................................................................</span>
                  </div>
                  <div className="flex justify-between mb-4 text-base gap-8">
                    <div className="flex items-baseline flex-1">
                      <span className="whitespace-nowrap">รหัสประจำตัวนิสิต&nbsp;</span>
                      <span className="text-gray-500 tracking-widest overflow-hidden">...............................................</span>
                    </div>
                    <div className="flex items-baseline w-[40%]">
                      <span className="whitespace-nowrap">กลุ่มเรียน&nbsp;</span>
                      <span className="text-gray-500 tracking-widest overflow-hidden">......................................</span>
                    </div>
                  </div>
                  <div className="flex justify-between mb-6 text-base gap-8">
                    <div className="flex items-baseline flex-1">
                      <span className="whitespace-nowrap">วันที่สอบ&nbsp;</span>
                      <span className="text-gray-500 tracking-widest overflow-hidden">.........................................................</span>
                    </div>
                    <div className="flex items-baseline w-[40%]">
                      <span className="whitespace-nowrap">ห้องสอบ&nbsp;</span>
                      <span className="text-gray-500 tracking-widest overflow-hidden">.......................................</span>
                    </div>
                  </div>
                  <hr className="border-t-2 border-black mb-6" />

                  <div className="text-base mb-6">
                    <div className="font-bold mb-3" style={{ fontSize: '28px' }}>คำชี้แจง</div>
                    <ol className="list-decimal pl-8 space-y-3" style={{ lineHeight: '1.6' }}>
                      <li>ข้อสอบมีทั้งหมด {paginatedPages.length} หน้า จำนวน {sortedQuestions?.length || 0} ข้อ</li>
                      <li>ให้นิสิตตรวจสอบความครบถ้วนของข้อสอบก่อนเริ่มทำ หากพบว่าข้อสอบไม่ครบหรือชำรุด ให้แจ้งกรรมการคุมสอบทันทีห้ามเปิดข้อสอบจนกว่าจะได้รับอนุญาตจากกรรมการคุมสอบ</li>
                      <li>ข้อสอบเป็น ข้อสอบปรนัยแบบเลือกตอบ (Multiple Choice) ให้เลือกคำตอบที่ถูกต้องที่สุดเพียง 1 คำตอบในแต่ละข้อ ห้ามนำเอกสารหรืออุปกรณ์สื่อสารเข้าห้องสอบ</li>
                      <li>เมื่อหมดเวลาสอบให้นิสิตส่งข้อสอบและกระดาษคำตอบ</li>
                      <li>ห้ามนำเอกสาร หนังสือ โทรศัพท์มือถือ หรืออุปกรณ์สื่อสารทุกชนิดเข้าห้องสอบ</li>
                      <li>ห้ามเปิดข้อสอบจนกว่าจะได้รับอนุญาตจากกรรมการคุมสอบ</li>
                    </ol>
                  </div>

                  <div className="text-center font-bold" style={{ marginTop: '20px', marginBottom: '20px', fontSize: '24px' }}>
                    ***ห้ามนำข้อสอบออกนอกห้องสอบโดยเด็ดขาด***
                  </div>

                  <div className="flex justify-end text-base mt-8">
                    <div className="text-center w-[250px]">
                      <div className="mb-3">สำหรับกรรมการคุมสอบ</div>
                      <div className="mb-2 whitespace-nowrap flex items-baseline">
                        <span>ลงชื่อ</span>
                        <span className="text-gray-500 tracking-widest ml-2 overflow-hidden">...................................................</span>
                      </div>
                      <div>(...................................................)</div>
                    </div>
                  </div>
                </div>

                {/* 2. Question Pages */}
                {!isMeasuring && paginatedPages.map((pageCols, pIdx) => (
                  <div key={pIdx} className="a4-page question-page bg-white shadow-xl mx-auto mb-8 text-left" style={{ width: `${PAGE_WIDTH}px`, height: `${PAGE_HEIGHT}px`, padding: `${MARGIN}px`, boxSizing: 'border-box' }}>

                    {/* Header for question pages */}
                    <div className="flex justify-between items-center mb-6 text-gray-500 border-b border-gray-300 pb-2 text-sm">
                      <div>{courseCode} {courseName}</div>
                      <div>หน้า {pIdx + 1} / {paginatedPages.length}</div>
                    </div>

                    <div className="flex column-container" style={{ gap: `${GAP}px`, height: `${CONTENT_HEIGHT - 60}px` }}>
                      {pageCols.map((colItems, cIdx) => (
                        <div key={cIdx} className="column flex-1" style={{ width: columns === 1 ? '100%' : `${COLUMN_WIDTH}px` }}>
                          {colItems.map((q) => renderQuestionBlock(q, q.originalIndex))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperPreviewModal;
