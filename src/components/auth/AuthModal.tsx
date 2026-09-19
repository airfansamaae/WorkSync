import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Lock,
  User as UserIcon,
  Shield,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, signup, loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const success = await signup(fullName, username, password);
        if (success) {
          setIsRegister(false);
          setPassword('');
        }
      } else {
        const success = await login(username, password);
        if (success && onClose) {
          onClose();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      const success = await loginWithGoogle();
      if (success && onClose) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-fullscreen-container"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-gradient-to-br from-white via-purple-50/70 to-purple-100/80 backdrop-blur-md animate-in fade-in duration-300"
    >
      {/* Background Decorative Soft Purple & White Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-purple-200/35 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-purple-300/25 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-white/70 blur-2xl pointer-events-none" />

      {/* Main Auth Card: Clean Minimal, Modern, White-Purple Aesthetic, Exact Equal Height & Width */}
      <div
        id="auth-card"
        className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl shadow-purple-900/10 border border-purple-100 overflow-hidden transition-all duration-300 flex flex-col"
        style={{ minHeight: '620px' }}
      >
        {/* Top Minimalist Header */}
        <div className="pt-7 pb-4 px-6 sm:px-8 text-center bg-gradient-to-b from-purple-50/80 to-transparent">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 mb-3.5 ring-4 ring-purple-100/80">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug">
            ระบบบริหารจัดการงานวิชาการ
          </h1>
          <p className="text-xs sm:text-sm text-purple-700/80 font-medium mt-1">
            Academic Management System สำหรับครูและผู้บริหาร
          </p>
        </div>

        {/* Tab Switcher (Equal Width, Minimal Modern Pill style) */}
        <div className="px-6 sm:px-8 pt-1 pb-3">
          <div className="p-1 rounded-2xl bg-purple-100/60 border border-purple-200/50 grid grid-cols-2 gap-1">
            <button
              id="tab-btn-signin"
              type="button"
              onClick={() => setIsRegister(false)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !isRegister
                  ? 'bg-white text-purple-700 shadow-xs ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-purple-700'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              id="tab-btn-signup"
              type="button"
              onClick={() => setIsRegister(true)}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isRegister
                  ? 'bg-white text-purple-700 shadow-xs ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-purple-700'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>ลงทะเบียนใหม่</span>
            </button>
          </div>
        </div>

        {/* Form Body - Fixed equal dimension container */}
        <div className="px-6 sm:px-8 pb-6 flex-1 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-3.5 flex-1">
            {/* Full Name input (Active on register mode) */}
            {isRegister ? (
              <div className="animate-in fade-in duration-200">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  ชื่อ-นามสกุล (Full Name) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-fullname"
                    type="text"
                    required
                    placeholder="เช่น ครูสมชาย มั่นคง"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-purple-200/80 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm transition-all shadow-2xs"
                  />
                </div>
              </div>
            ) : (
              /* Quick helper notice on Sign In to balance visual weight perfectly */
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs text-purple-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span>ระบบรักษาความปลอดภัยระดับองค์กร ปกป้องข้อมูลวิชาการ</span>
              </div>
            )}

            {/* Username / User ID input */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                {isRegister ? 'ตั้งชื่อผู้ใช้ (User ID / Username) *' : 'ชื่อผู้ใช้ (User ID / Username) *'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
                  <Shield className="w-4 h-4" />
                </div>
                <input
                  id="input-auth-username"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="รหัสประจำตัว หรือ Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-purple-200/80 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  {isRegister ? 'กำหนดรหัสผ่าน (Password) *' : 'รหัสผ่าน (Password) *'}
                </label>
                {isRegister && (
                  <span className="text-[10px] text-purple-600 font-medium">อย่างน้อย 6 ตัวอักษร</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-purple-200/80 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Note under register */}
            {isRegister && (
              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200/70 text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-tight">
                  หลังลงทะเบียน แอดมินจะตรวจสอบและอนุมัติบัญชีเพื่อความปลอดภัย
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm btn-glow flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 shadow-md shadow-purple-600/25"
            >
              <span>{isRegister ? 'ลงทะเบียนขอเข้าใช้งาน' : 'เข้าสู่ระบบ'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divider & External Google Integration */}
          <div className="mt-4 pt-3 border-t border-purple-100 space-y-3">
            <button
              id="btn-google-signin"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-3.5 rounded-xl border border-purple-200/90 hover:border-purple-300 bg-white hover:bg-purple-50/50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>เข้าสู่ระบบด้วย Google Workspace</span>
            </button>

            {/* Bottom Security Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-purple-600/80 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ระบบป้องกัน Brute-force & ตรวจสอบสิทธิ์ปลอดภัย 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
