import { useEffect, useState } from 'react';
import axios from 'axios';

const StatCard = ({ title, value, children }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
    <div className="text-xs text-slate-400 mb-2">{title}</div>
    <div className="text-2xl font-bold text-slate-800">{value}</div>
    {children}
  </div>
);

const DashboardTeacher = () => {
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
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of your teaching activities</p>
        </div>
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Subjects" value={stats.totalsubject} />
        <StatCard title="Total Courses" value={stats.totalcourse} />
        <StatCard title="Question Bank" value={stats.total_questions} />
        <StatCard title="Active Exams" value={stats.active_exams} />
        <StatCard title="Students Enrolled" value={stats.students_enrolled} />
        <StatCard title="Avg Score" value={`${stats.avg_score}%`} />
      </div>

      <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-lg font-semibold mb-4">Recent Exams</h2>
        {loading ? (
          <div className="text-sm text-slate-400">Loading...</div>
        ) : (
          <div className="space-y-3">
            {stats.recent_exams.length === 0 && <div className="text-sm text-slate-500">No recent exams</div>}
            {stats.recent_exams.map((exam) => (
              <div key={exam.online_exam_id} className="flex items-center justify-between p-3 rounded-md border border-slate-100">
                <div>
                  <div className="font-semibold text-slate-800">{exam.online_exam_name}</div>
                  <div className="text-xs text-slate-400">{exam.status ? exam.status : ''}</div>
                </div>

                <div className="text-right text-sm text-slate-600 space-y-1">
                  <div>Students <span className="font-bold text-slate-800 ml-2">{exam.students ?? '-'}</span></div>
                  <div>Avg Score <span className="font-bold text-slate-800 ml-2">{exam.avg_score ?? '-'}%</span></div>
                  <div className="text-xs text-slate-400">{exam.next_date ?? exam.created_at}</div>
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
