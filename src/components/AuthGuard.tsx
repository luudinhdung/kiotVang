import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

interface AuthGuardProps {
  children: (userEmail: string, onSignOut: () => Promise<void>) => React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu!');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần có tối thiểu 6 ký tự!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password
        });
        if (error) {
          throw new Error(
            error.message.includes('Invalid login credentials')
              ? 'Email hoặc mật khẩu chưa đúng (Nếu chưa có tài khoản, bạn hãy chuyển sang tab Đăng ký nhé!)'
              : error.message
          );
        }
        setSession(data.session);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password
        });
        if (error) {
          throw new Error(
            error.message.includes('already registered')
              ? 'Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập!'
              : error.message
          );
        }

        if (data.session) {
          setSession(data.session);
        } else {
          // Since our Postgres trigger auto-confirms the email, sign in immediately
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });
          if (loginErr) {
            setSuccessMsg('Đăng ký tài khoản thành công! Vui lòng bấm Đăng nhập.');
            setAuthMode('login');
          } else {
            setSession(loginData.session);
          }
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi xác thực tài khoản');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[#00BFA5] inline-block -mr-2 opacity-90"></span>
          <span className="w-6 h-6 rounded-full bg-[#0070F4] inline-flex items-center justify-center text-white font-bold text-xs">
            K
          </span>
          <span className="text-xl font-extrabold tracking-tight text-[#0055B8]">
            Kiot<span className="text-[#0070F4]">Vạng</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <RefreshCw className="w-4 h-4 animate-spin text-[#0070F4]" />
          <span>Đang kiểm tra phiên đăng nhập bảo mật...</span>
        </div>
      </div>
    );
  }

  // Protected Route Gate: If not authenticated, render Login / Register page
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0055B8] via-[#0070F4] to-sky-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
          {/* Top Brand Header */}
          <div className="px-6 pt-7 pb-5 text-center bg-slate-50/70 border-b border-slate-100">
            <div className="inline-flex items-center gap-1.5 select-none mb-2">
              <div className="flex items-center">
                <span className="w-5 h-5 rounded-full bg-[#00BFA5] inline-block -mr-2 opacity-90"></span>
                <span className="w-6 h-6 rounded-full bg-[#0070F4] inline-flex items-center justify-center text-white font-bold text-xs">
                  K
                </span>
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-[#0055B8]">
                Kiot<span className="text-[#0070F4]">Vạng</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Hệ thống Quản lý Bán hàng & Kho đồng bộ Đám mây
            </p>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 bg-slate-200/80 p-1 rounded-xl mt-5 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`min-h-[40px] rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'login'
                    ? 'bg-white text-[#0070F4] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`min-h-[40px] rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-white text-[#0070F4] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng ký mới</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Địa chỉ Email tài khoản
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kiotvang.vn"
                  className="w-full min-h-[46px] pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0070F4] text-base md:text-xs outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Mật khẩu (tối thiểu 6 ký tự)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[46px] pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#0070F4] text-base md:text-xs outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] rounded-xl bg-[#0070F4] hover:bg-[#005FD1] disabled:bg-slate-300 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : authMode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>VÀO QUẢN LÝ CỬA HÀNG</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>TẠO TÀI KHOẢN & ĐĂNG NHẬP NGAY</span>
                </>
              )}
            </button>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bảo mật bởi Supabase Auth & Row Level Security (RLS)</span>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <>{children(session.user.email || 'Admin', handleSignOut)}</>;
};
