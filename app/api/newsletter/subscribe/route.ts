import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, is_active')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { message: 'already_subscribed' },
          { status: 200 }
        );
      } else {
        // Reactivate if they unsubscribed before
        await supabase
          .from('newsletter_subscribers')
          .update({ is_active: true })
          .eq('email', cleanEmail);

        return NextResponse.json(
          { message: 'resubscribed' },
          { status: 200 }
        );
      }
    }

    // Insert new subscriber
    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: cleanEmail,
        source: 'website'
      });

    if (error) throw error;

    // Send welcome email
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
      await fetch(
        `${siteUrl}/api/newsletter/welcome`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        }
      );
    } catch (welcomeErr) {
      console.warn('Welcome email dispatch warning:', welcomeErr);
    }

    return NextResponse.json(
      { message: 'subscribed' },
      { status: 201 }
    );

  } catch (error) {
    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}
