import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, ShieldCheck, Edit3, Lock, CheckCircle, Loader2 } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import ChangePasswordModal from './ChangePasswordModal';

const Profile = ({ userRole }) => {
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
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Profile Settings</h2>
        <p className="text-slate-500 mt-1 font-medium">จัดการข้อมูลส่วนตัวและรหัสผ่านของคุณ</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="w-2 h-8 bg-zense-navy rounded-full"></div>
              Personal Information
            </h3>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-zense-navy text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-blue-900/10 active:scale-95"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-16">
            <div className="md:col-span-2 space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck size={14} className="text-slate-300" /> Role (สิทธิ์การใช้งาน)
              </label>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-zense-navy font-bold text-xs">
                <CheckCircle size={14} className="text-emerald-500" /> 
                {profile?.role || userRole}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={14} className="text-slate-300" /> Full Name (ชื่อ-นามสกุล)
              </label>
              <p className="text-lg font-bold text-slate-700 pl-1">{profile?.full_name || 'ไม่พบข้อมูล'}</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Mail size={14} className="text-slate-300" /> Email (อีเมล)
              </label>
              <p className="text-lg font-bold text-slate-700 pl-1">{profile?.email || 'ไม่พบข้อมูล'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 p-8 border-t border-slate-100 flex items-center justify-between">
          <div className="hidden md:block">
            <p className="text-xs text-slate-400 font-medium">ต้องการความปลอดภัยเพิ่มขึ้นใช่ไหม?</p>
          </div>
          <button 
            onClick={() => setIsPasswordModalOpen(true)}
            className="flex items-center gap-3 px-8 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:border-zense-navy hover:text-zense-navy transition-all shadow-sm group active:scale-95"
          >
            <Lock size={18} className="text-slate-400 group-hover:text-zense-navy transition-colors" />
            Change Password
          </button>
        </div>
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