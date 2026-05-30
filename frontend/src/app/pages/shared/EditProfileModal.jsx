import { useState } from 'react';
import axios from 'axios';
import { X, Save, Loader2 } from 'lucide-react';

const EditProfileModal = ({ profile, userRole, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = userRole === 'Student' 
        ? 'http://localhost:8000/api/student/profile/' 
        : 'http://localhost:8000/api/teacher/profile/';
      
      await axios.put(endpoint, formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      onSuccess(); // รีโหลดข้อมูลหน้าหลัก
    } catch (err) {
        console.error("Update profile error:", err); 
  
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Edit Profile</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 pl-1">First Name</label>
                <input 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-zense-navy outline-none"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-500 pl-1">Last Name</label>
                <input 
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-zense-navy outline-none"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500 pl-1">Email Address</label>
              <input 
                type="email"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-zense-navy outline-none"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-zense-navy text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> บันทึกข้อมูล</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;