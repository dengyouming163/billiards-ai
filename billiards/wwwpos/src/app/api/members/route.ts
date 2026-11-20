import { NextResponse } from 'next/server';
import type { Member, MemberLevel } from '@/types';
import { mockMembers } from '@/data/mock-data';

// In-memory storage
const members: Member[] = [...mockMembers];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const phone = searchParams.get('phone');
  const id = searchParams.get('id');

  if (id) {
    const member = members.find((m) => m.id === id);
    return NextResponse.json({
      success: true,
      data: member || null,
    });
  }

  if (phone) {
    const member = members.find((m) => m.phone.includes(phone.replace(/\*/g, '')));
    return NextResponse.json({
      success: true,
      data: member || null,
    });
  }

  return NextResponse.json({
    success: true,
    data: members,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, name, level } = body;

    if (!phone || !name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existing = members.find((m) => m.phone === phone);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    const member: Member = {
      id: `m_${Date.now()}`,
      phone,
      name,
      level: level || 'normal',
      balance: 0,
      points: 0,
      totalConsume: 0,
      totalRecharge: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    members.push(member);

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, action, amount, points } = body;

    const memberIndex = members.findIndex((m) => m.id === id);
    if (memberIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    const member = members[memberIndex];

    switch (action) {
      case 'recharge': {
        const bonus = amount >= 1000 ? Math.floor(amount * 0.25) : amount >= 500 ? Math.floor(amount * 0.16) : amount >= 300 ? Math.floor(amount * 0.1) : 0;
        const earnedPoints = amount + bonus;

        members[memberIndex] = {
          ...member,
          balance: member.balance + amount + bonus,
          points: member.points + earnedPoints,
          updatedAt: new Date().toISOString(),
        };
        break;
      }

      case 'deduct': {
        if (member.balance < amount) {
          return NextResponse.json(
            { success: false, error: 'Insufficient balance' },
            { status: 400 }
          );
        }
        members[memberIndex] = {
          ...member,
          balance: member.balance - amount,
          updatedAt: new Date().toISOString(),
        };
        break;
      }

      case 'deductPoints': {
        if (member.points < points) {
          return NextResponse.json(
            { success: false, error: 'Insufficient points' },
            { status: 400 }
          );
        }
        members[memberIndex] = {
          ...member,
          points: member.points - points,
          updatedAt: new Date().toISOString(),
        };
        break;
      }

      case 'upgrade': {
        members[memberIndex] = {
          ...member,
          level: body.level as MemberLevel,
          updatedAt: new Date().toISOString(),
        };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: members[memberIndex],
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
