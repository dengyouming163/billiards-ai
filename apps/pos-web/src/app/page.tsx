'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { AppProvider, useApp } from '@/context/AppContext';
import { TableBoard } from '@/components/TableBoard';
import { TableDrawer } from '@/components/TableDrawer';
import { QuickPanel } from '@/components/QuickPanel';
import { HeaderBar } from '@/components/HeaderBar';
import { StatusBar, NetworkBanner } from '@/components/StatusBar';
import { OpenTableRequestsModal } from '@/components/OpenTableRequestsModal';
import { tableApi } from '@/lib/api/pos';
import type { Table } from '@/types';

// Lazy-loaded modals — only loaded when opened
const OpenTableModal = dynamic(() => import('@/components/OpenTableModal').then(m => ({ default: m.OpenTableModal })));
const ProductOrderModal = dynamic(() => import('@/components/ProductOrderModal'));
const CheckoutModal = dynamic(() => import('@/components/CheckoutModal').then(m => ({ default: m.CheckoutModal })));
const MemberModal = dynamic(() => import('@/components/MemberModal').then(m => ({ default: m.MemberModal })));
const ShiftModal = dynamic(() => import('@/components/ShiftModal').then(m => ({ default: m.ShiftModal })));
const AssistantModal = dynamic(() => import('@/components/AssistantModal').then(m => ({ default: m.AssistantModal })));
const TransferMergeModal = dynamic(() => import('@/components/TransferMergeModal').then(m => ({ default: m.TransferMergeModal })));
const OrderReminderModal = dynamic(() => import('@/components/OrderReminderModal').then(m => ({ default: m.OrderReminderModal })));
const AssistantReminderModal = dynamic(() => import('@/components/AssistantReminderModal').then(m => ({ default: m.AssistantReminderModal })));
const ReservationModal = dynamic(() => import('@/components/ReservationModal'));
const TechnicianModal = dynamic(() => import('@/components/TechnicianModal'));
const QuickOrderModal = dynamic(() => import('@/components/QuickOrderModal').then(m => ({ default: m.QuickOrderModal })));
const HistoryOrdersModal = dynamic(() => import('@/components/HistoryOrdersModal'));
const CouponVerifyModal = dynamic(() => import('@/components/CouponVerifyModal').then(m => ({ default: m.CouponVerifyModal })));
const ModalFallback = () => <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"><div className="bg-white rounded-2xl p-8 text-slate-500">加载中...</div></div>;

// Modal state type
type ModalType = 'none' | 'openTable' | 'order' | 'checkout' | 'member' | 'shift' | 'assistant' | 'transfer' | 'merge' | 'reservation' | 'technician' | 'quickOrder' | 'historyOrders' | 'orderReminder' | 'assistantReminder' | 'couponVerify';

function POSContent() {
  const { state, selectedTable, dispatch, startShift, openTable } = useApp();
  
  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [targetTable, setTargetTable] = useState<Table | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showOpenTableRequests, setShowOpenTableRequests] = useState(false);

  const refreshTables = useCallback(async () => {
    const data = await tableApi.lists();
    dispatch({ type: 'SET_TABLES', payload: data });
  }, [dispatch]);

  // 监听台桌状态变更事件（开台/关台/支付成功）→ 刷新台桌列表
  useEffect(() => {
    const handler = () => { refreshTables() }
    window.addEventListener('pos:refresh-tables', handler)
    return () => window.removeEventListener('pos:refresh-tables', handler)
  }, [refreshTables])

  // Open table modal
  const handleOpenTable = async (table?: Table, playerCount?: number) => {
    const t = table || selectedTable;
    if (!t) return;

    if (playerCount) {
      try {
        await openTable(t.id, playerCount);
        toast.success('开台成功');
        refreshTables();
        setActiveModal('none');
      } catch (e: any) {
        toast.error(e?.message || e?.msg || '开台失败，请重试');
        // modal stays open
      }
    } else {
      setTargetTable(t);
      setActiveModal('openTable');
    }
  };

  // Open order modal
  const handleOrder = (table?: Table) => {
    const t = table || selectedTable;
    if (t) {
      setTargetTable(t);
      dispatch({ type: 'SET_CART_TABLE', payload: t.id });
      setActiveModal('order');
    }
  };

  // Open checkout modal
  const handleCheckout = (table?: Table) => {
    const t = table || selectedTable;
    if (t && t.status === 'occupied') {
      setTargetTable(t);
      setActiveModal('checkout');
    }
  };

  // Open member modal
  const handleMember = (table?: Table) => {
    if (table) {
      setTargetTable(table);
    }
    setActiveModal('member');
  };

  // Open shift modal
  const handleShift = () => {
    setActiveModal('shift');
  };

  // Open assistant modal
  const handleAssistant = () => {
    if (selectedTable) {
      setTargetTable(selectedTable);
      setActiveModal('assistant');
    }
  };

  // Open transfer modal
  const handleTransfer = () => {
    if (selectedTable) {
      setTargetTable(selectedTable);
      setActiveModal('transfer');
    }
  };

  // Open merge modal
  const handleMerge = () => {
    if (selectedTable) {
      setTargetTable(selectedTable);
      setActiveModal('merge');
    }
  };

  // Close drawer
  const handleCloseDrawer = () => {
    dispatch({ type: 'SET_SELECTED_TABLE', payload: undefined });
  };

  // Handle table selection
  const handleTableSelect = (table: Table) => {
    dispatch({ type: 'SET_SELECTED_TABLE', payload: table.id });
  };

  // Close modal
  const closeModal = () => {
    setActiveModal('none');
    setTargetTable(null);
  };

  // Refresh table data after successful action
  const handleTableRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  // Close all modals and drawer after transfer/merge success
  const handleTransferMergeComplete = () => {
    setActiveModal('none');
    setTargetTable(null);
    dispatch({ type: 'SET_SELECTED_TABLE', payload: undefined });
    refreshTables();
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Network banner */}
      <NetworkBanner />

      {/* Header */}
      <HeaderBar onShiftClick={handleShift} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Table board */}
        <div className="flex-1 p-4 overflow-hidden">
          <TableBoard onRefresh={refreshTables} />
        </div>

        {/* Right - Quick panel */}
        <div className="w-[340px] border-l border-[var(--color-border-subtle)]">
          <QuickPanel
            onMember={handleMember}
            onShift={handleShift}
            onReservation={() => setActiveModal('reservation')}
            onTechnician={() => setActiveModal('technician')}
            onQuickOrder={() => setActiveModal('quickOrder')}
            onHistoryOrders={() => setActiveModal('historyOrders')}
            onOrderReminder={() => setActiveModal('orderReminder')}
            onAssistantReminder={() => setActiveModal('assistantReminder')}
            onCouponVerify={() => setActiveModal('couponVerify')}
            onOpenTableRequests={() => setShowOpenTableRequests(true)}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Table drawer */}
      {selectedTable && (
        <TableDrawer
          key={refreshKey}
          table={selectedTable}
          onClose={handleCloseDrawer}
          onOpenTable={() => handleOpenTable(selectedTable)}
          onOrder={() => handleOrder(selectedTable)}
          onCheckout={() => handleCheckout(selectedTable)}
          onAssignAssistant={handleAssistant}
          onMember={() => handleMember(selectedTable)}
          onTransfer={handleTransfer}
          onMerge={handleMerge}
        />
      )}

      {/* Modals — lazy loaded with Suspense */}
      <Suspense fallback={<ModalFallback />}>
      {activeModal === 'openTable' && targetTable && (
        <OpenTableModal
          table={targetTable}
          onClose={closeModal}
          onConfirm={(playerCount) => handleOpenTable(targetTable, playerCount)}
        />
      )}

      {activeModal === 'order' && targetTable && (
        <ProductOrderModal
          tableId={targetTable.id}
          tableName={targetTable.name}
          onClose={closeModal}
          orderId={targetTable?.currentSession?.orderId}
        />
      )}

      {activeModal === 'checkout' && targetTable && (
        <CheckoutModal
          key={`checkout-${targetTable.id}-${refreshKey}`}
          table={targetTable}
          onClose={closeModal}
          onComplete={() => { closeModal(); setRefreshKey(k => k + 1); }}
        />
      )}

      {activeModal === 'member' && (
        <MemberModal
          table={targetTable ?? undefined}
          onClose={closeModal}
          onSuccess={handleTableRefresh}
        />
      )}

      {activeModal === 'shift' && (
        <ShiftModal onClose={closeModal} />
      )}

      {activeModal === 'assistant' && targetTable && (
        <AssistantModal
          table={targetTable}
          onClose={closeModal}
          onSuccess={handleTableRefresh}
          orderId={targetTable?.currentSession?.orderId}
        />
      )}

      {activeModal === 'transfer' && targetTable && (
        <TransferMergeModal
          table={targetTable}
          mode="transfer"
          onClose={closeModal}
          onSuccess={handleTableRefresh}
          onComplete={handleTransferMergeComplete}
          orderId={targetTable?.currentSession?.orderId}
        />
      )}

      {activeModal === 'merge' && targetTable && (
        <TransferMergeModal
          table={targetTable}
          mode="merge"
          onClose={closeModal}
          onSuccess={handleTableRefresh}
          onComplete={handleTransferMergeComplete}
          orderId={targetTable?.currentSession?.orderId}
        />
      )}

      {activeModal === 'orderReminder' && (
        <OrderReminderModal
          onClose={closeModal}
          onSuccess={handleTableRefresh}
        />
      )}

      {activeModal === 'assistantReminder' && (
        <AssistantReminderModal
          onClose={closeModal}
          onSuccess={handleTableRefresh}
        />
      )}

      {activeModal === 'reservation' && (
        <ReservationModal onClose={closeModal} />
      )}

      {activeModal === 'technician' && (
        <TechnicianModal onClose={closeModal} />
      )}

      {activeModal === 'quickOrder' && (
        <QuickOrderModal onClose={closeModal} onSuccess={handleTableRefresh} />
      )}

      {activeModal === 'historyOrders' && (
        <HistoryOrdersModal onClose={closeModal} />
      )}

      {activeModal === 'couponVerify' && (
        <CouponVerifyModal
          onClose={closeModal}
          onVerified={() => {
            closeModal();
            handleTableRefresh();
          }}
        />
      )}
      <OpenTableRequestsModal
        open={showOpenTableRequests}
        onClose={() => setShowOpenTableRequests(false)}
      />
      </Suspense>
    </div>
  );
}

export default function POSPage() {
  return (
    <AppProvider>
      <POSContent />
    </AppProvider>
  );
}
