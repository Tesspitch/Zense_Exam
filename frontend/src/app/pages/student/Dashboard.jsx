import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const StudentDashboard = () => {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/student/dashboard/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setData(response.data);
      } catch (err) {
        console.error("Error fetching data", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(err.response?.data?.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-zense-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="text-red-500 font-bold text-xl">{error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-zense-navy dark:bg-blue-600 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Section 1: Welcome Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
          Welcome Back, {data?.student_name || 'Student'}!
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your learning progress</p>
      </div>

      {/* Section 2: Join Exam Room Action Card */}
      <div 
        onClick={() => navigate('/student/join-exam')}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-blue-100 dark:border-blue-900 p-6 shadow-sm flex items-center gap-5 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group hover:shadow-md"
      >
        <div className="bg-zense-navy dark:bg-blue-600 w-14 h-14 rounded-xl flex items-center justify-center text-white group-hover:scale-105 transition-transform shadow-md">
          <ArrowRight size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Join Exam Room</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Enter exam code to start your assessment</p>
        </div>
      </div>

      {/* Section 3: Stat Cards */}
      {data?.stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Enrolled Courses" 
            value={data.stats.enrolled_courses ?? '-'} 
            icon={<BookOpen size={20} className="text-blue-500"/>} 
          />
          <StatCard 
            title="Completed Exams" 
            value={data.stats.completed_exams ?? '-'} 
            icon={<CheckCircle size={20} className="text-emerald-500"/>} 
          />
          <StatCard 
            title="Pending Exams" 
            value={data.stats.pending_exams ?? '-'} 
            icon={<Clock size={20} className="text-amber-500"/>} 
          />
          <StatCard 
            title="Average Score" 
            value={data.stats.average_score ? `${data.stats.average_score}%` : '-'} 
            icon={<TrendingUp size={20} className="text-indigo-500"/>} 
          />
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          ไม่สามารถดึงข้อมูลสถิติได้ในขณะนี้
        </div>
      )}

      {/* Section 4: Recent Scores */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Recent Scores</h3>
        
        {data?.recent_scores && data.recent_scores.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recent_scores.map((score, index) => (
              <div key={index} className="border border-slate-100 dark:border-slate-700 rounded-xl p-5 hover:shadow-md transition-all bg-slate-50/30 dark:bg-slate-900/50">
                <div className="flex justify-between items-start mb-4">
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-800 dark:text-white truncate pr-2">
                      {score.exam_name || 'ไม่มีชื่อ'}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                      <Clock size={12} /> {score.date || 'ไม่ระบุวันที่'}
                    </p>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <span className={`text-2xl font-black ${
                      (score.percentage ?? score.score) >= 80 ? 'text-emerald-500' : 
                      (score.percentage ?? score.score) >= 50 ? 'text-amber-500' : 'text-red-500'
                    }`}>
                      {score.percentage ?? score.score ?? '-'}%
                    </span>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            คุณยังไม่มีประวัติการทำข้อสอบในขณะนี้
          </div>
        )}
      </div>

    </div>
  );
};

// Component ย่อยสำหรับกล่องสถิติ
const StatCard = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-32">
    <div className="flex justify-between items-center">
      <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</span>
      <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
        {icon}
      </div>
    </div>
    <div className="text-4xl font-bold text-slate-800 dark:text-white mt-4">{value}</div>
  </div>
);

export default StudentDashboard;