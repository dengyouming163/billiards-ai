'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchRunEvidence,
  type ReconciliationEvidenceRef,
} from '@/lib/api/agent';

const RULE_KINDS: Record<string, string> = {
  order_totals: 'orders',
  merge_same_shift: 'orders',
  merge_attribution: 'orders',
  order_payment_totals: 'payments',
  item_payment_excluded: 'payments',
  payment_attribution: 'payments',
  recharge_totals: 'recharges',
  recharge_cash_flow: 'recharges',
  cash_flow_attribution: 'cash_flows',
};

const KIND_ORDER = ['orders', 'payments', 'recharges', 'cash_flows'];

interface EvidenceGroup {
  kind: string;
  items: Record<string, unknown>[];
}

interface EvidenceDrawerProps {
  open: boolean;
  runId: string | null;
  refs: string[];
  evidenceRefs: ReconciliationEvidenceRef[];
  onClose: () => void;
}

function scalarColumns(items: Record<string, unknown>[]): string[] {
  if (items.length === 0) return [];
  return Object.keys(items[0]).filter((key) => {
    const value = items[0][key];
    return value === null || ['string', 'number', 'boolean'].includes(typeof value);
  });
}

export function EvidenceDrawer({
  open,
  runId,
  refs,
  evidenceRefs,
  onClose,
}: EvidenceDrawerProps) {
  const [groups, setGroups] = useState<EvidenceGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => evidenceRefs.filter((item) => refs.includes(item.ref_id)),
    [evidenceRefs, refs]
  );

  useEffect(() => {
    if (!open || !runId || selected.length === 0) {
      setGroups([]);
      return;
    }
    let cancelled = false;
    const requests = new Map<string, Set<string>>();
    for (const ref of selected) {
      const kind = RULE_KINDS[ref.rule_id];
      if (!kind || ref.source_ids.length === 0) continue;
      const bucket = requests.get(kind) ?? new Set<string>();
      ref.source_ids.forEach((id) => bucket.add(id));
      requests.set(kind, bucket);
    }
    if (requests.size === 0) {
      setGroups([]);
      return;
    }

    setLoading(true);
    setError(null);
    Promise.all(
      KIND_ORDER.filter((kind) => requests.has(kind)).map(async (kind) => ({
        kind,
        response: await fetchRunEvidence(runId, kind, Array.from(requests.get(kind) ?? [])),
      }))
    )
      .then((results) => {
        if (cancelled) return;
        setGroups(results.map(({ kind, response }) => ({ kind, items: response.items })));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : '证据加载失败');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, runId, refs, evidenceRefs, selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#333333]">证据下钻</h2>
            <p className="mt-1 text-xs text-[#999999]">
              只读业务字段，来自本次运行保存的脱敏证据快照。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#e5e5e5] px-3 py-1 text-sm text-[#666666]"
          >
            关闭
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {selected.length === 0 ? (
            <p className="text-sm text-[#999999]">没有可展示的证据引用。</p>
          ) : (
            selected.map((ref) => (
              <div
                key={ref.ref_id}
                className="rounded-xl border border-[#e5e5e5] bg-[#f7f7f7] px-3 py-2 text-xs text-[#666666]"
              >
                <p className="font-mono text-[#333333]">{ref.ref_id}</p>
                <p className="mt-1">
                  rule: <span className="font-mono">{ref.rule_id}</span>
                </p>
                <p className="mt-1 break-all">
                  source: <span className="font-mono">{ref.source_ids.join(', ') || '无'}</span>
                </p>
              </div>
            ))
          )}
        </div>

        {loading && <p className="mt-4 text-sm text-[#999999]">正在加载证据...</p>}
        {error && <p className="mt-4 text-sm text-[#C62828]">{error}</p>}

        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <section key={group.kind} className="space-y-2">
              <h3 className="text-sm font-semibold text-[#333333]">
                {group.kind}（{group.items.length}）
              </h3>
              {group.items.length === 0 ? (
                <p className="text-sm text-[#999999]">未找到对应行。</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
                  <table className="w-full text-xs">
                    <thead className="bg-[#f7f7f7] text-[#666666]">
                      <tr>
                        {scalarColumns(group.items).map((column) => (
                          <th key={column} className="px-2 py-1 text-left font-medium">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map((item, index) => (
                        <tr key={String(item.id ?? index)} className="border-t border-[#f0f0f0]">
                          {scalarColumns(group.items).map((column) => (
                            <td key={column} className="px-2 py-1 font-mono text-[#333333]">
                              {item[column] === null ? '' : String(item[column])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
