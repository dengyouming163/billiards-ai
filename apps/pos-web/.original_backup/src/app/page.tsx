'use client';

import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { TableBoard } from '@/components/TableBoard';
import { TableDrawer } from '@/components/TableDrawer';
import { QuickPanel } from '@/components/QuickPanel';
import { HeaderBar } from '@/components/HeaderBar';
import { StatusBar, NetworkBanner } from '@/components/StatusBar';
import { OpenTableModal } from '@/components/OpenTableModal';
import ProductOrderModal from '@/components/ProductOrderModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { MemberModal } from '@/components/MemberModal';
import { ShiftModal } from '@/components/ShiftModal';
import { AssistantModal } from '@/components/AssistantModal';
import { TransferMergeModal } from '@/components/TransferMergeModal';
import PackageModal from '@/components/PackageModal';
import ReservationModal from '@/components/ReservationModal';
import StatisticsModal from '@/components/StatisticsModal';
import TechnicianModal from '@/components/TechnicianModal';
import PromotionBanner from '@/components/PromotionBanner';
import { QuickOrderModal } from '@/components/QuickOrderModal';
import HistoryOrdersModal from '@/components/HistoryOrdersModal';
import type { Table } from '@/types';

// Modal state type
type ModalType = 'none' | 'openTable' | 'quickOpen' | 'order' | 'checkout' | 'member' | 'shift' | 'assistant' | 'transfer' | 'merge' | 'package' | 'reservation' | 'statistics' | 'technician' | 'quickOrder' | 'historyOrders';

function POSContent() {
  const { state, selectedTable, dispatch, startShift } = useApp();
  
  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [targetTable, setTargetTable] = useState<Table | null>(null);
  
  // Initialize shift (simulate logged in)
  useEffect(() => {
    if (!state.currentShift) {
      startShift('op1', '收银员A', 500);
    }
  }, []);

  // Open table modal
  const handleOpenTable = (table?: Table) => {
    const t = table || selectedTable;
    if (t) {
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
    if (t && t.status === 'inuse') {
      setTargetTable(t);
      setActiveModal('checkout');
    }
  };

  // Open member modal
  const handleMember = () => {
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

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
      {/* Network banner */}
      <NetworkBanner />

      {/* Header */}
      <HeaderBar onShiftClick={handleShift} />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Table board */}
        <div className="w-[calc(100%-300px)] p-4 overflow-hidden">
          <TableBoard />
        </div>

        {/* Right - Quick panel */}
        <div className="w-64 flex-shrink-0 border-l border-[var(--color-border-subtle)]">
          <QuickPanel
            onMember={handleMember}
            onShift={handleShift}
            onPackage={() => setActiveModal('package')}
            onReservation={() => setActiveModal('reservation')}
            onStatistics={() => setActiveModal('statistics')}
            onTechnician={() => setActiveModal('technician')}
            onQuickOrder={() => setActiveModal('quickOrder')}
            onHistoryOrders={() => setActiveModal('historyOrders')}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Table drawer */}
      {selectedTable && (
        <TableDrawer
          table={selectedTable}
          onClose={handleCloseDrawer}
          onOpenTable={() => handleOpenTable(selectedTable)}
          onOrder={() => handleOrder(selectedTable)}
          onCheckout={() => handleCheckout(selectedTable)}
          onAssignAssistant={handleAssistant}
          onMember={handleMember}
          onTransfer={handleTransfer}
          onMerge={handleMerge}
        />
      )}

      {/* Modals */}
      {activeModal === 'openTable' && targetTable && (
        <OpenTableModal
          table={targetTable}
          onClose={closeModal}
          onConfirm={closeModal}
        />
      )}

      {activeModal === 'quickOpen' && targetTable && (
        <OpenTableModal
          table={targetTable}
          quickStart
          onClose={closeModal}
          onConfirm={closeModal}
        />
      )}

      {activeModal === 'order' && targetTable && (
        <ProductOrderModal
          tableId={targetTable.id}
          tableName={targetTable.name}
          onClose={closeModal}
        />
      )}

      {activeModal === 'checkout' && targetTable && (
        <CheckoutModal
          table={targetTable}
          onClose={closeModal}
          onComplete={closeModal}
        />
      )}

      {activeModal === 'member' && (
        <MemberModal onClose={closeModal} />
      )}

      {activeModal === 'shift' && (
        <ShiftModal onClose={closeModal} />
      )}

      {activeModal === 'assistant' && targetTable && (
        <AssistantModal
          table={targetTable}
          onClose={closeModal}
        />
      )}

      {activeModal === 'transfer' && targetTable && (
        <TransferMergeModal
          table={targetTable}
          mode="transfer"
          onClose={closeModal}
        />
      )}

      {activeModal === 'merge' && targetTable && (
        <TransferMergeModal
          table={targetTable}
          mode="merge"
          onClose={closeModal}
        />
      )}

      {activeModal === 'package' && (
        <PackageModal onClose={closeModal} />
      )}

      {activeModal === 'reservation' && (
        <ReservationModal onClose={closeModal} />
      )}

      {activeModal === 'statistics' && (
        <StatisticsModal onClose={closeModal} />
      )}

      {activeModal === 'technician' && (
        <TechnicianModal onClose={closeModal} />
      )}

      {activeModal === 'quickOrder' && (
        <QuickOrderModal onClose={closeModal} />
      )}

      {activeModal === 'historyOrders' && (
        <HistoryOrdersModal onClose={closeModal} />
      )}
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
