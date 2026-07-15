import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardStudent from './pages/student/Dashboard.jsx';
import DashboardTeacher from './pages/teacher/DashboardTeacher.jsx';
import SubjectTeacher from './pages/teacher/SubjectTeacher.jsx';
import CourseTeacher from './pages/teacher/CourseTeacher.jsx';
import QuestionBank from './pages/teacher/QuestionBank.jsx';
import BulkQuestionInput from './pages/teacher/BulkQuestionInput.jsx';
import ExamTeacher from './pages/teacher/ExamTeacher.jsx';
import JoinExam from './pages/student/joinExam.jsx';
import ExamRoom from './pages/student/ExamRoom.jsx';
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
        path="/exam-room/:examId"
        element={
          <ProtectedRoute allowedRole="Student">
            <ExamRoom />
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

      <Route
        path="/teacher/subjects"
        element={
          <ProtectedRoute allowedRole="Teacher">
            <MainLayout>
              <SubjectTeacher />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/courses"
        element={
          <ProtectedRoute allowedRole="Teacher">
            <MainLayout>
              <CourseTeacher />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/questions"
        element={
          <ProtectedRoute allowedRole="Teacher">
            <MainLayout>
              <QuestionBank />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/questions/bulk"
        element={
          <ProtectedRoute allowedRole="Teacher">
            <MainLayout>
              <BulkQuestionInput />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/exams"
        element={
          <ProtectedRoute allowedRole="Teacher">
            <MainLayout>
              <ExamTeacher />
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