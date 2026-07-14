import { useState } from "react";
import axios from "axios";
import { GraduationCap, UserCheck, CheckCircle } from "lucide-react";
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import logo from "../assets/zense-bg.png";

const SignupPage = () => {
    const { t } = useTranslation();
    const [role, setRole] = useState("Student");
    const [isRoleAnimating, setIsRoleAnimating] = useState(false);
    const [userId, setUserId] = useState("");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm_password, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [redirectText, setRedirectText] = useState('Redirecting to sign in...'); // สถานะบอกว่ากำลังไปหน้าไหน
    
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        
        if (password !== confirm_password) {
            setError("Passwords do not match");
            return;
        }
        if (!userId.trim()) {
            setError("Please enter a user ID");
            return;
        }
        
        try {
            const response = await axios.post("http://localhost:8000/api/signup/", {
                userId,
                fullName,
                email,
                password,
                role,
            });
            
            const displayName = response.data.name || response.data.message || fullName;
            const { token, role: userRole } = response.data;
            
            setSuccessMessage(`Account created for ${displayName}`);
            
            // เช็กว่ามีการคืนค่า Token มาให้ Auto-login ไหม
            if (token) {
                localStorage.setItem('token', token);
                setRedirectText('Redirecting to Dashboard...');
                
                setTimeout(() => {
                    setShowSuccess(false);
                    if (userRole === 'Student') {
                        navigate('/student/dashboard');
                    } else {
                        navigate('/teacher/dashboard');
                    }
                }, 1700);
            } else {
                setRedirectText('Redirecting to sign in...');
                setTimeout(() => {
                    setShowSuccess(false);
                    navigate('/login');
                }, 1700);
            }
            
            setShowSuccess(true);
            
        } catch (err) {
            setError(err.response?.data?.error || "Signup failed");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zense-light dark:bg-slate-900 p-6 font-sans transition-colors">
            <div className="flex flex-col items-center mb-8 md:mb-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-zense-navy dark:bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <img src={logo} alt="ZenseExam" className="w-10 h-10 object-contain" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-zense-navy dark:text-blue-400 tracking-tight">ZenseExam</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">Automatic Multiple Choice Exam System</p>
            </div>

            <div className="bg-white dark:bg-slate-800 w-full max-w-[400px] md:max-w-[440px] p-6 md:p-10 rounded-zense shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
                <div className="text-center mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white">Create an Account</h2>
                    <p className="text-slate-400 text-sm mt-1">Sign up to get started</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-2xl mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRoleAnimating(true);
                            setRole("Student");
                            setTimeout(() => setIsRoleAnimating(false), 340);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                            role === "Student" ? "bg-white dark:bg-slate-600 text-zense-navy dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                        } ${isRoleAnimating && role === "Student" ? 'role-animate' : ''}`}
                    >
                        <UserCheck size={18} /> Student
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsRoleAnimating(true);
                            setRole("Teacher");
                            setTimeout(() => setIsRoleAnimating(false), 340);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all ${
                            role === "Teacher" ? "bg-white dark:bg-slate-600 text-zense-navy dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"
                        } ${isRoleAnimating && role === "Teacher" ? 'role-animate' : ''}`}
                    >
                        <GraduationCap size={18} /> Teacher
                    </button>
                </div>

                {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs p-3 rounded-lg text-center mb-6 border border-red-100 dark:border-red-900/50">{error}</div>}

                <form onSubmit={handleSignup} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Identification code</label>
                        <input
                            type="text"
                            className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                            placeholder="e.g. S12345 or T12345"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full name</label>
                        <input
                            type="text"
                            className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                            placeholder="Your full name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email</label>
                        <input
                            type="email"
                            className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Password</label>
                        <input
                            type="password"
                            className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirm Password</label>
                        <input
                            type="password"
                            className="input-field bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                            placeholder="••••••••"
                            value={confirm_password}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary w-full bg-zense-navy dark:bg-blue-600 hover:bg-blue-900 dark:hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">Create Account</button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Already have an account? <Link to="/login" className="text-zense-navy dark:text-blue-400 font-bold hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>

            {/* Success modal/toast */}
            {showSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                    <div className="relative pointer-events-auto bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 px-8 py-8 flex flex-col items-center gap-4 max-w-md w-full transform transition-all duration-300 animate-in fade-in zoom-in">
                        <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full shadow-md">
                            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={36} />
                        </div>
                        <div className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white text-center">{successMessage}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">{redirectText}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignupPage;