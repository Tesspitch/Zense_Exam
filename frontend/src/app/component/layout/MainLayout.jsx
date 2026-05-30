import StudentSidebar from './student/Sidebar';
import TeacherSidebar from './teacher/Sidebar';
import Header from './Header';

import { jwtDecode } from 'jwt-decode';

const MainLayout = ({ children }) => {
  let role = 'Student';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      role = decoded?.role || 'Student';
    }
  } catch (err) { void err; }

  const Sidebar = role === 'Teacher' ? TeacherSidebar : StudentSidebar;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* ซ้าย: Sidebar */}
      <Sidebar />

      {/* ขวา: Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        {/* เนื้อหาแต่ละหน้าจะมาโผล่ตรง children นี้ */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
