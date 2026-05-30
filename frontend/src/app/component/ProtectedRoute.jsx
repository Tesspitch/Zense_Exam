import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');

  // ถ้าไม่มี Token แปลว่ายังไม่ Login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let isAuthorized = false;

  try {
    const decoded = jwtDecode(token);
    
    // ข้ามการตรวจจับ Impure Function ด้วยการปิดแจ้งเตือนบรรทัดนี้ (เพราะเราจำเป็นต้องเช็กเวลาจริงๆ)
    // eslint-disable-next-line
    const currentTime = Date.now() / 1000; 

    // เช็ก Timeout
    if (decoded.exp < currentTime) {
      localStorage.removeItem('token');
      alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
    } 
    // เช็ก Role
    else if (decoded.role !== allowedRole) {
      alert("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
    } 
    // ถ้าผ่านด่านทั้งหมด
    else {
      isAuthorized = true;
    }
    
  } catch {
    // ลบคำว่า (error) ออกไปเลย จะได้ไม่ติด Error ตัวแปรไม่ได้ใช้
    localStorage.removeItem('token');
  }

  // นำการ Return JSX ออกมาไว้นอก try...catch ตามที่ React ต้องการ
  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  // ผ่านทุกอย่าง อนุญาตให้แสดงผล
  return children;
};

export default ProtectedRoute;