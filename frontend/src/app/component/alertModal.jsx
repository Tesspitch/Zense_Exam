// 1. อัปเดต Imports: นำ CheckCircle2 เข้ามาเพิ่ม
import { CheckCircle2, XCircle, X } from 'lucide-react';

// 2. รับ prop 'type' เพิ่ม (กำหนดค่าเริ่มต้นเป็น 'success')
const AlertModal = ({ isOpen, onClose, title, message, type = 'success' }) => {
  if (!isOpen) return null;

  // 3. กำหนดเงื่อนไขและสไตล์ตามประเภท (Conditional Config)
  const isError = type === 'error';
  
  const config = {
    // เลือกไอคอน
    icon: isError ? (
      <XCircle className="text-red-500" size={28} /> // กากบาทแดงสำหรับ Error
    ) : (
      <CheckCircle2 className="text-emerald-500" size={28} /> // ติ๊กถูกเขียวสำหรับ Success
    ),
    // เลือกสีพื้นหลังวงกลมไอคอน
    iconBg: isError ? 'bg-red-50' : 'bg-emerald-50',
    // เลือกสีปุ่ม 'ตกลง'
    buttonClass: isError 
      ? 'bg-red-600 hover:bg-red-700' 
      : 'bg-zense-navy hover:bg-slate-800',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        
        {/* ส่วนปุ่มปิดกากบาทมุมขวา */}
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* เนื้อหาภายใน */}
        <div className="px-6 pb-6 text-center">
          {/* 🟢 ใช้สไตล์และไอคอนตาม config ที่กำหนดไว้ด้านบน */}
          <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {config.icon}
          </div>
          
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">{message}</p>
          
          {/* 🟢 ใช้คลาสสีปุ่มตาม config */}
          <button
            onClick={onClose}
            className={`w-full mt-6 py-3 ${config.buttonClass} text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] text-sm`}
          >
            ตกลง
          </button>
        </div>

      </div>
    </div>
  );
};

export default AlertModal;