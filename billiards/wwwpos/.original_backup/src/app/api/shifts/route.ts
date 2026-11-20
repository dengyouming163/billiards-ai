import { NextResponse } from 'next/server';
import type { Shift } from '@/types';

// In-memory storage
const shifts: Shift[] = [];
let currentShift: Shift | null = null;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  if (status === 'open') {
    if (currentShift) {
      return NextResponse.json({
        success: true,
        data: currentShift,
      });
    }
    return NextResponse.json({
      success: true,
      data: null,
    });
  }

  return NextResponse.json({
    success: true,
    data: shifts,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, operatorId, operatorName, openingCash, closingCash } = body;

    switch (action) {
      case 'start': {
        if (currentShift) {
          return NextResponse.json(
            { success: false, error: 'A shift is already in progress' },
            { status: 400 }
          );
        }

        currentShift = {
          id: `sh_${Date.now()}`,
          operatorId,
          operatorName,
          startTime: new Date().toISOString(),
          openingCash: openingCash || 0,
          totalSales: 0,
          totalOrders: 0,
          cashSales: 0,
          electronicSales: 0,
          memberRecharge: 0,
          couponCount: 0,
          openTables: 0,
          closeTables: 0,
          status: 'open',
        };

        return NextResponse.json({
          success: true,
          data: currentShift,
        });
      }

      case 'end': {
        if (!currentShift) {
          return NextResponse.json(
            { success: false, error: 'No shift in progress' },
            { status: 400 }
          );
        }

        const completedShift: Shift = {
          ...currentShift,
          endTime: new Date().toISOString(),
          closingCash: closingCash || 0,
          cashDifference: (closingCash || 0) - currentShift.openingCash,
          status: 'closed',
        };

        shifts.push(completedShift);
        currentShift = null;

        return NextResponse.json({
          success: true,
          data: completedShift,
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
