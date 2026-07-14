import StudentSidebar from './student/Sidebar';
import TeacherSidebar from './teacher/Sidebar';
import Header from './Header';

import { jwtDecode } from 'jwt-decode';
import { useState } from 'react';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  let role = 'Student';
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode(token);
      role = decoded?.role || 'Student';
    }
  } catch (err) { void err; }

  const Sidebar = role === 'Teacher' ? TeacherSidebar : StudentSidebar;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* ซ้าย: Sidebar */}
      <Sidebar isOpen={isSidebarOpen} closeSidebar={closeSidebar} />

      {/* ขวา: Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header toggleSidebar={toggleSidebar} />
        {/* เนื้อหาแต่ละหน้าจะมาโผล่ตรง children นี้ */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
