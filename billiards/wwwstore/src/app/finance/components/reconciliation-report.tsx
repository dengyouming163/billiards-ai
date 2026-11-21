'use client';

import type { ReconciliationReport as Report } from '@/lib/api/agent';

const STATUS_LABEL: Record<Report['status'], string> = {
  insufficient_data: '数据不足，无法判断',
  review_required: '需要人工复核',
  ok: '系统核对一致（仍需外部账单确认）',
};

const STATUS_STYLE: Record<Report['status'], string> = {
  insufficient_data: 'bg-[#f7f7f7] text-[#666666] border-[#e5e5e5]',
  review_required: 'bg-[#FFF7E6] text-[#B26A00] border-[#FFE1A8]',
  ok: 'bg-[#E8F8EF] text-[#067A46] border-[#B7E8CD]',
};

const SUMMARY_FIELDS: Array<[string, string, string]> = [
  ['订单实收', 'total_revenue', 'order_total'],
  ['订单数', 'order_count', 'order_count'],
  ['现金', 'cash_paid', 'cash_total'],
  ['微信', 'wechat_paid', 'wechat_total'],
  ['余额', 'balance_paid', 'balance_total'],
  ['台费', 'table_revenue', 'table_total'],
  ['商品', 'product_revenue', 'product_total'],
  ['助教', 'assistant_revenue', 'assistant_total'],
  ['充值实收', 'recharge_total', 'recharge_total'],
];

export const DEGRADED_NARRATIVE =
  '说明生成不可用：模型服务暂不可用，确定性报告数值不受影响，请直接查看报告明细。';

interface ReconciliationReportProps {
  report: Report;
  onOpenEvidence?: (refs: string[]) => void;
}

export function ReconciliationReport({
  report,
  onOpenEvidence,
}: ReconciliationReportProps) {
  const narrative = report.narrative || (report.degraded ? DEGRADED_NARRATIVE : null);

  return (
    <div className="space-y-5" data-testid="reconciliation-report">
      <div
        role="status"
        className={`rounded-xl border px-4 py-3 text-sm font-medium ${STATUS_STYLE[report.status]}`}
      >
        {STATUS_LABEL[report.status]}
        {report.degraded ? '（说明生成已降级）' : ''}
      </div>

      {narrative && (
        <p className="rounded-xl bg-[#f7f7f7] px-4 py-3 text-sm text-[#333333] whitespace-pre-wrap">
          {narrative}
        </p>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#333333]">汇总核对</h3>
        <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
          <table className="w-full text-sm">
            <thead className="bg-[#f7f7f7] text-[#666666]">
              <tr>
                <th className="px-3 py-2 text-left font-medium">项目</th>
                <th className="px-3 py-2 text-right font-medium">签退快照</th>
                <th className="px-3 py-2 text-right font-medium">证据重算</th>
              </tr>
            </thead>
            <tbody>
              {SUMMARY_FIELDS.map(([label, legacyKey, recomputedKey]) => {
                const legacy = report.legacy_summary[legacyKey];
                const recomputed = report.recomputed[recomputedKey];
                return (
                  <tr key={label} className="border-t border-[#f0f0f0]">
                    <td className="px-3 py-2 text-[#333333]">{label}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#666666]">
                      {legacy ?? '缺失'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {recomputed ? (
                        <button
                          type="button"
                          aria-label={`查看 ${label} 证据`}
                          onClick={() => onOpenEvidence?.(recomputed.refs)}
                          className="font-mono text-[#067A46] underline decoration-dotted underline-offset-4"
                        >
                          {recomputed.value}
                        </button>
                      ) : (
                        '无法重算'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#333333]">差异</h3>
        {report.differences.length === 0 ? (
          <p className="text-sm text-[#999999]">证据可支撑的字段未发现差异。</p>
        ) : (
          <ul className="space-y-2">
            {report.differences.map((difference) => (
              <li
                key={`${difference.code}:${difference.field}`}
                className="rounded-xl border border-[#FFE1A8] bg-[#FFF7E6] px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-[#B26A00]">
                    {difference.field} · {difference.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenEvidence?.(difference.refs)}
                    className="text-xs text-[#067A46] underline"
                  >
                    查看证据
                  </button>
                </div>
                <p className="mt-1 font-mono text-[#666666]">
                  快照 {difference.legacy} → 重算 {difference.recomputed}（差异{' '}
                  {difference.delta}）
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#333333]">已解释项</h3>
        {report.explained.length === 0 ? (
          <p className="text-sm text-[#999999]">无已解释项。</p>
        ) : (
          <ul className="space-y-2">
            {report.explained.map((item) => (
              <li
                key={item.code}
                className="rounded-xl border border-[#e5e5e5] bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium text-[#333333]">{item.code}</span>
                {item.value ? (
                  <span className="ml-2 font-mono text-[#666666]">{item.value}</span>
                ) : null}
                <p className="mt-1 text-[#666666]">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-[#333333]">不确定项</h3>
        {report.unknowns.length === 0 ? (
          <p className="text-sm text-[#999999]">无不确定项。</p>
        ) : (
          <ul className="space-y-2">
            {report.unknowns.map((item) => (
              <li
                key={`${item.code}:${item.message}`}
                className="rounded-xl border border-[#e5e5e5] bg-[#f7f7f7] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[#666666]">{item.code}</span>
                <p className="mt-1 text-[#666666]">{item.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
