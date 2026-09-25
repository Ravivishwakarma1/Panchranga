import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 500 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panchranga.vercel.app';

    const sendResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to Panchranga 🗞️',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="
          font-family: Inter, Arial, sans-serif;
          background: #F5F5F3;
          margin: 0;
          padding: 24px;
        ">
          <table 
            width="600" 
            style="
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              overflow: hidden;
            "
          >
            <tr>
              <td style="
                background: #1A1A1A;
                padding: 24px 32px;
              ">
                <span style="
                  font-family: Georgia, serif;
                  font-size: 24px;
                  font-weight: 800;
                  color: white;
                ">
                  Panchranga
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px;">
                <h1 style="
                  font-family: Georgia, serif;
                  font-size: 26px;
                  color: #1A1A1A;
                  margin: 0 0 16px 0;
                ">
                  You're in. 🎉
                </h1>
                <p style="
                  font-size: 15px;
                  color: #4A4A4A;
                  line-height: 1.7;
                  margin: 0 0 16px 0;
                ">
                  Every morning you'll get the 
                  top 3 Indian news stories of the day 
                  — seen from mainstream media, 
                  grassroots reporters, and public 
                  discourse, side by side.
                </p>
                <p style="
                  font-size: 15px;
                  color: #4A4A4A;
                  line-height: 1.7;
                  margin: 0 0 24px 0;
                ">
                  Your first edition arrives tomorrow 
                  at 7:00 AM IST.
                </p>
                <a 
                  href="${siteUrl}"
                  style="
                    display: inline-block;
                    padding: 12px 24px;
                    background: #C0392B;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    text-decoration: none;
                    border-radius: 4px;
                  "
                >
                  Explore today's stories →
                </a>
              </td>
            </tr>
            <tr>
              <td style="
                padding: 16px 32px;
                border-top: 1px solid #E5E5E0;
              ">
                <p style="
                  font-size: 12px;
                  color: #9CA3AF;
                  margin: 0;
                ">
                  Panchranga · Every color of 
                  the story · Open source
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (sendResult.error) {
      console.error('Resend welcome email error:', sendResult.error);
      return NextResponse.json({ error: sendResult.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
