'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Camera, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchProfile, updateProfile, updateAvatar, type Profile } from '@/lib/api/header';
import { useAuth } from '@/lib/auth-context';

export default function ProfilePage() {
  const { permissionCodes, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && permissionCodes.length > 0 && !permissionCodes.includes('overview')) {
      router.replace('/');
    }
  }, [isLoading, permissionCodes]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    avatar: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const result = await fetchProfile();
      setProfile(result);
      setForm({
        name: result.name,
        phone: result.phone,
        avatar: result.avatar,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('姓名不能为空');
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        name: form.name,
        phone: form.phone,
      });
      setProfile(result);
      alert('保存成功');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        await updateAvatar(base64);
        setForm({ ...form, avatar: base64 });
        alert('头像更新成功');
      } catch (error) {
        console.error('Failed to update avatar:', error);
        alert('头像更新失败');
      }
    };
    reader.readAsDataURL(file);
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
          className="gap-2 text-[#333333] hover:text-[#07C160] hover:bg-[#07C160]/10"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </Button>
        <Badge variant="outline" className="text-[#07C160] border-[#07C160]/30 bg-[#07C160]/10">
          {profile?.role}
        </Badge>
      </div>

      <Card className="border-[#e5e5e5] shadow-sm rounded-[24px]">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-[#07C160]" />
            个人资料
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center overflow-hidden">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt="头像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full border-2 border-[#07C160] flex items-center justify-center cursor-pointer hover:bg-[#07C160]/10 transition-colors shadow-md">
                <Camera className="w-4 h-4 text-[#07C160]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333333]">姓名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="请输入姓名"
                  className="pl-10 border-[#e5e5e5] focus:border-[#07C160] focus:ring-[#07C160]/20 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#333333]">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#999999]" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="请输入手机号"
                  className="pl-10 border-[#e5e5e5] focus:border-[#07C160] focus:ring-[#07C160]/20 rounded-xl"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-[#07C160] to-[#06AD56] hover:from-[#06AD56] hover:to-[#07C160] rounded-full shadow-lg shadow-[#07C160]/25"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存修改
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}