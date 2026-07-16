import { Award, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from '../../../assets/zense-bg.png';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const menuItems = [
    { name: t('header.dashboard', 'Dashboard'), icon: <LayoutDashboard size={20} />, path: '/student/dashboard' },
    { name: t('header.results', 'Results'), icon: <Award size={20} />, path: '/student/results' },
  ];

  return (
    <aside className={`w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 h-screen fixed md:sticky top-0 z-50 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      {/* Logo Section */}
      <div className="flex items-center gap-3 mb-10 mt-2 px-2">
        <div className="bg-zense-navy dark:bg-blue-600 p-1.5 rounded-lg">
          <img src={logo} alt="Zense" className="w-7 h-7 object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight text-zense-navy dark:text-blue-400">ZenseExam</h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Student Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (window.innerWidth < 768 && closeSidebar) closeSidebar();
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition-all ${isActive
                  ? 'bg-zense-navy dark:bg-blue-600 text-white shadow-lg shadow-blue-900/20 dark:shadow-none'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
            >
              {item.icon}
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Footer Sidebar (Optional) */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">© 2026 ZenseExam System</p>
      </div>
    </aside>
  );
};

export default Sidebar;