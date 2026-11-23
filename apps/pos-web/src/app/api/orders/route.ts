import { NextResponse } from 'next/server';
import type { Order, OrderItem } from '@/types';

// In-memory storage
const orders: Order[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableId = searchParams.get('tableId');
  const sessionId = searchParams.get('sessionId');

  let filtered = orders;

  if (tableId) {
    filtered = filtered.filter((o) => o.tableId === tableId);
  }

  if (sessionId) {
    filtered = filtered.filter((o) => o.sessionId === sessionId);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableId, sessionId, items, remarks } = body;

    if (!tableId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid order data' },
        { status: 400 }
      );
    }

    const totalAmount = items.reduce(
      (sum: number, item: OrderItem) => sum + item.subtotal,
      0
    );

    const order: Order = {
      id: `o_${Date.now()}`,
      tableId,
      sessionId: sessionId || '',
      items,
      totalAmount,
      status: 'completed',
      remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'synced',
    };

    orders.push(order);

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
