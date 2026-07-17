import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Printer, FileDown, Columns } from 'lucide-react';
import { renderTextWithMath } from './QuestionComponents';

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
    
    // Give the DOM a moment to render the hidden elements before measuring
    const timer = setTimeout(() => {
      if (!measureRef.current) return;
      
      const questionEls = Array.from(measureRef.current.children);
      
      let pages = [];
      let currentCols = columns === 1 ? [[]] : [[], []];
      let currentHeight = 0;
      let currentColIdx = 0;
      
      questionEls.forEach((el, index) => {
        const qObj = examData.questions[index];
        // Get full height including margins
        const style = window.getComputedStyle(el);
        const marginTop = parseFloat(style.marginTop) || 0;
        const marginBottom = parseFloat(style.marginBottom) || 0;
        const totalH = el.getBoundingClientRect().height + marginTop + marginBottom;

        if (currentHeight + totalH > CONTENT_HEIGHT) {
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
    
    return () => clearTimeout(timer);
  }, [isOpen, examData, columns]);

  if (!isOpen || !examData) return null;

  const handlePrintPdf = () => {
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
            body { font-family: "Sarabun", "TH Sarabun New", sans-serif; font-size: 24px; line-height: 1.5; }
            .a4-page { width: 100%; page-break-after: always; padding: 50px; }
            .question-block { margin-bottom: 24px; page-break-inside: avoid; }
            .scenario-block { margin-bottom: 12px; padding: 12px; border: 2px solid #ccc; background-color: #f9fafb; border-radius: 8px; }
            .choices { margin-left: 20px; }
            .choice { margin-bottom: 8px; }
            img { max-width: 100%; height: auto; }
            .cover-page { page-break-after: always; text-align: center; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .justify-end { justify-content: flex-end; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 16px; }
            .mb-6 { margin-bottom: 24px; }
            .mb-8 { margin-bottom: 32px; }
            .mt-16 { margin-top: 64px; }
            .mt-20 { margin-top: 80px; }
            .text-lg { font-size: 36px; }
            .text-base { font-size: 24px; }
            .font-bold { font-weight: bold; }
            hr { border-top: 2px solid black; margin: 24px 0; }
            .column-container { display: flex; gap: ${GAP}px; }
            .column { flex: 1; }
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
    const prevGroup = idx > 0 ? examData.questions[idx - 1].group?.id : null;
    const showGroupHeader = q.group && q.group.id !== prevGroup;

    return (
      <div key={q.id} className="mb-6 break-inside-avoid question-block" style={{ pageBreakInside: 'avoid' }}>
        {showGroupHeader && (
          <div className="mb-3 p-3 border-2 border-gray-300 rounded bg-gray-50 scenario-block">
            <h4 className="font-bold mb-2 uppercase">Scenario</h4>
            {q.group.text && <div className="mb-2">{renderTextWithMath(q.group.text)}</div>}
            {q.group.image_url && <img src={q.group.image_url} alt="Group" className="max-w-full h-auto mt-2" />}
          </div>
        )}
        
        <div className="flex items-start gap-3 mb-2">
          <span className="font-bold whitespace-nowrap">{idx + 1}.</span>
          <div className="flex-1">
            {renderTextWithMath(q.text)}
            {q.image_url && <img src={q.image_url} alt="Question" className="max-w-full h-auto mt-2 block" />}
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-2 sm:p-4 print-wrapper">
      
      {/* CSS for printing A4 layout */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Reset everything for printing */
          body, html { height: auto !important; overflow: visible !important; }
          body * { visibility: hidden; }
          .print-wrapper { 
             position: absolute !important; 
             inset: auto !important; 
             left: 0 !important; 
             top: 0 !important;
             width: 100% !important; 
             height: auto !important; 
             background: transparent !important;
             padding: 0 !important;
             margin: 0 !important;
             display: block !important;
          }
          .print-wrapper * { visibility: visible; }
          .hide-on-print { display: none !important; }
          .print-area { position: relative !important; width: 100%; display: block !important; }
          .a4-page {
             width: ${PAGE_WIDTH}px !important; 
             height: ${PAGE_HEIGHT}px !important; 
             margin: 0 auto !important;
             page-break-after: always !important;
             page-break-inside: avoid !important;
             box-shadow: none !important;
             border: none !important;
          }
          @page {
             size: A4 portrait;
             margin: 0;
          }
        }
      `}} />

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] lg:max-w-[1200px] flex flex-col h-[95vh] border border-slate-200 dark:border-slate-700 print-modal-inner hide-on-print">
        
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
                <div style={{ position: 'absolute', visibility: 'hidden', zIndex: -1000, width: `${CONTENT_WIDTH}px`, fontFamily: '"Sarabun", "TH Sarabun New", sans-serif', fontSize: '24px' }}>
                  <div ref={measureRef} style={{ width: columns === 1 ? '100%' : `${COLUMN_WIDTH}px` }}>
                    {examData.questions && examData.questions.map((q, idx) => renderQuestionBlock(q, idx))}
                  </div>
                </div>
              )}

              {/* PRINTABLE AREA */}
              <div ref={printRef} className="print-area font-sarabun text-black" style={{ fontFamily: '"Sarabun", "TH Sarabun New", sans-serif', fontSize: '24px', color: 'black' }}>
                
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
                  
                  <div className="mb-4 text-base">
                    ชื่อ - นามสกุล ....................................................................................................................................
                  </div>
                  <div className="flex justify-between mb-4 text-base">
                    <div>รหัสประจำตัวนิสิต................................................................</div>
                    <div>กลุ่มเรียน .....................................................</div>
                  </div>
                  <div className="flex justify-between mb-6 text-base">
                    <div>วันที่สอบ ........................................................................</div>
                    <div>ห้องสอบ .....................................................</div>
                  </div>
                  <hr className="border-t-2 border-black mb-6" />
                  
                  <div className="text-base mb-6">
                    <div className="font-bold mb-3" style={{ fontSize: '28px' }}>คำชี้แจง</div>
                    <ol className="list-decimal pl-8 space-y-3" style={{ lineHeight: '1.6' }}>
                      <li>ข้อสอบมีทั้งหมด {paginatedPages.length} หน้า จำนวน {examData.questions?.length || 0} ข้อ</li>
                      <li>ให้นิสิตตรวจสอบความครบถ้วนของข้อสอบก่อนเริ่มทำ หากพบว่าข้อสอบไม่ครบหรือชำรุด ให้แจ้งกรรมการคุมสอบทันทีห้ามเปิดข้อสอบจนกว่าจะได้รับอนุญาตจากกรรมการคุมสอบ</li>
                      <li>ข้อสอบเป็น ข้อสอบปรนัยแบบเลือกตอบ (Multiple Choice) ให้เลือกคำตอบที่ถูกต้องที่สุดเพียง 1 คำตอบในแต่ละข้อ ห้ามนำเอกสารหรืออุปกรณ์สื่อสารเข้าห้องสอบ</li>
                      <li>เมื่อหมดเวลาสอบให้นิสิตส่งข้อสอบและกระดาษคำตอบ</li>
                      <li>ห้ามนำเอกสาร หนังสือ โทรศัพท์มือถือ หรืออุปกรณ์สื่อสารทุกชนิดเข้าห้องสอบ</li>
                      <li>ห้ามเปิดข้อสอบจนกว่าจะได้รับอนุญาตจากกรรมการคุมสอบ</li>
                    </ol>
                  </div>
                  
                  <div className="text-center font-bold" style={{ marginTop: '60px', marginBottom: '60px', fontSize: '28px' }}>
                    ***ห้ามนำข้อสอบออกนอกห้องสอบโดยเด็ดขาด***
                  </div>
                  
                  <div className="flex justify-end text-base mt-12">
                    <div className="text-center">
                      <div className="mb-3">สำหรับกรรมการคุมสอบ</div>
                      <div className="mb-2">ลงชื่อ...................................................</div>
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
