'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/lib/auth-context';
import { shiftApi } from '@/lib/api/pos';
import { ModalShell } from '@/components/ModalShell';
import { Clock, User, DollarSign, LogOut, Loader2, Play, ArrowRightLeft, Lock } from 'lucide-react';

interface ShiftModalProps {
  onClose: () => void;
}

interface EmployeeItem {
  id: string; name: string; phone: string; role: string;
}

export function ShiftModal({ onClose }: ShiftModalProps) {
  const { state, startShift } = useApp();
  const { currentShift, currentOperator } = state;
  const { user, logout } = useAuth();

  const [password, setPassword] = useState('');
  const [openingCash, setOpeningCash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // 员工列表（用于选择交接）
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // 加载员工列表
  useEffect(() => {
    setLoadingEmployees(true);
    shiftApi.employees().then((list: any) => {
      setEmployees(Array.isArray(list) ? list : []);
    }).catch(() => {}).finally(() => setLoadingEmployees(false));
  }, []);

  // 当前已上班 → 显示当班信息
  const isOnDuty = !!currentShift;

  // 开始上班
  const handleStartWork = async () => {
    if (!password) { setError('请输入登录密码'); return; }
    const employeeId = selectedEmployeeId || currentOperator?.id || user?.id || '';
    if (!employeeId) { setError('无法获取员工信息'); return; }

    setIsProcessing(true);
    setError('');
    try {
      const selectedEmp = employees.find(e => e.id === employeeId);
      const empName = selectedEmp?.name || user?.name || currentOperator?.name || '';
      const res: any = await shiftApi.startWork({ employee_id: employeeId, password });
      // 保存后端返回的新 token，确保后续请求与考勤的 employee_id 一致
      if (res?.token) {
        localStorage.setItem('token', res.token);
      }
      if (res?.employee) {
        localStorage.setItem('userInfo', JSON.stringify(res.employee));
      }
      startShift(employeeId, empName, parseFloat(openingCash) || 0);
      onClose();
    } catch (e: any) {
      setError(e?.msg || e?.message || '上班打卡失败');
    } finally {
      setIsProcessing(false);
    }
  };

  // 交接班（选不同账号自动交接）
  const handleHandover = async () => {
    if (!password) { setError('请输入当前密码'); return; }
    if (!selectedEmployeeId) { setError('请选择接班员工'); return; }
    if (selectedEmployeeId === currentOperator?.id) { setError('不能交班给自己'); return; }

    setIsProcessing(true);
    setError('');
    try {
      const res: any = await shiftApi.handover({
        new_employee_id: selectedEmployeeId,
        password,
        closing_cash: openingCash || '0',
      });
      // 保存新 token 和员工信息，确保后续操作绑定到新员工
      if (res?.token) {
        localStorage.setItem('token', res.token);
      }
      if (res?.employee) {
        localStorage.setItem('userInfo', JSON.stringify(res.employee));
      }
      window.location.replace('/');
    } catch (e: any) {
      setError(e?.msg || e?.message || '交接班失败');
      setIsProcessing(false);
    }
  };

  // 退出登录
  const handleLogout = async () => {
    await logout();
    window.location.replace('/login');
  };

  return (
    <ModalShell onClose={onClose} title={isOnDuty ? '当班中' : '上班打卡'} icon={<Clock className="w-5 h-5" />}>
      <div className="space-y-5">
        {error && (
          <div className="p-4 rounded-3xl bg-red-50 border-2 border-red-200 text-red-600 text-base font-medium">{error}</div>
        )}

        {/* 员工选择 */}
        <div className="bg-slate-50 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-slate-500" />
            <span className="text-base font-bold text-slate-700">{isOnDuty ? '选择接班员工' : '选择上班员工'}</span>
          </div>
          {loadingEmployees ? (
            <div className="flex items-center gap-2 text-slate-400 py-4"><Loader2 className="w-5 h-5 animate-spin" />加载中...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto">
              {employees.map(emp => (
                <button key={emp.id} onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    selectedEmployeeId === emp.id ? 'border-emerald-400 bg-emerald-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                  } ${isOnDuty && emp.id === currentOperator?.id ? 'opacity-40' : ''}`}
                  disabled={isOnDuty && emp.id === currentOperator?.id}>
                  <p className="text-base font-bold text-slate-800">{emp.name}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{emp.phone}</p>
                </button>
              ))}
              {employees.length === 0 && <p className="text-slate-400 col-span-2 py-4 text-center">暂无员工数据</p>}
            </div>
          )}
        </div>

        {/* 密码 + 备用金 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3">
              <Lock className="w-5 h-5" />登录密码
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码" className="w-full h-14 px-5 rounded-2xl border-2 border-slate-200 text-base outline-none focus:border-emerald-400 transition-colors" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 mb-3">
              <DollarSign className="w-5 h-5" />{isOnDuty ? '清点现金' : '备用金'}
            </label>
            <input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="0.00" className="w-full h-14 px-5 rounded-2xl border-2 border-slate-200 text-base outline-none focus:border-emerald-400 transition-colors" />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          {isOnDuty && selectedEmployeeId && selectedEmployeeId !== currentOperator?.id ? (
            <button onClick={handleHandover} disabled={isProcessing || !password}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRightLeft className="w-5 h-5" />}交接班
            </button>
          ) : (
            <button onClick={handleStartWork} disabled={isProcessing || !password}
              className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {isOnDuty ? '确认交班' : '开始上班'}
            </button>
          )}
          <button onClick={handleLogout}
            className="h-14 px-6 rounded-2xl border-2 border-red-200 text-red-500 font-medium hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />退出
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
