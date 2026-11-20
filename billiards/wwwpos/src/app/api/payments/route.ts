import { NextResponse } from 'next/server';
import type { Payment, PaymentMethod, Coupon } from '@/types';

// In-memory storage
const payments: Payment[] = [];

// Mock coupon validation
const mockCoupons: Record<string, Coupon> = {
  'MT2024001': {
    id: 'c1',
    code: 'MT2024001',
    name: '美团-台球2小时体验券',
    platform: 'meituan',
    originalPrice: 80,
    actualPrice: 60,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    status: 'unused',
  },
  'DY2024001': {
    id: 'c2',
    code: 'DY2024001',
    name: '抖音-畅打4小时券',
    platform: 'douyin',
    originalPrice: 120,
    actualPrice: 99,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    status: 'unused',
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  let filtered = payments;

  if (orderId) {
    filtered = filtered.filter((p) => p.orderId === orderId);
  }

  return NextResponse.json({
    success: true,
    data: filtered,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, sessionId, amount, method, couponCode, operatorId } = body;

    if (!orderId || !amount || !method || !operatorId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payment: Payment = {
      id: `p_${Date.now()}`,
      orderId,
      sessionId,
      amount,
      method: method as PaymentMethod,
      status: 'completed',
      couponCode,
      couponDiscount: couponCode ? mockCoupons[couponCode]?.actualPrice : undefined,
      createdAt: new Date().toISOString(),
      operatorId,
    };

    payments.push(payment);

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Validate coupon
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    const coupon = mockCoupons[code];

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Invalid coupon code' },
        { status: 404 }
      );
    }

    if (coupon.status === 'used') {
      return NextResponse.json(
        { success: false, error: 'Coupon has been used' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
      return NextResponse.json(
        { success: false, error: 'Coupon has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
