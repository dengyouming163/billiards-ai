'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { get, post } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import { ApiResponseType } from '@/lib/api/types';
import { fetchEmployees } from '@/lib/api/employees';
import { useToast } from '@/hooks/use-toast';
import { ROLE_CONFIG } from '@/lib/types';
import type { Employee } from '@/lib/types';

interface ApprovalConfig {
  id: string;
  type: string;
  type_name: string;
  approver_ids: string[];
  approver_names: string[];
  status: string;
}

interface ApprovalTypeState {
  type: string;
  type_name: string;
  config: ApprovalConfig | null;
  approverIds: string[];
}

const APPROVAL_TYPES = [
  { type: 'checkin', type_name: '补卡申请' },
  { type: 'exchange', type_name: '换班申请' },
  { type: 'leave', type_name: '请假申请' },
  { type: 'outwork', type_name: '外勤申请' },
  { type: 'overtime', type_name: '加班申请' },
];

export default function ApprovalConfig() {
  const [approvalTypes, setApprovalTypes] = useState<ApprovalTypeState[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedType, setSelectedType] = useState<string>(APPROVAL_TYPES[0].type);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configs, allEmployees] = await Promise.all([
        get<ApprovalConfig[]>(
          API_ENDPOINTS.approvalConfigs,
          undefined,
          ApiResponseType.ARRAY
        ),
        fetchEmployees(),
      ]);

      const filteredEmployees = allEmployees.filter((emp) => emp.status === 'active');
      setEmployees(filteredEmployees);

      const configMap = new Map<string, ApprovalConfig>();
      if (Array.isArray(configs)) {
        configs.forEach((config) => {
          configMap.set(config.type, config);
        });
      }

      const typesWithConfigs: ApprovalTypeState[] = APPROVAL_TYPES.map((at) => {
        const config = configMap.get(at.type) || null;
        return {
          type: at.type,
          type_name: at.type_name,
          config,
          approverIds: config ? [...config.approver_ids] : [],
        };
      });

      setApprovalTypes(typesWithConfigs);
    } catch (error) {
      console.error('Failed to load approval config data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleApprover = (employeeId: string) => {
    setApprovalTypes((prev) =>
      prev.map((at) => {
        if (at.type !== selectedType) return at;
        const hasApprover = at.approverIds.includes(employeeId);
        return {
          ...at,
          approverIds: hasApprover
            ? at.approverIds.filter((id) => id !== employeeId)
            : [...at.approverIds, employeeId],
        };
      })
    );
  };

  const handleToggleAllApprovers = () => {
    setApprovalTypes((prev) =>
      prev.map((at) => {
        if (at.type !== selectedType) return at;
        const allEmployeeIds = employees.map((e) => e.id);
        const hasAll = allEmployeeIds.every((id) => at.approverIds.includes(id));
        return {
          ...at,
          approverIds: hasAll ? [] : allEmployeeIds,
        };
      })
    );
  };

  const handleSave = async () => {
    const current = approvalTypes.find((at) => at.type === selectedType);
    if (!current) return;

    setSaving(true);
    try {
      await post(API_ENDPOINTS.approvalConfigSave, {
        type: selectedType,
        type_name: current.type_name,
        approver_ids: current.approverIds,
        status: 'enabled',
      });
      toast({ title: '保存成功', variant: 'success' });
      await loadData();
    } catch (error) {
      console.error('Failed to save approval config:', error);
      toast({ title: '保存失败', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const currentTypeData = approvalTypes.find((at) => at.type === selectedType);
  const allSelected = employees.length > 0 && employees.every((e) => currentTypeData?.approverIds.includes(e.id));
  const selectedCount = currentTypeData?.approverIds.length || 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-12">
        <div className="flex flex-col items-center justify-center gap-3">
          <Spinner className="w-8 h-8 text-emerald-500" />
          <p className="text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">
                {approvalTypes.length}
              </p>
              <p className="text-sm text-white/80">审批类型</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">
                {employees.length}
              </p>
              <p className="text-sm text-white/80">可选审批人</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-500 to-purple-500 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono text-white">
                {approvalTypes.filter((at) => at.approverIds.length > 0).length}
              </p>
              <p className="text-sm text-white/80">已配置类型</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">审批配置</h3>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25 rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>

        <div className="flex">
          <div className="w-56 flex-shrink-0 border-r border-gray-100 bg-gray-50/50 p-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 px-3">
              审批类型
            </p>
            <div className="space-y-1">
              {APPROVAL_TYPES.map((at) => {
                const isActive = selectedType === at.type;
                const typeData = approvalTypes.find((t) => t.type === at.type);
                const count = typeData?.approverIds.length || 0;
                return (
                  <button
                    key={at.type}
                    onClick={() => setSelectedType(at.type)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-emerald-700 font-medium shadow-sm border border-gray-100'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isActive ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="flex-1 text-left">{at.type_name}</span>
                    {count > 0 && (
                      <Badge
                        variant={isActive ? 'default' : 'outline'}
                        className={`text-xs rounded-full px-2 py-0 ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'text-gray-400 border-gray-200'
                        }`}
                      >
                        {count}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-700">审批人选择</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  已选择 {selectedCount} 位审批人
                </p>
              </div>
              {employees.length > 0 && (
                <button
                  onClick={handleToggleAllApprovers}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  {allSelected ? '取消全选' : '全选'}
                </button>
              )}
            </div>

            {employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Shield className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm">暂无可选审批人</p>
                <p className="text-xs mt-1">
                  请先添加店长/财务/助教等角色员工
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {employees.map((employee) => {
                  const isChecked =
                    currentTypeData?.approverIds.includes(employee.id) ?? false;
                  const roleConfig = ROLE_CONFIG[employee.role];
                  return (
                    <label
                      key={employee.id}
                      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        isChecked
                          ? 'bg-emerald-50 border border-emerald-200'
                          : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => handleToggleApprover(employee.id)}
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${roleConfig?.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xs font-medium shadow-sm`}
                        >
                          {employee.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs text-gray-500 border-gray-200 rounded-full"
                      >
                        {roleConfig?.label || employee.role}
                      </Badge>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
