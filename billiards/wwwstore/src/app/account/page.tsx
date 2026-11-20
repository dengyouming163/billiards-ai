'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, Save, ArrowLeft } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { changePassword, fetchSecuritySettings, saveSecuritySettings, type SecuritySettings } from '@/lib/api/header';
import { useAuth } from '@/lib/auth-context';

export default function AccountPage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('overview')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    loadSecurity();
  }, []);

  const loadSecurity = async () => {
    setLoading(true);
    try {
      const result = await fetchSecuritySettings();
      setSecurity(result);
    } catch (error) {
      console.error('Failed to load security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('请填写所有密码字段');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }

    setSaving(true);
    try {
      await changePassword(passwordForm);
      toast.success('密码修改成功');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || '密码修改失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSecurityChange = async (key: keyof SecuritySettings, value: boolean | number) => {
    if (!security) return;

    const updated = { ...security, [key]: value };
    setSecurity(updated);

    try {
      await saveSecuritySettings(updated);
    } catch (error) {
      console.error('Failed to save security settings:', error);
      setSecurity(security);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
      </div>

      <Card className="border-slate-200/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-500" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">原密码</label>
            <div className="relative">
              <Input
                type={showPasswords.old ? 'text' : 'password'}
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                placeholder="请输入原密码"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">新密码</label>
            <div className="relative">
              <Input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="请输入新密码（至少6位）"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">确认密码</label>
            <div className="relative">
              <Input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="请再次输入新密码"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                修改密码
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200/50 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            安全设置
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-700">双重验证</p>
              <p className="text-sm text-slate-500">登录时需要输入手机验证码</p>
            </div>
            <Switch
              checked={security?.twoFactor ?? false}
              onCheckedChange={(checked) => handleSecurityChange('twoFactor', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-700">登录提醒</p>
              <p className="text-sm text-slate-500">有新设备登录时发送通知</p>
            </div>
            <Switch
              checked={security?.loginAlert ?? true}
              onCheckedChange={(checked) => handleSecurityChange('loginAlert', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-700">会话超时</p>
              <p className="text-sm text-slate-500"> inactivity时间后自动退出（分钟）</p>
            </div>
            <Input
              type="number"
              value={security?.sessionTimeout ?? 30}
              onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value) || 30)}
              className="w-24 text-right"
              min={5}
              max={120}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}