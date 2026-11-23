import { NextResponse } from 'next/server';
import type { Table, Session } from '@/types';
import { mockTables } from '@/data/mock-data';

// In-memory storage — deep clone to avoid mutating mock data source
const tables = structuredClone(mockTables);

export async function GET() {
  return NextResponse.json({
    success: true,
    data: tables,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, action, ...data } = body;

    const tableIndex = tables.findIndex((t) => t.id === tableId);
    if (tableIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Table not found' },
        { status: 404 }
      );
    }

    const table = tables[tableIndex];

    switch (action) {
      case 'open': {
        if (table.status !== 'idle') {
          return NextResponse.json(
            { success: false, error: 'Table is not available' },
            { status: 400 }
          );
        }

        const session: Session = {
          id: `s_${Date.now()}`,
          tableId,
          startTime: new Date().toISOString(),
          customerCount: data.customerCount || 1,
          assistantId: data.assistantId,
          pricingPackageId: data.pricingPackageId,
          pricingType: 'hourly',
          status: 'active',
          tableFee: 0,
          createdAt: new Date().toISOString(),
        };

        tables[tableIndex] = {
          ...table,
          status: 'occupied',
          currentSession: session,
        };

        return NextResponse.json({
          success: true,
          data: tables[tableIndex],
        });
      }

      case 'close': {
        tables[tableIndex] = {
          ...table,
          status: 'idle',
          currentSession: undefined,
        };

        return NextResponse.json({
          success: true,
          data: tables[tableIndex],
        });
      }

      case 'updateStatus': {
        tables[tableIndex] = {
          ...table,
          status: data.status,
        };

        return NextResponse.json({
          success: true,
          data: tables[tableIndex],
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
