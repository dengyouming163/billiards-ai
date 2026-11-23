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
    <div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-center items-center p-20">
        <div className="absolute top-24 left-24 w-28 h-28 bg-emerald-400/10 rounded-full animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-48 right-40 w-20 h-20 bg-amber-400/15 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-48 w-24 h-24 bg-sky-400/10 rounded-full animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        <div className="relative z-10 text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[3rem] shadow-2xl mb-12">
            <Waves className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold text-slate-800 mb-6 tracking-tight">
            台屏智联
          </h1>
          <p className="text-2xl text-slate-600 mb-10 font-light">
            台球行业 SaaS 管理平台
          </p>
          <p className="text-lg text-slate-500 leading-relaxed max-w-md mx-auto">
            一站式球房运营管理解决方案，助力台球行业数字化转型
          </p>

          <div className="flex gap-12 mt-16 justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-emerald-100 rounded-3xl flex items-center justify-center">
                <Waves className="w-8 h-8 text-emerald-600" />
              </div>
              <span className="text-base text-slate-600">智能管理</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-amber-100 rounded-3xl flex items-center justify-center">
                <Waves className="w-8 h-8 text-amber-600" />
              </div>
              <span className="text-base text-slate-600">绿色生态</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-sky-100 rounded-3xl flex items-center justify-center">
                <Waves className="w-8 h-8 text-sky-600" />
              </div>
              <span className="text-base text-slate-600">数据驱动</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-[45%] flex items-center justify-center p-10 relative">
        <div className="relative z-10 w-full max-w-lg">
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8">
            <div className="lg:hidden text-center mb-12">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl shadow-xl mb-4">
                <Waves className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">台屏智联</h1>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">欢迎回来</h2>
              <p className="text-sm text-slate-500">登录商家管理中心</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-600 px-6 py-5 rounded-3xl text-base">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">手机号</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="请输入手机号"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all"
                    autoComplete="tel" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all"
                    autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-7 w-7" viewBox="0 0 24 24">
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

          <p className="text-center text-base text-slate-400 mt-10">
            © 2026 台屏智联 · 台球行业数字化管理平台
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
