'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Lock, User, Eye, EyeOff, Waves } from 'lucide-react';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('请输入手机号和密码');
      return;
    }

    setLoading(true);
    try {
      const result = await login(phone, password);
      if (result.success) {
        router.push('/select-store');
      } else {
        setError(result.error || '登录失败');
      }
    } catch {
      setError('登录异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F8EF] via-[#f7f7f7] to-[#f7f7f7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-[#07C160]/20 to-transparent" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-[#07C160]/10 rounded-full blur-3xl" />
      <div className="absolute top-40 right-10 w-24 h-24 bg-[#FF976A]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-[#06B6D4]/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-[32px] shadow-xl shadow-[#07C160]/30 mb-6">
            <Waves className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#333333] mb-2">客稻云</h1>
          <p className="text-[#999999]">收银管理中心</p>
        </div>

        <div className="bg-white rounded-[32px] shadow-xl shadow-[#07C160]/5 border border-[#e5e5e5]/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-[#FFF1F0] border border-[#FFCCC7] text-[#FF4D4F] px-5 py-3.5 rounded-2xl text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#333333]">手机号</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#f7f7f7] rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#07C160]" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="w-full pl-16 pr-4 py-4 bg-[#f7f7f7] border-0 rounded-2xl text-[#333333] placeholder:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#07C160]/30 focus:bg-white transition-all"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#333333]">密码</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#f7f7f7] rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#07C160]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-16 pr-14 py-4 bg-[#f7f7f7] border-0 rounded-2xl text-[#333333] placeholder:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#07C160]/30 focus:bg-white transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999999] hover:text-[#07C160] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white font-semibold text-base rounded-full shadow-lg shadow-[#07C160]/30 hover:shadow-xl hover:shadow-[#07C160]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : (
                '登 录'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#999999] mt-8">
          © 2026 客稻云 · 台球行业数字化管理平台
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}