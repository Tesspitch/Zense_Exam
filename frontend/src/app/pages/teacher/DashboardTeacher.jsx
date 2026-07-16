import { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../../../utils/api';
import { useTranslation } from 'react-i18next';
import { X, ChevronRight } from 'lucide-react';

const StatCard = ({ title, value, children }) => (
  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
    <div className="text-xs text-slate-400 dark:text-slate-500 mb-2">{title}</div>
    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
    {children}
  </div>
);

const DashboardTeacher = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalsubject: 0,
    totalcourse: 0,
    total_questions: 0,
    active_exams: 0,
    students_enrolled: 0,
    avg_score: 0,
    recent_exams: []
  });

  // Modal State
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentExam, setCurrentExam] = useState(null);
  const [examResults, setExamResults] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const res = await api.get('/api/teacher/dashboard/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = res.data;
        setStats({
          totalsubject: data.totalsubject || 0,
          totalcourse: data.totalcourse || 0,
          total_questions: data.total_questions || 0,
          active_exams: data.active_exams || 0,
          students_enrolled: data.students_enrolled || 0,
          avg_score: data.avg_score || 0,
          recent_exams: data.recent_exams || []
        });
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || err.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleResultsClick = async (exam) => {
    setCurrentExam(exam);
    setShowResultsModal(true);
    setModalLoading(true);
    setExamResults([]);
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/api/teacher/exams/${exam.online_exam_id}/results/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExamResults(res.data.results || []);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch results');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dashboard.title', 'Dashboard')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.subtitle', 'Overview of your teaching activities')}</p>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600 dark:text-red-400">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title={t('dashboard.totalSubjects', 'Total Subjects')} value={stats.totalsubject} />
        <StatCard title={t('dashboard.totalCourses', 'Total Courses')} value={stats.totalcourse} />
        <StatCard title={t('header.questionBank', 'Question Bank')} value={stats.total_questions} />
        <StatCard title={t('dashboard.activeExams', 'Active Exams')} value={stats.active_exams} />
        <StatCard title={t('dashboard.studentsEnrolled', 'Students Enrolled')} value={stats.students_enrolled} />
        <StatCard title={t('dashboard.avgScore', 'Avg Score')} value={`${stats.avg_score}%`} />
      </div>

      <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">{t('dashboard.recentExams', 'Recent Exams')}</h2>
        {loading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-3">
            {stats.recent_exams.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.noRecentExams', 'No recent exams')}</div>}
            {stats.recent_exams.map((exam) => (
              <div 
                key={exam.online_exam_id} 
                onClick={() => handleResultsClick(exam)}
                className="group flex items-center justify-between p-3 rounded-md border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {exam.online_exam_name}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{exam.status ? exam.status : ''}</div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right text-sm text-slate-600 dark:text-slate-300 space-y-1">
                    <div>{t('dashboard.students', 'Students')} <span className="font-bold text-slate-800 dark:text-slate-100 ml-2">{exam.students ?? '-'}</span></div>
                    <div>{t('dashboard.avgScore', 'Avg Score')} <span className="font-bold text-slate-800 dark:text-slate-100 ml-2">{exam.avg_score ?? '-'}%</span></div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{exam.next_date ?? exam.created_at}</div>
                  </div>
                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
              {modalLoading ? (
                <div className="text-center py-12 text-slate-500">Loading results...</div>
              ) : examResults.length === 0 ? (
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
    </div>
  );
};

export default DashboardTeacher;
