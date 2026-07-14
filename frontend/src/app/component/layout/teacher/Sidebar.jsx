import { LayoutDashboard, BookOpen, FileText, Users, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../../assets/zense-bg.png';

const TeacherSidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/teacher/dashboard' },
    { name: 'Subjects', icon: <BookOpen size={20} />, path: '/teacher/subjects' },
    { name: 'Courses', icon: <BookOpen size={20} />, path: '/teacher/courses' },
    { name: 'Question Bank', icon: <FileText size={20} />, path: '/teacher/questions' },
    { name: 'Exams', icon: <BookOpen size={20} />, path: '/teacher/exams' },
    { name: 'Students', icon: <Users size={20} />, path: '/teacher/students' },
    { name: 'Profile', icon: <Settings size={20} />, path: '/teacher/profile' },
  ];

  return (
    <aside className={`w-64 bg-white border-r border-slate-200 flex flex-col p-4 h-screen fixed md:sticky top-0 z-50 transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-10 mt-2 px-2">
        <div className="bg-zense-navy p-1.5 rounded-lg">
          <img src={logo} alt="Zense" className="w-7 h-7 object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-zense-navy">ZenseExam</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Teacher Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (window.innerWidth < 768 && closeSidebar) closeSidebar();
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-zense-navy text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 text-center">© 2024 ZenseExam System</p>
      </div>
    </aside>
  );
};

export default TeacherSidebar;
