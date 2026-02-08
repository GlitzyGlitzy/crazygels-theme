import { NextRequest, NextResponse } from 'next/server';
import { subscribeToList } from '@/lib/klaviyo';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, source } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    await subscribeToList({
      email: email.toLowerCase().trim(),
      firstName,
      lastName,
      source: source || 'website-footer',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Klaviyo subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again.' },
      { status: 500 }
    );
  }
}
