import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReconciliationReport as Report } from '@/lib/api/agent';
import { ReconciliationReport } from './reconciliation-report';

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    schema_version: 'reconciliation-report/v1',
    status: 'ok',
    legacy_summary: {
      total_revenue: null,
      order_count: null,
      cash_paid: null,
      wechat_paid: null,
      balance_paid: null,
      table_revenue: null,
      product_revenue: null,
      assistant_revenue: null,
      open_table_count: null,
      recharge_total: null,
    },
    recomputed: {
      order_total: { value: '100.00', refs: ['ref-orders'] },
      order_count: { value: '1', refs: ['ref-orders'] },
    },
    differences: [],
    explained: [],
    unknowns: [],
    evidence_refs: [
      {
        ref_id: 'ref-orders',
        rule_id: 'order_totals',
        source_endpoint: '/storeapi/agent.Reconciliation/shiftEvidence',
        source_ids: ['order-1'],
      },
    ],
    narrative: '系统合计一致。',
    degraded: false,
    ...overrides,
  };
}

describe('ReconciliationReport', () => {
  it.each([
    ['insufficient_data', '数据不足，无法判断'],
    ['review_required', '需要人工复核'],
  ] as const)('renders %s without claiming reconciliation passed', (status, text) => {
    render(<ReconciliationReport report={makeReport({ status })} />);
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.queryByText('对账通过')).not.toBeInTheDocument();
    expect(screen.queryByText('财务对账通过')).not.toBeInTheDocument();
  });

  it('keeps deterministic totals when narrative is degraded', () => {
    render(
      <ReconciliationReport
        report={makeReport({ degraded: true, narrative: null })}
      />
    );
    expect(screen.getByText('100.00')).toBeInTheDocument();
    expect(screen.getByText(/说明生成不可用/)).toBeInTheDocument();
  });

  it('opens evidence for a recomputed value', () => {
    const onOpenEvidence = vi.fn();
    render(<ReconciliationReport report={makeReport()} onOpenEvidence={onOpenEvidence} />);

    fireEvent.click(screen.getByRole('button', { name: '查看 订单实收 证据' }));

    expect(onOpenEvidence).toHaveBeenCalledWith(['ref-orders']);
  });

  it('shows differences, explained items and unknowns separately', () => {
    render(
      <ReconciliationReport
        report={makeReport({
          status: 'review_required',
          differences: [
            {
              code: 'CASH_FLOW_MISMATCH',
              field: 'recharge_cash_flow_total',
              legacy: '220.00',
              recomputed: '200.00',
              delta: '-20.00',
              refs: ['ref-recharges'],
            },
          ],
          explained: [
            {
              code: 'RECHARGE_GIFT',
              message: '赠送金额不是外部实收。',
              value: '20.00',
              refs: ['ref-recharges'],
            },
          ],
          unknowns: [
            {
              code: 'EXTERNAL_CONFIRMATION_REQUIRED',
              message: '仍需现金实盘与外部渠道账单。',
              attribution: 'unknown',
              refs: ['ref-shift'],
            },
          ],
        })}
      />
    );

    expect(screen.getByText(/CASH_FLOW_MISMATCH/)).toBeInTheDocument();
    expect(screen.getByText('赠送金额不是外部实收。')).toBeInTheDocument();
    expect(screen.getByText('仍需现金实盘与外部渠道账单。')).toBeInTheDocument();
  });

  it('labels ok as system totals agreeing, not financial sign-off', () => {
    render(<ReconciliationReport report={makeReport()} />);
    expect(screen.getByText(/系统核对一致/)).toBeInTheDocument();
    expect(screen.queryByText('财务对账通过')).not.toBeInTheDocument();
  });
});
