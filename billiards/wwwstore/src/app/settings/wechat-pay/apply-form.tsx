'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { submitApplyment, type ApplyFormData } from '@/lib/api/wechat-applyment';
import { toast } from 'sonner';
import { BankSelector } from './bank-selector';

// 微信进件图片上传 — 通过 Next.js 代理路由（同源，无 CORS 问题）→ ThinkPHP WechatApplymentController
const UPLOAD_URL = '/api/upload';

const steps = [
  { title: '联系人', desc: '填写联系人基本资料' },
  { title: '主体资料', desc: '营业执照与法人证件' },
  { title: '经营信息', desc: '经营相关基础信息' },
  { title: '结算账户', desc: '结算规则与银行账户' },
];

const schema = z.object({
  contact_info: z.object({
    contact_type: z.string().min(1, '请选择联系人类型'),
    contact_name: z.string().min(1, '请输入联系人姓名'),
    contact_id_number: z.string().min(1, '请输入身份证号码'),
    mobile_phone: z.string().min(1, '请输入手机号码'),
    contact_email: z.string().min(1, '请输入邮箱地址'),
  }),
  subject_info: z.object({
    subject_type: z.string().min(1, '请选择主体类型'),
    business_license_info: z.object({
      license_copy: z.string().default(''),
      license_number: z.string().default(''),
      merchant_name: z.string().default(''),
      legal_person: z.string().default(''),
      license_address: z.string().default(''),
      period_begin: z.string().default(''),
      period_end: z.string().default(''),
    }).optional(),
    identity_info: z.object({
      id_holder_type: z.string().default('LEGAL'),
      id_doc_type: z.string().default('IDENTIFICATION_TYPE_IDCARD'),
      id_card_info: z.object({
        id_card_copy: z.string().default(''),
        id_card_national: z.string().default(''),
        id_card_name: z.string().min(1, '请输入身份证姓名'),
        id_card_number: z.string().min(1, '请输入身份证号码'),
        id_card_address: z.string().min(1, '请输入身份证地址'),
        card_period_begin: z.string().min(1, '请选择有效期开始'),
        card_period_end: z.string().min(1, '请选择有效期结束或勾选长期有效'),
      }),
    }),
  }),
  business_info: z.object({
    merchant_shortname: z.string().min(1, '请输入商户简称'),
    service_phone: z.string().min(1, '请输入客服电话'),
  }),
  settlement_info: z.any().optional(),
	  bank_account_info: z.object({
	    bank_account_type: z.string().min(1, '请选择账户类型'),
	    account_name: z.string().min(1, '请输入开户名称'),
	    account_bank: z.string().min(1, '请选择开户银行'),
	    account_number: z.string().min(1, '请输入银行账号'),
	  }),
});

const defaultValues = {
  contact_info: { contact_type: '', contact_name: '', contact_id_number: '', mobile_phone: '', contact_email: '' },
  subject_info: {
    subject_type: '',
    identity_info: {
      id_holder_type: 'LEGAL',
      id_doc_type: 'IDENTIFICATION_TYPE_IDCARD',
      id_card_info: { id_card_copy: '', id_card_national: '', id_card_name: '', id_card_number: '', id_card_address: '', card_period_begin: '', card_period_end: '' },
    },
  },
  business_info: { merchant_shortname: '', service_phone: '' },
  settlement_info: { settlement_id: 0 as number | string, qualification_type: '', qualifications: [] as string[] },
  bank_account_info: { bank_account_type: '', account_name: '', account_bank: '', account_bank_code: '', account_number: '', bank_name: '', bank_branch_id: '' },
  addition_info: { legal_person_commitment: '', legal_person_video: '', business_addition_pics: [] as string[], business_addition_msg: '' },
};

type Props = { initialData?: any; onSuccess: () => void; onCancel: () => void };

export function ApplyForm({ initialData, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const DRAFT_KEY = 'wechat_applyment_draft';

  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? { ...defaultValues, ...initialData }
      : (loadDraft() || defaultValues),
  });

  const { trigger, handleSubmit, watch } = form;

  const onValidationError = (errs: any) => {
    console.error('表单验证失败:', errs);
    const firstMsg = Object.values(errs).find((v: any) => v?.message) as any;
    if (firstMsg?.message) toast.error(firstMsg.message);
  };
  const formValues = watch();

  // 自动保存草稿
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(formValues)); } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [formValues]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    Object.entries(defaultValues).forEach(([key, val]) => {
      form.setValue(key as any, val as any);
    });
  };

  const SUBJECT_TYPES_NEED_LICENSE = ['SUBJECT_TYPE_INDIVIDUAL', 'SUBJECT_TYPE_ENTERPRISE'];
  const subjectType = watch('subject_info.subject_type');
  const showLicense = SUBJECT_TYPES_NEED_LICENSE.includes(subjectType);

  const stepFields: Record<number, (keyof typeof schema.shape)[]> = {
    0: ['contact_info'],
    1: ['subject_info'],
    2: ['business_info'],
    3: ['settlement_info', 'bank_account_info'],
  };

  // 从嵌套表单错误中提取第一个错误消息
  const findFirstError = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'object' && obj.message) return obj.message;
    for (const key of Object.keys(obj)) {
      if (key === 'message' && typeof obj[key] === 'string') return obj[key];
      if (typeof obj[key] === 'object') {
        const found = findFirstError(obj[key]);
        if (found) return found;
      }
    }
    return null;
  };

  const nextStep = async () => {
    const valid = await trigger(stepFields[step] as any);
    if (valid) {
      setStep((s) => Math.min(s + 1, 3));
    } else {
      const msg = findFirstError(form.formState.errors);
      if (msg) toast.error(msg);
    }
  };

  const onSubmit = async (data: any) => {
    // 构建完整请求体
    const formData: any = { ...data };
    if (!showLicense) {
      delete formData.subject_info.business_license_info;
    } else {
      const bl = data.subject_info?.business_license_info;
      if (!bl?.license_copy) { toast.error('请上传营业执照照片'); return; }
      if (!bl?.license_number) { toast.error('请输入营业执照注册号'); return; }
      if (!bl?.merchant_name) { toast.error('请输入商户名称'); return; }
      if (!bl?.legal_person) { toast.error('请输入法人姓名'); return; }
      if (!bl?.period_begin) { toast.error('请选择营业执照有效期开始'); return; }
      if (!bl?.period_end) { toast.error('请选择有效期结束或勾选长期有效'); return; }
    }
    formData.business_info = {
      ...formData.business_info,
      sales_info: {
        sales_scenes_type: ['SALES_SCENES_WEB'],
        web_info: { domain: 'https://store.tpzl88.com' },
      },
    };
    // 结算规则根据主体类型硬编码
    formData.settlement_info = {
      settlement_id: subjectType === 'SUBJECT_TYPE_ENTERPRISE' ? 716 : 719,
      qualification_type: '休闲娱乐/旅游服务',
      qualifications: data.settlement_info?.qualifications || [],
    };
    // 清理空的补充材料
    const add = formData.addition_info;
    if (add && !add.legal_person_commitment && !add.legal_person_video && add.business_addition_pics?.length === 0 && !add.business_addition_msg) {
      delete formData.addition_info;
    }

    setSubmitting(true);
    try {
      await submitApplyment(formData as ApplyFormData);
      clearDraft();
      toast.success('申请已提交，请等待审核');
      onSuccess();
    } catch (e: any) {
      toast.error(e?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>特约商户进件申请
            {loadDraft() && (
              <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                已恢复草稿
              </span>
            )}
          </CardTitle>
          <Button type="button" variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-red-500" onClick={clearDraft}>清除草稿</Button>
          {/* 进度条 */}
          <div className="flex gap-1 mt-3">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-xs py-1.5 rounded-lg cursor-pointer transition-colors ${
                  i === step
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : i < step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
                onClick={() => i < step && setStep(i)}
              >
                {i < step ? '✓ ' : ''}
                {s.title}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">{steps[step].desc}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, onValidationError)} className="space-y-6">
            {/* 步骤 0: 联系人 */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    * 联系人类型
                  </label>
                  <select
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    {...form.register('contact_info.contact_type')}
                  >
                    <option value="">请选择</option>
                    <option value="LEGAL">法人</option>
                    <option value="SUPER">经办人</option>
                  </select>
                </div>
                {[
                  { id: 'contact_name', label: '联系人姓名', ph: '请输入联系人姓名', max: 30 },
                  { id: 'contact_id_number', label: '身份证号码', ph: '请输入身份证号码', max: 18 },
                  { id: 'mobile_phone', label: '手机号码', ph: '请输入手机号码', max: 11 },
                  { id: 'contact_email', label: '邮箱地址', ph: '请输入邮箱地址', max: 50 },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="text-sm font-medium mb-1 block">* {f.label}</label>
                    <input
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50"
                      placeholder={f.ph}
                      maxLength={f.max}
                      {...form.register(`contact_info.${f.id}` as any)}
                    />
                    {/* errors handled by react-hook-form runtime; use any cast since fields are dynamic */}
                  </div>
                ))}
              </div>
            )}

            {/* 步骤 1: 主体资料 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">* 主体类型</label>
                  <select
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    {...form.register('subject_info.subject_type')}
                  >
                    <option value="">请选择</option>
                    <option value="SUBJECT_TYPE_INDIVIDUAL">个体工商户</option>
                    <option value="SUBJECT_TYPE_ENTERPRISE">企业</option>
                    <option value="SUBJECT_TYPE_MICRO">小微商户</option>
                  </select>
                </div>

                {/* 营业执照（个体/企业才显示） */}
                {showLicense && (
                  <div className="space-y-4 p-4 border rounded-xl bg-slate-50">
                    <p className="text-sm font-semibold text-slate-700">营业执照信息</p>
                    {[
                      { id: 'business_license_info.license_number', label: '注册号/统一社会信用代码' },
                      { id: 'business_license_info.merchant_name', label: '商户名称' },
                      { id: 'business_license_info.legal_person', label: '法人姓名' },
                      { id: 'business_license_info.license_address', label: '注册地址' },
                    ].map((f) => (
                      <div key={f.id}>
                        <label className="text-sm font-medium mb-1 block">* {f.label}</label>
                        <input
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                          placeholder={`请输入${f.label}`}
                          {...form.register(`subject_info.${f.id}` as any)}
                        />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">* 有效期开始</label>
                        <input
                          type="date"
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                          {...form.register('subject_info.business_license_info.period_begin')}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">* 有效期结束</label>
                        <input
                          type="date"
                          className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                          disabled={form.watch('subject_info.business_license_info.period_end') === '长期'}
                          {...form.register('subject_info.business_license_info.period_end')}
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        checked={form.watch('subject_info.business_license_info.period_end') === '长期'}
                        onChange={(e) => {
                          form.setValue('subject_info.business_license_info.period_end', e.target.checked ? '长期' : '');
                        }}
                      />
                      <span className="text-sm text-slate-600">长期有效</span>
                    </label>
                  {/* 营业执照照片 */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">* 营业执照照片</label>
                    <input type="file" accept="image/jpeg,image/png,image/bmp"
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const fd = new FormData(); fd.append('file', file); fd.append('type', 'wechat_applyment');
                        try {
                          const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
                          const data = await res.json();
                          if (data.code === 1 && data.data?.media_id) form.setValue('subject_info.business_license_info.license_copy', data.data.media_id);
                        } catch { toast.error('图片上传失败，请重试'); }
                      }}
                    />
                    {form.watch('subject_info.business_license_info.license_copy') && <p className="text-xs text-green-600 mt-1">✓ 已上传</p>}
                  </div>
                </div>
                )}

                {/* 法人证件 */}
                <div className="space-y-4 p-4 border rounded-xl bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">法人证件信息</p>
                  {[
                    { id: 'identity_info.id_card_info.id_card_name', label: '身份证姓名' },
                    { id: 'identity_info.id_card_info.id_card_number', label: '身份证号码' },
                    { id: 'identity_info.id_card_info.id_card_address', label: '身份证地址' },
                  ].map((f) => (
                    <div key={f.id}>
                      <label className="text-sm font-medium mb-1 block">* {f.label}</label>
                      <input
                        className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                        placeholder={`请输入${f.label}`}
                        {...form.register(`subject_info.${f.id}` as any)}
                      />
                    </div>
                  ))}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">* 有效期开始</label>
                      <input
                        type="date"
                        className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                        {...form.register('subject_info.identity_info.id_card_info.card_period_begin')}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">* 有效期结束</label>
                      <input
                        type="date"
                        className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                        disabled={form.watch('subject_info.identity_info.id_card_info.card_period_end') === '长期'}
                        {...form.register('subject_info.identity_info.id_card_info.card_period_end')}
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={form.watch('subject_info.identity_info.id_card_info.card_period_end') === '长期'}
                      onChange={(e) => {
                        form.setValue(
                          'subject_info.identity_info.id_card_info.card_period_end',
                          e.target.checked ? '长期' : ''
                        );
                      }}
                    />
                    <span className="text-sm text-slate-600">长期有效</span>
                  </label>

                  {/* 身份证照片上传 */}
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">* 身份证人像面</label>
                      <input type="file" accept="image/jpeg,image/png,image/bmp"
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const fd = new FormData(); fd.append('file', file); fd.append('type', 'wechat_applyment');
                          try {
                            const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.code === 1 && data.data?.media_id) form.setValue('subject_info.identity_info.id_card_info.id_card_copy', data.data.media_id);
                          } catch {}
                        }}
                      />
                      {form.watch('subject_info.identity_info.id_card_info.id_card_copy') && <p className="text-xs text-green-600 mt-1">✓ 已上传</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">* 身份证国徽面</label>
                      <input type="file" accept="image/jpeg,image/png,image/bmp"
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const fd = new FormData(); fd.append('file', file); fd.append('type', 'wechat_applyment');
                          try {
                            const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.code === 1 && data.data?.media_id) form.setValue('subject_info.identity_info.id_card_info.id_card_national', data.data.media_id);
                          } catch {}
                        }}
                      />
                      {form.watch('subject_info.identity_info.id_card_info.id_card_national') && <p className="text-xs text-green-600 mt-1">✓ 已上传</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 步骤 2: 经营信息 */}
            {step === 2 && (
              <div className="space-y-4">
                {[
                  { id: 'business_info.merchant_shortname', label: '商户简称', ph: '支付时展示的名称', max: 20 },
                  { id: 'business_info.service_phone', label: '客服电话', ph: '请输入客服电话', max: 20 },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="text-sm font-medium mb-1 block">* {f.label}</label>
                    <input
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50"
                      placeholder={f.ph}
                      maxLength={f.max}
                      {...form.register(f.id as any)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 步骤 3: 结算账户 */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">* 账户类型</label>
                  <select
                    className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white"
                    {...form.register('bank_account_info.bank_account_type')}
                  >
                    <option value="">请选择</option>
                    <option value="BANK_ACCOUNT_TYPE_CORPORATE">对公银行账户</option>
                    <option value="BANK_ACCOUNT_TYPE_PERSONAL">个人银行卡</option>
                  </select>
                </div>
                {[
                  { id: 'bank_account_info.account_name', label: '开户名称', ph: '请输入开户名称' },
                  { id: 'bank_account_info.account_number', label: '银行账号', ph: '请输入银行账号' },
                ].map((f) => (
                  <div key={f.id}>
                    <label className="text-sm font-medium mb-1 block">* {f.label}</label>
                    <input
                      className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50"
                      placeholder={f.ph}
                      {...form.register(f.id as any)}
                    />
                  </div>
                ))}
                {/* 银行选择器 — 三级联动（账户类型→银行→省份→城市→支行） */}
                <BankSelector />
                {/* 结算规则 — 根据主体类型自动确定，提交时硬编码为整数 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">结算规则ID</label>
                    <div className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50 text-slate-600 flex items-center">
                      {subjectType === 'SUBJECT_TYPE_ENTERPRISE' ? '716 — 企业' : subjectType === 'SUBJECT_TYPE_INDIVIDUAL' ? '719 — 个体户' : '请先在步骤1选择主体类型'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">根据主体类型自动匹配，无需填写</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">所属行业</label>
                    <div className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-slate-50 text-slate-600 flex items-center">
                      休闲娱乐/旅游服务
                    </div>
                    <p className="text-xs text-slate-400 mt-1">固定为休闲娱乐类，不可修改</p>
                  </div>
                </div>

                {/* 补充材料（选填） */}
                <div className="mt-6 p-4 border rounded-xl bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700 mb-3">补充材料（选填）</p>
                  {[
                    { id: 'addition_info.legal_person_commitment', label: '法定代表人开户承诺函(media_id)', ph: '选填' },
                    { id: 'addition_info.legal_person_video', label: '法定代表人开户意愿视频(media_id)', ph: '选填' },
                    { id: 'addition_info.business_addition_msg', label: '补充说明', ph: '若被驳回需补充资金来源信息时填写' },
                  ].map((f) => (
                    <div key={f.id} className="mb-3">
                      <label className="text-sm font-medium mb-1 block">{f.label}</label>
                      <input className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white" placeholder={f.ph} {...form.register(f.id as any)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            <div className="flex gap-4 pt-6 border-t">
              {step > 0 && (
                <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1">
                  上一步
                </Button>
              )}
              {step < 3 && (
                <Button type="button" onClick={nextStep} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  下一步
                </Button>
              )}
              {step === 3 && (
                <button type="button" disabled={submitting} onClick={() => onSubmit(form.getValues())} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50">
                  {submitting ? '提交中...' : '提交申请'}
                </button>
              )}
              {step === 0 && (
                <Button type="button" variant="ghost" onClick={onCancel}>
                  取消
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}
