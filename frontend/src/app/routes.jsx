import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardStudent from './pages/student/Dashboard.jsx';
import DashboardTeacher from './pages/teacher/DashboardTeacher.jsx';
import JoinExam from './pages/student/joinExam.jsx';
import ProtectedRoute from './component/ProtectedRoute.jsx'; // นำเข้าป้อมยาม
import MainLayout from './component/layout/MainLayout.jsx';
import Profile from './pages/shared/Profile.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/student/join-exam"
        element={
          <ProtectedRoute allowedRole="Student">
            <MainLayout>
              <JoinExam />
            </MainLayout>

          </ProtectedRoute>
        }
      />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRole="Student">
            <MainLayout>
              <DashboardStudent />
            </MainLayout>
          </ProtectedRoute>
        }
      />



      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRole="Teacher">
            <MainLayout>
              <DashboardTeacher />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/student/profile" element={
        <ProtectedRoute allowedRole="Student">
          <MainLayout>
            <Profile userRole="Student" />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/profile" element={
        <ProtectedRoute allowedRole="Teacher">
          <MainLayout>
            <Profile userRole="Teacher" />
          </MainLayout>
        </ProtectedRoute>
      } />



    </Routes>


  );
};

export default AppRoutes;