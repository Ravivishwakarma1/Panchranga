import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body || {};

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Log the subscriber
    console.log('[Newsletter Subscription]:', cleanEmail);

    // If Supabase is available, attempt to record to subscribers / newsletter table if it exists
    if (supabase) {
      try {
        await supabase
          .from('newsletter_subscribers')
          .insert([{ email: cleanEmail, subscribed_at: new Date().toISOString() }]);
      } catch (dbErr) {
        // Table might not exist yet, ignore error gracefully
        console.warn('Newsletter DB insert skipped or table does not exist:', dbErr);
      }
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully' });
  } catch (error: any) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
