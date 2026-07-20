import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../../utils/api';
import { User, Mail, ShieldCheck, Edit3, Lock, CheckCircle, Loader2 } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import ChangePasswordModal from './ChangePasswordModal';
import { useTranslation } from 'react-i18next';

const Profile = ({ userRole }) => {
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  // เพิ่ม state สำหรับเป็นตัวกระตุ้นการดึงข้อมูลใหม่
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found in localStorage, skipping profile fetch');
          setLoading(false);
          return;
        }
        const endpoint = userRole === 'Student' 
          ? 'http://localhost:8000/api/student/profile/' 
          : 'http://localhost:8000/api/teacher/profile/';
        
        const response = await axios.get(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (isMounted) {
          setProfile(response.data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching profile:", err);
          setLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => { isMounted = false; };
  }, [userRole, refreshKey]); // จะทำงานเมื่อ Role เปลี่ยน หรือเมื่อมีการ setRefreshKey

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-zense-navy" size={40} />
        <p className="text-slate-400 font-medium text-sm">กำลังโหลดข้อมูลโปรไฟล์...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 md:px-0">
      <div>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Profile Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-2 h-8 bg-zense-navy dark:bg-blue-600 rounded-full"></div>
              Personal Information
            </h3>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zense-navy dark:bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10 dark:shadow-none active:scale-95"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-300 dark:text-slate-600" /> Role (สิทธิ์การใช้งาน)
              </label>
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-zense-navy dark:text-blue-400 font-bold text-xs">
                  <CheckCircle size={14} className="text-emerald-500 dark:text-emerald-400" /> 
                  {profile?.role || userRole}
                </div>
                {profile?.is_google_account && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold text-xs">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google Account
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={14} className="text-slate-300 dark:text-slate-600" /> Full Name (ชื่อ-นามสกุล)
              </label>
              <p className="text-lg font-bold text-slate-700 dark:text-white pl-1">{profile?.full_name || 'ไม่พบข้อมูล'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Mail size={14} className="text-slate-300 dark:text-slate-600" /> Email (อีเมล)
              </label>
              <p className="text-lg font-bold text-slate-700 dark:text-white pl-1">{profile?.email || 'ไม่พบข้อมูล'}</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={14} className="text-slate-300 dark:text-slate-600" /> Identification Code (รหัสประจำตัว)
              </label>
              <p className="text-lg font-bold text-slate-700 dark:text-white pl-1">{profile?.student_id || profile?.teacher_id || 'ไม่พบข้อมูล'}</p>
            </div>

          </div>
        </div>

        {!profile?.is_google_account && (
          <div className="bg-slate-50/50 dark:bg-slate-900/50 p-8 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="hidden md:block">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">ต้องการความปลอดภัยเพิ่มขึ้นใช่ไหม?</p>
            </div>
            <button 
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-3 px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm hover:border-zense-navy dark:hover:border-blue-500 hover:text-zense-navy dark:hover:text-blue-400 transition-all shadow-sm group active:scale-95"
            >
              <Lock size={18} className="text-slate-400 dark:text-slate-500 group-hover:text-zense-navy dark:group-hover:text-blue-400 transition-colors" />
              Change Password
            </button>
          </div>
        )}
      </div>

      {/* --- Modals --- */}
      {isEditModalOpen && (
        <EditProfileModal 
          profile={profile} 
          userRole={userRole}
          onClose={() => setIsEditModalOpen(false)} 
          onSuccess={() => {
            // เปลี่ยนค่า refreshKey เพื่อให้ useEffect ดึงข้อมูลใหม่
            setRefreshKey(prev => prev + 1);
            setIsEditModalOpen(false);
          }}
        />
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
};

export default Profile;