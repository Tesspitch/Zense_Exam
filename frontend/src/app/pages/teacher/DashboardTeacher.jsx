import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

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

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No auth token');
        const res = await axios.get('http://localhost:8000/api/teacher/dashboard/', {
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

  return (
    <div className="p-6">
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
              <div key={exam.online_exam_id} className="flex items-center justify-between p-3 rounded-md border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{exam.online_exam_name}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{exam.status ? exam.status : ''}</div>
                </div>

                <div className="text-right text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div>{t('dashboard.students', 'Students')} <span className="font-bold text-slate-800 dark:text-slate-100 ml-2">{exam.students ?? '-'}</span></div>
                  <div>{t('dashboard.avgScore', 'Avg Score')} <span className="font-bold text-slate-800 dark:text-slate-100 ml-2">{exam.avg_score ?? '-'}%</span></div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">{exam.next_date ?? exam.created_at}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTeacher;
