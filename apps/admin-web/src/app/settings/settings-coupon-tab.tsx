'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import * as couponApi from '@/lib/api/coupon';

interface Props {
  currentStore: { id: string; name: string } | null;
  success: (msg: string) => void;
  warning: (msg: string) => void;
  visible: boolean;
}

interface PlatformConfig {
  app_id: string;
  app_secret: string;
  status: number;
  token_expires_at: string;
}

export default function SettingsCouponTab({ currentStore, success, warning, visible }: Props) {
  const [meituanConfig, setMeituanConfig] = useState<PlatformConfig | null>(null);
  const [douyinConfig, setDouyinConfig] = useState<PlatformConfig | null>(null);
  const [meituanAppId, setMeituanAppId] = useState('');
  const [meituanAppSecret, setMeituanAppSecret] = useState('');
  const [douyinAppId, setDouyinAppId] = useState('');
  const [douyinAppSecret, setDouyinAppSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<Record<string, { connected: boolean; message: string }>>({});

  useEffect(() => {
    if (!visible || !currentStore) return;
    loadConfigs();
  }, [visible, currentStore]);

  const loadConfigs = async () => {
    if (!currentStore) return;
    setLoading(true);
    try {
      const [mtConfig, dyConfig] = await Promise.all([
        couponApi.getPlatformConfig(currentStore.id, 'meituan'),
        couponApi.getPlatformConfig(currentStore.id, 'douyin'),
      ]);
      if (mtConfig) {
        setMeituanConfig(mtConfig);
        setMeituanAppId(mtConfig.app_id);
        setMeituanAppSecret('');
      }
      if (dyConfig) {
        setDouyinConfig(dyConfig);
        setDouyinAppId(dyConfig.app_id);
        setDouyinAppSecret('');
      }
    } catch (e: any) {
      warning(e?.message || '加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: string) => {
    if (!currentStore) return;
    const appId = platform === 'meituan' ? meituanAppId : douyinAppId;
    const appSecret = platform === 'meituan' ? meituanAppSecret : douyinAppSecret;
    if (!appId || !appSecret) {
      warning('AppId和AppSecret不能为空');
      return;
    }
    setSaving({ ...saving, [platform]: true });
    try {
      await couponApi.savePlatformConfig({
        store_id: currentStore.id,
        platform,
        app_id: appId,
        app_secret: appSecret,
      });
      success(`${platform === 'meituan' ? '美团' : '抖音'}配置已保存`);
      await loadConfigs();
    } catch (e: any) {
      warning(e?.message || '保存失败');
    } finally {
      setSaving({ ...saving, [platform]: false });
    }
  };

  const handleCheckStatus = async (platform: string) => {
    if (!currentStore) return;
    try {
      const result = await couponApi.checkPlatformStatus(currentStore.id, platform);
      setStatus({ ...status, [platform]: result });
      success(result.connected ? '连接正常' : '连接失败: ' + result.message);
    } catch (e: any) {
      warning(e?.message || '检测失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const renderPlatformCard = (
    platform: string,
    label: string,
    icon: string,
    appId: string,
    setAppId: (v: string) => void,
    appSecret: string,
    setAppSecret: (v: string) => void,
    config: PlatformConfig | null
  ) => (
    <Card key={platform}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span>{icon}</span> {label}
          </CardTitle>
          {config && (
            <Badge variant={status[platform]?.connected ? 'default' : 'secondary'}>
              {status[platform]?.connected ? '已连接' : config.status ? '已配置' : '未配置'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>AppId / ClientKey</Label>
          <Input
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            placeholder={`输入${label} AppId`}
          />
        </div>
        <div className="space-y-2">
          <Label>AppSecret / ClientSecret</Label>
          <Input
            type="password"
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            placeholder={config ? '留空则不修改密钥' : `输入${label} AppSecret`}
          />
        </div>
        {config?.token_expires_at && (
          <p className="text-xs text-gray-500">
            Token有效期至: {config.token_expires_at}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            onClick={() => handleSave(platform)}
            disabled={saving[platform]}
            className="flex-1"
          >
            {saving[platform] ? '保存中...' : '保存配置'}
          </Button>
          {config && (
            <Button
              variant="outline"
              onClick={() => handleCheckStatus(platform)}
            >
              测试连接
            </Button>
          )}
        </div>
        {status[platform] && (
          <p className={`text-sm ${status[platform].connected ? 'text-green-600' : 'text-red-500'}`}>
            {status[platform].message}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        配置美团和抖音的开放平台API凭证后，即可使用团购验券功能。
        请确保已在对应平台完成开发者入驻和商家授权。
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderPlatformCard('meituan', '美团', '🍔', meituanAppId, setMeituanAppId, meituanAppSecret, setMeituanAppSecret, meituanConfig)}
        {renderPlatformCard('douyin', '抖音', '🎵', douyinAppId, setDouyinAppId, douyinAppSecret, setDouyinAppSecret, douyinConfig)}
      </div>
    </div>
  );
}
