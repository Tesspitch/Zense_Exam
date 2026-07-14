import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react';
import AlertModal from '../../component/alertModal'; // พาธถูกต้องตามโครงสร้างโฟลเดอร์จริงของคุณ
import { useTranslation } from 'react-i18next';

const ChangePasswordModal = ({ onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Validation ฝั่ง Frontend
    if (formData.new_password !== formData.confirm_password) {
      setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (formData.new_password.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:8000/api/profile/change-password/', 
        {
          old_password: formData.old_password,
          new_password: formData.new_password
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // ถ้าสำเร็จ เปิด Modal แจ้งสำเร็จ
      setIsSuccess(true); 
    } catch (err) {
      // ถ้าพัง ดึงข้อความ Error จาก Backend มาใส่สเตทเพื่อเปิด Modal กากบาทแดง
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดการหลังกดตกลงที่กล่องสำเร็จ
  const handleCloseSuccessModal = () => {
    setIsSuccess(false);
    onClose(); 
    localStorage.removeItem('token'); 
    navigate('/login'); 
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Main Modal Card */}
      <div className="relative bg-white dark:bg-slate-800 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Change Password</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-full text-slate-400 dark:text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Inline Error Alert (แสดงในฟอร์มด้วยเพื่อให้รับรู้จุดผิดพลาดได้ง่าย) */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-shake">
              <ShieldAlert size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 pl-1">Current Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-zense-navy dark:focus:ring-blue-500 outline-none transition-all text-slate-700 dark:text-white"
                  placeholder="รหัสผ่านปัจจุบัน"
                  value={formData.old_password}
                  onChange={(e) => setFormData({...formData, old_password: e.target.value})}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <hr className="border-slate-100 dark:border-slate-700 my-2" />

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 pl-1">New Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-zense-navy dark:focus:ring-blue-500 outline-none transition-all text-slate-700 dark:text-white"
                placeholder="รหัสผ่านใหม่"
                value={formData.new_password}
                onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                required
              />
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 dark:text-slate-400 pl-1">Confirm New Password</label>
              <input 
                type={showPassword ? "text" : "password"}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-zense-navy dark:focus:ring-blue-500 outline-none transition-all text-slate-700 dark:text-white"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={formData.confirm_password}
                onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 py-4 bg-zense-navy dark:bg-blue-600 text-white rounded-2xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 dark:shadow-none active:scale-95 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Lock size={18} /> Update Password</>}
            </button>
          </form>
        </div>
      </div>

      {/* ================= MODALS ALERT CONTROL ================= */}

      {/* 🟢 1. กล่องแจ้งเมื่อ "เปลี่ยนรหัสสำเร็จ" (แสดงติ๊กถูกสีเขียว) */}
      <AlertModal 
        isOpen={isSuccess} 
        onClose={handleCloseSuccessModal}
        title="เปลี่ยนรหัสผ่านสำเร็จแล้ว!"
        message="ระบบทำการอัปเดตรหัสผ่านใหม่เรียบร้อย กรุณาเข้าสู่ระบบใหม่อีกครั้งเพื่อความปลอดภัย"
        type="success"
      />

      {/* 🔴 2. กล่องแจ้งเมื่อ "เกิดข้อผิดพลาด" (แสดงกากบาทสีแดงตามที่คุณต้องการ) */}
      <AlertModal 
        isOpen={!!error} 
        onClose={() => setError('')} // กดยกเลิกแล้วเคลียร์ค่า Error เพื่อปิดกล่อง
        title="เกิดข้อผิดพลาด!"
        message={error}
        type="error" 
      />
    </div>
  );
};

export default ChangePasswordModal;