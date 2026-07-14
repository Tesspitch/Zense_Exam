import { useState } from 'react';
import axios from 'axios';
import { GraduationCap, UserCheck } from 'lucide-react';
// เพิ่ม useNavigate เข้ามาเพื่อใช้เปลี่ยนหน้า
import { Link, useNavigate } from 'react-router-dom'; 
import { useTranslation } from 'react-i18next';
import logo from '../assets/zense-bg.png';

const LoginPage = () => {
  const { t } = useTranslation();
  const [role, setRole] = useState('Student');
  const [isRoleAnimating, setIsRoleAnimating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // เรียกใช้งาน navigate
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:8000/api/login/', {
        email, password, role
      });
      
      // ดึง token และ role มาจาก response ของ Django
      const { token, role: userRole } = response.data;
      
      // 1. เก็บ Token ลงใน LocalStorage
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // 2. เช็ก Role แล้ว Redirect ไปหน้า Dashboard ที่ถูกต้อง
      if (userRole === 'Student') {
        navigate('/student/dashboard');
      } else if (userRole === 'Teacher') {
        navigate('/teacher/dashboard');
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zense-light dark:bg-slate-900 p-6 font-sans transition-colors">
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8 md:mb-10 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-14 h-14 md:w-16 md:h-16 bg-zense-navy dark:bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <img src={logo} alt="ZenseExam" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-zense-navy dark:text-blue-400 tracking-tight">ZenseExam</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">Automatic Multiple Choice Exam System</p>
      </div>

      {/* Login Card */}
      <div className="bg-white dark:bg-slate-800 w-full max-w-[400px] md:max-w-[440px] p-6 md:p-10 rounded-zense shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Welcome Back</h2>
          <p className="text-slate-400 text-sm mt-1">Sign in to continue</p>
        </div>

        {/* Role Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-2xl mb-8">
          <button
            type="button"
            onClick={() => {
              setIsRoleAnimating(true);
              setRole('Student');
              setTimeout(() => setIsRoleAnimating(false), 420);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
              role === 'Student' ? 'bg-white dark:bg-slate-600 text-zense-navy dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
            } ${isRoleAnimating && role === 'Student' ? 'role-animate role-flash' : ''}`}
          >
            <UserCheck size={18} /> Student
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRoleAnimating(true);
              setRole('Teacher');
              setTimeout(() => setIsRoleAnimating(false), 420);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
              role === 'Teacher' ? 'bg-white dark:bg-slate-600 text-zense-navy dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
            } ${isRoleAnimating && role === 'Teacher' ? 'role-animate role-flash' : ''}`}
          >
            <GraduationCap size={18} /> Teacher
          </button>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs p-3 rounded-lg text-center mb-6 border border-red-100 dark:border-red-900/50 animate-bounce">{error}</div>}

        <div aria-live="polite" className="sr-only" />

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email</label>
            <input
              type="email"
              className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
            <input
              type="password"
              className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary w-full bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account? <Link to="/signup" className="text-zense-navy dark:text-blue-400 font-bold cursor-pointer hover:underline">Create account</Link>
          </p>
          <div className="pt-4 border-t border-slate-50 dark:border-slate-700">
             <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-semibold">ZenseExam v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;