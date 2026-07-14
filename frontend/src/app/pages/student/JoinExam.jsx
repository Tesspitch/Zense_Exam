import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const JoinExam = () => {
  const { t } = useTranslation();
  const [examPass, setExamPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoinExam = async (e) => {
    e.preventDefault();
    if (!examPass) return;

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setLoading(false);
        return;
      }

      // ปรับโครงสร้าง URL และส่งค่าเป็นตัวพิมพ์ใหญ่ตามมาตรฐาน Database
      const response = await axios.post(
        'http://localhost:8000/api/join_exam/',
        { exam_pass: examPass.trim().toUpperCase() }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // ถ้าผ่าน (200 OK) และสำเร็จ ให้สลับหน้าพร้อมแนบ State ไป
      if (response.data.success) {
        navigate(`/exam-room/${response.data.exam_id}`, {
          state: {
            examName: response.data.exam_name,
            examId: response.data.exam_id
          }
        });
      }
      
    } catch (err) {
      // ดึง Error Message ตรงๆ จาก Django Backend มาแสดงบน UI
      const errorMessage = err.response?.data?.error || 'ไม่สามารถเข้าร่วมห้องสอบได้ รหัสผ่านอาจไม่ถูกต้อง';
      setError(errorMessage);
      console.error('Join exam error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <ArrowRight className="text-zense-navy dark:text-blue-400" size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Enter Exam Passcode</h2>
        </div>

        <form onSubmit={handleJoinExam} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Exam Passcode</label>
            <input
              type="text"
              value={examPass}
              onChange={(e) => setExamPass(e.target.value.toUpperCase())}
              placeholder="e.g., CYBER2026"
              className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-zense-navy dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-900/10 dark:focus:ring-blue-500/20 outline-none transition-all font-mono text-lg tracking-wide text-slate-800 dark:text-white"
            />
          </div>

          {/* แสดง Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !examPass}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 text-sm ${
              loading || !examPass ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-zense-navy dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 shadow-lg shadow-blue-900/10 dark:shadow-none active:scale-[0.99]'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Join Exam Room'}
          </button>
        </form>

        {/* ปรับปรุงชุดโค้ดเดโมด้านล่างให้ตรงกับตาราง MySQL จริงของคุณ */}
        <div className="mt-8 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Demo Exam Passcodes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
            {['IT2026', 'EXAM-MTH-001', 'EXAM-PHY-002'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setExamPass(code)}
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-left text-slate-600 dark:text-slate-300 hover:border-zense-navy dark:hover:border-blue-500 hover:text-zense-navy dark:hover:text-blue-400 transition-colors font-semibold"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinExam;