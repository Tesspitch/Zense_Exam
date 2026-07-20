import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../../../utils/api';
import {
  Plus, Laptop, Calendar, FileText, HelpCircle,
  Clock, Users, TrendingUp, Edit, Download,
  Trash2, Copy, X, Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { renderTextWithMath } from '../../component/QuestionComponents';
import PaperPreviewModal from '../../component/PaperPreviewModal';
import ConfirmModal from '../../component/ConfirmModal';

const ExamTeacher = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [selectedSubjectsFilter, setSelectedSubjectsFilter] = useState([]);
  const [modalForm, setModalForm] = useState({
    name: '',
    description: '',
    exam_type: 'online',
    date_exam: '',
    time_start: '',
    time_end: '',
    easy_count: 0,
    medium_count: 0,
    hard_count: 0,
    duration: 0,
    export_format: 'pdf',
    columns: 1
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [availableCounts, setAvailableCounts] = useState({ easy: 0, medium: 0, hard: 0 });

  // Action Modals State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showPaperPreview, setShowPaperPreview] = useState(false);
  const [paperExamData, setPaperExamData] = useState(null);
  const [paperSettings, setPaperSettings] = useState({ format: 'pdf', columns: 1 });

  const [currentExam, setCurrentExam] = useState(null);
  const [examDetails, setExamDetails] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDanger: false,
    confirmText: 'ยืนยัน',
  });

  const showConfirm = (options) => {
    setConfirmState({
      isOpen: true,
      title: options.title || 'Confirm',
      message: options.message || 'Are you sure?',
      onConfirm: options.onConfirm || (() => {}),
      isDanger: options.isDanger || false,
      confirmText: options.confirmText || 'ยืนยัน',
    });
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    exam_type: 'online',
    date_exam: '',
    time_start: '',
    time_end: ''
  });

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No auth token');
      const res = await api.get('/api/teacher/exams/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExams(res.data.exams || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/api/teacher/courses/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchCourses();
  }, []);

  // Fetch question counts whenever selectedCourses changes
  useEffect(() => {
    const fetchQuestionCounts = async () => {
      if (selectedCourses.length === 0) {
        setAvailableCounts({ easy: 0, medium: 0, hard: 0 });
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const res = await api.post('/api/teacher/exams/question-counts/', {
          courses: selectedCourses
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAvailableCounts(res.data);
      } catch (err) {
        console.error('Failed to fetch question counts', err);
      }
    };
    fetchQuestionCounts();
  }, [selectedCourses]);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openModal = () => {
    setModalForm({
      name: '', description: '', exam_type: 'online',
      date_exam: '', time_start: '', time_end: '',
      easy_count: 0, medium_count: 0, hard_count: 0, duration: 0, num_sets: 1
    });
    setSelectedCourses([]);
    setSelectedSubjectsFilter([]);
    setIsSubjectDropdownOpen(false);
    setAvailableCounts({ easy: 0, medium: 0, hard: 0 });
    setModalError('');
    setShowModal(true);
  };

  const toggleCourse = (chap_id) => {
    setSelectedCourses(prev =>
      prev.includes(chap_id) ? prev.filter(id => id !== chap_id) : [...prev, chap_id]
    );
  };

  const toggleSubjectFilter = (sjName) => {
    setSelectedSubjectsFilter(prev => 
      prev.includes(sjName) ? prev.filter(s => s !== sjName) : [...prev, sjName]
    );
  };

  const uniqueSubjects = [...new Set(courses.map(c => c.sj_name || 'Other'))];

  const handleModalInput = (e) => {
    const { name, value } = e.target;
    setModalForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'time_start' || name === 'time_end') {
        if (next.time_start && next.time_end) {
          const start = new Date(`2000-01-01T${next.time_start}`);
          let end = new Date(`2000-01-01T${next.time_end}`);
          if (end < start) {
            end.setDate(end.getDate() + 1); // Handle crossing midnight
          }
          const diffMins = Math.round((end - start) / 60000);
          next.duration = diffMins;
        }
      }
      return next;
    });
  };

  const handleGenerateExam = async () => {
    setModalError('');
    if (!modalForm.name.trim()) {
      setModalError(t('exam.errorNoTitle', 'Please enter an exam title.'));
      return;
    }
    if (selectedCourses.length === 0) {
      setModalError(t('exam.errorNoCourse', 'Please select at least one course to draw questions from.'));
      return;
    }
    const total = Number(modalForm.easy_count) + Number(modalForm.medium_count) + Number(modalForm.hard_count);
    if (total === 0) {
      setModalError(t('exam.errorNoQuestions', 'Please specify at least one question.'));
      return;
    }

    showConfirm({
      title: 'ยืนยันการสร้างข้อสอบ',
      message: 'คุณต้องการสร้างชุดข้อสอบตามรายละเอียดที่กำหนดใช่หรือไม่?',
      confirmText: 'สร้างข้อสอบ',
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const token = localStorage.getItem('token');
          const res = await api.post('/api/teacher/exams/', {
            name: modalForm.name,
            description: modalForm.description,
            exam_type: modalForm.exam_type,
            courses: selectedCourses,
            easy_count: Number(modalForm.easy_count),
            medium_count: Number(modalForm.medium_count),
            hard_count: Number(modalForm.hard_count),
            duration: Number(modalForm.duration),
            num_sets: Number(modalForm.num_sets) || 1,
            date_exam: modalForm.exam_type === 'online' ? modalForm.date_exam : null,
            time_start: modalForm.exam_type === 'online' ? modalForm.time_start : null,
            time_end: modalForm.exam_type === 'online' ? modalForm.time_end : null
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          fetchExams();
          
          if (modalForm.exam_type === 'paper') {
            // Fetch generated exam details for preview
            const examId = res.data.exam_id;
            try {
              const detailRes = await api.get(`/api/teacher/exams/${examId}/`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setPaperExamData(detailRes.data);
              setPaperSettings({ format: modalForm.export_format, columns: Number(modalForm.columns) });
              setShowPaperPreview(true);
            } catch (fetchErr) {
              console.error('Failed to fetch paper exam details for preview:', fetchErr);
              alert('Failed to load paper preview.');
            }
          } else {
            setShowModal(false);
          }
          
        } catch (err) {
          console.error(err);
          setModalError(err.response?.data?.error || t('exam.errorCreate', 'Failed to create exam'));
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleEditClick = async (exam) => {
    setActionLoading(true);
    setCurrentExam(exam);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/teacher/exams/${exam.online_exam_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditForm({
        name: res.data.name,
        description: res.data.description,
        exam_type: res.data.exam_type,
        date_exam: res.data.date_exam,
        time_start: res.data.time_start,
        time_end: res.data.time_end
      });
      setShowEditModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load exam details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    showConfirm({
      title: 'ยืนยันการแก้ไข',
      message: 'คุณต้องการบันทึกการเปลี่ยนแปลงนี้ใช่หรือไม่?',
      confirmText: 'บันทึก',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await api.put(`/api/teacher/exams/${currentExam.online_exam_id}/`, editForm, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setShowEditModal(false);
          fetchExams();
        } catch (err) {
          console.error(err);
          alert('Failed to update exam');
        }
      }
    });
  };

  const handleViewClick = async (exam) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/teacher/exams/${exam.online_exam_id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExamDetails(res.data);
      setShowViewModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load exam details');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResultsClick = async (exam) => {
    setActionLoading(true);
    setCurrentExam(exam);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/teacher/exams/${exam.online_exam_id}/results/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExamResults(res.data.results || []);
      setShowResultsModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load exam results');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = async (exam) => {
    showConfirm({
      title: 'ยืนยันการลบข้อสอบ',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อสอบนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      isDanger: true,
      confirmText: 'ลบข้อสอบ',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          await api.delete(`/api/teacher/exams/${exam.online_exam_id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchExams();
        } catch (err) {
          console.error(err);
          alert('Failed to delete exam');
        }
      }
    });
  };

  const totalQuestions = Number(modalForm.easy_count) + Number(modalForm.medium_count) + Number(modalForm.hard_count);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('exam.title', 'Exams')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('exam.subtitle', 'Create and manage your exams')}</p>
        </div>
        <button
          onClick={openModal}
          className="w-full sm:w-auto justify-center bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          {t('exam.createExam', 'Create Exam')}
        </button>
      </div>

      {error && <div className="mb-4 text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">{error}</div>}

      {/* Exam List */}
      {loading ? (
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
          {t('common.loading', 'Loading...')}
        </div>
      ) : (
        <div className="space-y-6">
          {exams.length === 0 && !error && (
            <div className="text-center text-slate-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              {t('exam.noExams', 'No exams found. Click "Create Exam" to get started.')}
            </div>
          )}

          {exams.map((exam) => (
            <div key={exam.online_exam_id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header & Status */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold text-xl text-slate-800 dark:text-white">{exam.online_exam_name}</h3>
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      {exam.exam_type === 'paper' ? (
                        <>
                          <Printer size={14} />
                          {t('exam.paperExam', 'Paper')}
                        </>
                      ) : (
                        <>
                          <Laptop size={14} />
                          {t('exam.online', 'Online')}
                        </>
                      )}
                    </span>
                  </div>
                  {exam.exam_type !== 'paper' && (
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-lg ${exam.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                      {exam.status}
                    </span>
                  )}
                </div>

                {/* Sources & Description */}
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{t('exam.sources', 'Sources')}:</span> {exam.sources}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{exam.description}</p>
                </div>

                {/* Schedule & Copy Code */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  {exam.exam_type === 'paper' ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <FileText size={16} />
                      <span>{t('exam.paperExamGenerated', 'Paper exam generated')}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar size={16} />
                        <span>{exam.schedule || t('exam.noSchedule', 'No schedule set')}</span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-4 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider block mb-0.5">{t('exam.examCode', 'Exam Code')}</span>
                          <span className="font-bold text-zense-navy dark:text-blue-400 tracking-wide">{exam.online_exam_pass}</span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(exam.online_exam_pass)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1.5"
                          title="Copy Code"
                        >
                          <Copy size={16} />
                          <span className="text-xs font-medium">{copiedCode === exam.online_exam_pass ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Difficulty Breakdown */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-3">
                    <span className="text-xs font-medium text-green-600 dark:text-green-500 block mb-1">{t('exam.easy', 'Easy')}</span>
                    <span className="text-xl font-bold text-green-700 dark:text-green-400">{exam.difficulty?.easy || 0}</span>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-500 block mb-1">{t('exam.medium', 'Medium')}</span>
                    <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{exam.difficulty?.medium || 0}</span>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
                    <span className="text-xs font-medium text-red-600 dark:text-red-500 block mb-1">{t('exam.hard', 'Hard')}</span>
                    <span className="text-xl font-bold text-red-700 dark:text-red-400">{exam.difficulty?.hard || 0}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <HelpCircle size={16} className="text-slate-400 mb-2" />
                    <div className="font-bold text-slate-800 dark:text-white text-lg">{exam.total_questions}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('exam.totalQuestions', 'Total Questions')}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <Clock size={16} className="text-slate-400 mb-2" />
                    <div className="font-bold text-slate-800 dark:text-white text-lg">{exam.duration} {t('common.min', 'min')}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('exam.duration', 'Duration')}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <FileText size={16} className="text-slate-400 mb-2" />
                    <div className="font-bold text-slate-800 dark:text-white text-lg">{exam.students}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.studentsEnrolled', 'Students')}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <TrendingUp size={16} className="text-slate-400 mb-2" />
                    <div className="font-bold text-slate-800 dark:text-white text-lg">{exam.avg_score !== null ? `${exam.avg_score}%` : 'N/A'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{t('dashboard.avgScore', 'Avg Score')}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleResultsClick(exam)}
                    disabled={actionLoading}
                    className="flex-1 min-w-[120px] bg-zense-navy dark:bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-900 dark:hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Users size={16} />
                    {t('exam.results', 'Results')}
                  </button>
                  <button
                    onClick={() => handleEditClick(exam)}
                    disabled={actionLoading}
                    className="flex-1 min-w-[100px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Edit size={16} />
                    {t('common.edit', 'Edit')}
                  </button>
                  <button
                    onClick={() => handleViewClick(exam)}
                    disabled={actionLoading}
                    className="flex-1 min-w-[100px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-medium py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FileText size={16} />
                    {t('exam.viewExam', 'View Exam')}
                  </button>
                  {!exam.is_active && (
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          const token = localStorage.getItem('token');
                          const res = await api.get(`/api/teacher/exams/${exam.online_exam_id}/`, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          setPaperExamData(res.data);
                          setPaperSettings({ format: 'pdf', columns: 1 });
                          setShowPaperPreview(true);
                        } catch (err) {
                          console.error(err);
                          alert('Failed to load exam details for export');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="flex-1 min-w-[100px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Download size={16} />
                      {t('exam.export', 'Export')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(exam)}
                    disabled={actionLoading}
                    className="flex-1 min-w-[100px] text-red-500 dark:text-red-400 text-sm font-medium py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    {t('common.delete', 'Delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== GENERATE NEW EXAM MODAL ========== */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('exam.generateNewExam', 'Generate New Exam')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t('exam.generateSubtitle', 'Configure exam settings and question distribution')}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-sm">
                  {modalError}
                </div>
              )}

              {/* Exam Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.examTitle', 'Exam Title')}</label>
                <input
                  type="text"
                  name="name"
                  value={modalForm.name}
                  onChange={handleModalInput}
                  placeholder={t('exam.examTitlePlaceholder', 'e.g., Mathematics Final Exam')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Sources / Course */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('exam.sourcesCourse', 'Sources / Course (Select one or more)')}</label>
                
                {courses.length === 0 ? (
                  <span className="text-sm text-slate-400">{t('exam.noCoursesAvailable', 'No courses available')}</span>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <div 
                        onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm cursor-pointer flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <span>
                          {selectedSubjectsFilter.length === 0 
                            ? 'กรุณาเลือกวิชาที่ต้องการ' 
                            : `เลือกแล้ว ${selectedSubjectsFilter.length} วิชา`}
                        </span>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                      
                      {isSubjectDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                          {uniqueSubjects.map(sjName => (
                            <label key={sjName} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0">
                              <input 
                                type="checkbox" 
                                checked={selectedSubjectsFilter.includes(sjName)}
                                onChange={() => toggleSubjectFilter(sjName)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{sjName}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 mb-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {selectedSubjectsFilter.length === 0 ? (
                        <div className="text-center py-6 text-sm text-slate-500">กรุณาเลือกวิชาจาก Dropdown เพื่อแสดงคอร์ส</div>
                      ) : Object.entries(
                        courses.filter(c => {
                          return selectedSubjectsFilter.includes(c.sj_name || 'Other');
                        }).reduce((acc, c) => {
                          const sjName = c.sj_name || 'Other';
                          if (!acc[sjName]) acc[sjName] = [];
                          acc[sjName].push(c);
                          return acc;
                        }, {})
                      ).map(([sjName, sjCourses]) => (
                        <div key={sjName} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{sjName}</div>
                          <div className="flex flex-wrap gap-2">
                            {sjCourses.map(c => {
                              const isSelected = selectedCourses.includes(c.chap_id);
                              return (
                                <button
                                  key={c.chap_id}
                                  type="button"
                                  onClick={() => toggleCourse(c.chap_id)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${isSelected
                                    ? 'bg-zense-navy dark:bg-blue-600 text-white border-zense-navy dark:border-blue-600 shadow-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                                    }`}
                                >
                                  {c.chap_name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {selectedSubjectsFilter.length > 0 && courses.filter(c => {
                          return selectedSubjectsFilter.includes(c.sj_name || 'Other');
                        }).length === 0 && (
                          <div className="text-center py-6 text-sm text-slate-500">ไม่พบวิชาที่เลือก</div>
                      )}
                    </div>
                  </>
                )}
                {selectedCourses.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">{t('exam.pleaseSelectCourse', 'Please select at least one course to draw questions from.')}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.descriptionOptional', 'Description (optional)')}</label>
                <textarea
                  name="description"
                  rows="2"
                  value={modalForm.description}
                  onChange={handleModalInput}
                  placeholder={t('exam.descriptionPlaceholder', 'Brief description of the exam')}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                ></textarea>
              </div>

              {/* Number of Sets */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">จำนวนชุดข้อสอบ (Number of Sets)</label>
                <input
                  type="number"
                  name="num_sets"
                  min="1"
                  max="10"
                  value={modalForm.num_sets}
                  onChange={handleModalInput}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">แต่ละชุดข้อสอบจะสลับข้ออัตโนมัติเมื่อดูในหน้า Preview (สร้างได้สูงสุด 10 ชุด)</p>
              </div>

              {/* Exam Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('exam.examType', 'Exam Type')}</label>
                <div className="flex gap-4">
                  <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${modalForm.exam_type === 'online'
                    ? 'border-zense-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-slate-200 dark:border-slate-700'
                    }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="exam_type"
                        value="online"
                        checked={modalForm.exam_type === 'online'}
                        onChange={handleModalInput}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                          <Laptop size={16} />
                          {t('exam.onlineExam', 'Online Exam')}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('exam.onlineExamDesc', 'Students take exam online with code')}</p>
                      </div>
                    </div>
                  </label>
                  <label className={`flex-1 cursor-pointer p-4 rounded-xl border-2 transition-all ${modalForm.exam_type === 'paper'
                    ? 'border-zense-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                    : 'border-slate-200 dark:border-slate-700'
                    }`}>
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="exam_type"
                        value="paper"
                        checked={modalForm.exam_type === 'paper'}
                        onChange={handleModalInput}
                        className="mt-1 text-blue-600"
                      />
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                          <Printer size={16} />
                          {t('exam.paperExam', 'Paper Exam')}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('exam.paperExamDesc', 'Export to file for printing')}</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Schedule Row (Only for Online) */}
              {modalForm.exam_type === 'online' && (
                <div>
                  <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.examDate', 'Exam Date')}</label>
                    <input
                      type="date"
                      name="date_exam"
                      value={modalForm.date_exam}
                      onChange={handleModalInput}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.startTime', 'Start Time')}</label>
                    <input
                      type="time"
                      name="time_start"
                      value={modalForm.time_start}
                      onChange={handleModalInput}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.endTime', 'End Time')}</label>
                    <input
                      type="time"
                      name="time_end"
                      value={modalForm.time_end}
                      onChange={handleModalInput}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                    />
                  </div>
                </div>
              </div>
              )}

              {/* Paper Export Options (Only for Paper) */}
              {modalForm.exam_type === 'paper' && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Export Format */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('exam.exportFormat', 'Export Format')}</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 cursor-pointer p-3 rounded-xl border transition-all ${modalForm.export_format === 'pdf'
                        ? 'border-zense-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="export_format"
                            value="pdf"
                            checked={modalForm.export_format === 'pdf'}
                            onChange={handleModalInput}
                            className="text-blue-600"
                          />
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">PDF</span>
                        </div>
                      </label>
                      <label className={`flex-1 cursor-pointer p-3 rounded-xl border transition-all ${modalForm.export_format === 'docx'
                        ? 'border-zense-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="export_format"
                            value="docx"
                            checked={modalForm.export_format === 'docx'}
                            onChange={handleModalInput}
                            className="text-blue-600"
                          />
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">DOCX</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Columns */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('exam.layoutColumns', 'Layout Columns')}</label>
                    <div className="flex gap-4">
                      <label className={`flex-1 cursor-pointer p-3 rounded-xl border transition-all ${modalForm.columns === 1 || modalForm.columns === '1'
                        ? 'border-zense-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="columns"
                            value="1"
                            checked={modalForm.columns == 1}
                            onChange={handleModalInput}
                            className="text-blue-600"
                          />
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">1 Column</span>
                        </div>
                      </label>
                      <label className={`flex-1 cursor-pointer p-3 rounded-xl border transition-all ${modalForm.columns === 2 || modalForm.columns === '2'
                        ? 'border-zense-navy dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                        : 'border-slate-200 dark:border-slate-700'
                        }`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="columns"
                            value="2"
                            checked={modalForm.columns == 2}
                            onChange={handleModalInput}
                            className="text-blue-600"
                          />
                          <span className="font-semibold text-slate-800 dark:text-white text-sm">2 Columns</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Question Distribution */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{t('exam.questionDistribution', 'Question Distribution by Difficulty')}</label>
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-green-600 dark:text-green-400">{t('exam.easyQuestions', 'Easy Questions')}</label>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">max: {availableCounts.easy}</span>
                    </div>
                    <input
                      type="number"
                      name="easy_count"
                      min="0"
                      max={availableCounts.easy}
                      value={modalForm.easy_count}
                      onChange={handleModalInput}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm text-center font-semibold"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-blue-600 dark:text-blue-400">{t('exam.mediumQuestions', 'Medium Questions')}</label>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">max: {availableCounts.medium}</span>
                    </div>
                    <input
                      type="number"
                      name="medium_count"
                      min="0"
                      max={availableCounts.medium}
                      value={modalForm.medium_count}
                      onChange={handleModalInput}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm text-center font-semibold"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-red-600 dark:text-red-400">{t('exam.hardQuestions', 'Hard Questions')}</label>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">max: {availableCounts.hard}</span>
                    </div>
                    <input
                      type="number"
                      name="hard_count"
                      min="0"
                      max={availableCounts.hard}
                      value={modalForm.hard_count}
                      onChange={handleModalInput}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-center font-semibold"
                    />
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{t('exam.totalQuestionsLabel', 'Total Questions')} <strong className="text-slate-800 dark:text-white">{totalQuestions}</strong></span>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.durationMinutes', 'Duration (minutes)')}</label>
                <input
                  type="number"
                  name="duration"
                  min="1"
                  value={modalForm.duration}
                  readOnly
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 focus:outline-none text-sm cursor-not-allowed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <button
                onClick={handleGenerateExam}
                disabled={submitting}
                className="w-full bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('common.loading', 'Loading...')}
                  </>
                ) : (
                  t('exam.generateExam', 'Generate Exam')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('exam.editExam', 'Edit Exam')}</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.examTitle', 'Exam Title')}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.descriptionOptional', 'Description')}</label>
                <textarea
                  rows="2"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white"
                ></textarea>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.examDate', 'Exam Date')}</label>
                  <input
                    type="date"
                    value={editForm.date_exam}
                    onChange={(e) => setEditForm({ ...editForm, date_exam: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.startTime', 'Start Time')}</label>
                  <input
                    type="time"
                    value={editForm.time_start}
                    onChange={(e) => setEditForm({ ...editForm, time_start: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{t('exam.endTime', 'End Time')}</label>
                  <input
                    type="time"
                    value={editForm.time_end}
                    onChange={(e) => setEditForm({ ...editForm, time_end: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleEditSubmit}
                className="w-full bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {t('exam.saveChanges', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      {showViewModal && examDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('exam.viewExam', 'View Exam')}: {examDetails.name}</h2>
              </div>
              <button onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900">
              <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">{t('exam.questionsList', 'Questions List')}</h3>
                <div className="space-y-4">
                  {examDetails.questions.map((q, idx) => {
                    const prevGroup = idx > 0 ? examDetails.questions[idx - 1].group?.id : null;
                    const showGroupHeader = q.group && q.group.id !== prevGroup;

                    return (
                      <div key={q.id} className="mb-4">
                        {showGroupHeader && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-zense-navy dark:border-blue-500 rounded-r-lg mb-4 mt-2">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-sm uppercase tracking-wider">Scenario</h4>
                            {q.group.text && <div className="text-sm text-slate-700 dark:text-slate-300 mb-2">{renderTextWithMath(q.group.text)}</div>}
                            {q.group.image_url && <img src={q.group.image_url} alt="Group" className="max-w-full h-auto rounded-lg mt-2 max-h-48" />}
                          </div>
                        )}
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <div className="font-semibold text-slate-800 dark:text-white flex-1 mr-4 text-base">
                              <span className="mr-2">{idx + 1}.</span>
                              {renderTextWithMath(q.text)}
                              {q.image_url && <img src={q.image_url} alt="Question" className="max-w-full h-auto rounded-lg mt-3 max-h-48 block" />}
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-md font-bold whitespace-nowrap ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                              q.difficulty === 'medium' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                              {q.difficulty.toUpperCase()}
                            </span>
                          </div>
                          <div className="space-y-2 pl-4">
                            {q.choices.map((c, cIdx) => (
                              <div key={c.id} className={`p-3 rounded-lg border flex items-start ${c.isCorrect ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300'}`}>
                                <span className="font-bold mr-3 mt-0.5">{String.fromCharCode(65 + cIdx)}.</span>
                                <div className="flex-1">
                                  {renderTextWithMath(c.text)}
                                </div>
                                {c.isCorrect && (
                                  <span className="ml-3 text-[10px] uppercase font-bold px-2 py-1 bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200 rounded shrink-0">
                                    {t('exam.correctAnswer', 'Correct')}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && currentExam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl border border-slate-200 dark:border-slate-800 my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('exam.examResults', 'Exam Results')}: {currentExam.online_exam_name}</h2>
              </div>
              <button onClick={() => setShowResultsModal(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900">
              {examResults.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  {t('exam.noStudentsTaken', 'No students have taken this exam yet.')}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.studentId', 'Student ID')}</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t('exam.studentName', 'Student Name')}</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t('exam.score', 'Score')}</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t('dashboard.status', 'Status')}</th>
                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 dark:text-slate-300">{t('exam.timeSubmitted', 'Time Submitted')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {examResults.map((res) => (
                        <tr key={res.std_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="px-6 py-4 text-sm text-slate-800 dark:text-white font-medium">{res.std_id}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{res.std_name}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-bold text-zense-navy dark:text-blue-400">{res.percentage}%</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{res.score} / {res.total_questions} {t('exam.points', 'pts')}</div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-2.5 py-1 text-xs font-medium rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                              {res.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                            {res.time_submitted ? new Date(res.time_submitted).toLocaleString('th-TH') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paper Preview Modal */}
      {showPaperPreview && (
        <PaperPreviewModal 
          isOpen={showPaperPreview}
          onClose={() => setShowPaperPreview(false)}
          examData={paperExamData}
          initialFormat={paperSettings.format}
          initialColumns={paperSettings.columns}
        />
      )}

      {/* Global Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        isDanger={confirmState.isDanger}
        confirmText={confirmState.confirmText}
      />
    </div>
  );
};

export default ExamTeacher;
