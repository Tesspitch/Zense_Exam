import { LogOut, User, Bell, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('User');
  const [displayEmail, setDisplayEmail] = useState('Verified User');
  const [role, setRole] = useState('Student');
  const [isShowConfirmLogout, setIsShowConfirmLogout] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        let decoded = null;
        try { decoded = jwtDecode(token); } catch (err) { void err; }
        const userRole = decoded?.role || 'Student';
        setRole(userRole);

        const endpoint = userRole === 'Teacher'
          ? 'http://localhost:8000/api/teacher/profile/'
          : 'http://localhost:8000/api/student/profile/';

        const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data) {
          setDisplayName(res.data.full_name || res.data.first_name || 'User');
          setDisplayEmail(res.data.email || 'Verified User');
        }
      } catch (err) {
        // ignore errors silently for header
        console.error('Error fetching header profile', err);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => setIsShowConfirmLogout(true);
  const handleConfirmLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

  const goToProfile = () => navigate(role === 'Teacher' ? '/teacher/profile' : '/student/profile');

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 w-full">
      {/* Mobile Menu Button */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Right side icons */}
      <div className="flex items-center gap-2 md:gap-5 ml-auto">
        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors hidden sm:block">
          <Bell size={20} />
        </button>

      <div
        role="button"
        tabIndex={0}
        onClick={goToProfile}
        onKeyDown={(e) => { if (e.key === 'Enter') goToProfile(); }}
        className="flex items-center gap-3 border-l pl-5 border-slate-100 cursor-pointer hover:bg-slate-50 hover:rounded-lg transition-all p-1"
      >
        <div className="text-right">
          <p className="text-xs font-bold text-slate-800">{displayName}</p>
          <p className="text-[10px] text-slate-400">{displayEmail}</p>
        </div>
        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 ml-3">
          <User size={18} />
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-500 text-sm font-bold hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
      >
        <LogOut size={18} />
        <span className="hidden sm:inline">Logout</span>
      </button>
      </div>

      {isShowConfirmLogout && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg max-w-sm mx-4 border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-slate-800">ยืนยันการออกจากระบบ</h3>
              <p className="text-sm text-slate-500 mt-1">กรุณายืนยันก่อนออกจากระบบ</p>
            </div>
            <div className="px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <LogOut size={20} className="text-red-600" />
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mt-0.5">คุณแน่ใจหรือว่าต้องการออกจากระบบ? คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อเข้าใช้งาน</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end bg-slate-50 px-6 py-4 border-t">
              <button onClick={() => setIsShowConfirmLogout(false)} className="px-5 py-2 text-slate-700 bg-white border border-slate-200 rounded-lg">ยกเลิก</button>
              <button onClick={handleConfirmLogout} className="px-5 py-2 text-white bg-red-500 rounded-lg">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
