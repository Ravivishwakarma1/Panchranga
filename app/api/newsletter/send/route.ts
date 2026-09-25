import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Security: require a secret key so only GitHub Actions can trigger this
function validateRequest(req: Request) {
  const authHeader = req.headers.get('authorization');
  const expectedKey = process.env.NEWSLETTER_SECRET_KEY;
  if (!expectedKey) return false;
  return authHeader === `Bearer ${expectedKey}`;
}

export async function POST(req: Request) {
  if (!validateRequest(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://panchranga.vercel.app';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Step 1: Get top 3 hubs from last 24 hours
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    let { data: hubs } = await supabase
      .from('topic_hubs')
      .select(`
        id,
        title,
        ai_summary,
        last_updated_at,
        raw_items (
          id,
          og_image,
          url,
          sources (name, lane)
        )
      `)
      .gte('last_updated_at', yesterday.toISOString())
      .order('item_count', { ascending: false })
      .limit(3);

    // Fallback: If no hubs in last 24 hours, fetch latest 3 hubs
    if (!hubs || hubs.length === 0) {
      const fallback = await supabase
        .from('topic_hubs')
        .select(`
          id,
          title,
          ai_summary,
          last_updated_at,
          raw_items (
            id,
            og_image,
            url,
            sources (name, lane)
          )
        `)
        .order('last_updated_at', { ascending: false })
        .limit(3);
      hubs = fallback.data;
    }

    if (!hubs || hubs.length === 0) {
      return NextResponse.json(
        { message: 'No hubs found for today' },
        { status: 200 }
      );
    }

    // Step 2: Process each hub
    const stories = hubs.map(hub => {
      const items = (hub.raw_items as any[]) ?? [];
      const image = items.find(
        (i: any) => i.og_image
      )?.og_image ?? null;
      
      const sourceNames = [
        ...new Set(
          items
            .map((i: any) => i.sources?.name)
            .filter(Boolean)
        )
      ].slice(0, 3);

      const totalSources = items.length;

      return {
        id: hub.id,
        title: hub.title,
        summary: hub.ai_summary,
        image,
        sourceNames,
        totalSources,
        hubUrl: `${siteUrl}/hub/${encodeURIComponent(hub.id)}`
      };
    });

    // Step 3: Get all active subscribers
    const { data: subscribers } = await supabase
      .from('newsletter_subscribers')
      .select('email, unsubscribe_token')
      .eq('is_active', true);

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { message: 'No subscribers yet' },
        { status: 200 }
      );
    }

    // Step 4: Build and send emails
    const today = new Date().toLocaleDateString(
      'en-IN', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }
    );

    let successCount = 0;
    let failCount = 0;

    // Send in batches of 50 (Resend rate limit safety)
    const batchSize = 50;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (sub) => {
        try {
          const emailHtml = buildEmailHTML(
            stories, 
            today, 
            sub.unsubscribe_token,
            siteUrl
          );

          const sendResult = await resend.emails.send({
            from: fromEmail,
            to: sub.email,
            subject: `Panchranga Daily — ${today}`,
            html: emailHtml,
          });

          if (sendResult.error) {
            console.error(`Resend error sending to ${sub.email}:`, sendResult.error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(
            `Failed to send to ${sub.email}:`, err
          );
          failCount++;
        }
      }));

      // Small delay between batches
      if (i + batchSize < subscribers.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // Step 5: Log the send
    try {
      await supabase
        .from('newsletter_sends')
        .insert({
          subscriber_count: successCount,
          hub_ids: hubs.map(h => h.id),
          status: 'sent'
        });
    } catch (logErr) {
      console.warn('Failed to log newsletter send to DB:', logErr);
    }

    return NextResponse.json({
      message: 'Newsletter sent',
      sent: successCount,
      failed: failCount,
      stories: stories.length
    });

  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json(
      { error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}

// Email HTML builder function
function buildEmailHTML(
  stories: any[], 
  date: string,
  unsubscribeToken: string,
  siteUrl: string
): string {
  const unsubscribeUrl = 
    `${siteUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

  const storyBlocks = stories.map((story, i) => `
    <tr>
      <td style="padding: 0 0 32px 0;">
        ${story.image ? `
          <img 
            src="${story.image}" 
            alt="${story.title}"
            width="560"
            style="
              width: 100%;
              max-width: 560px;
              height: 240px;
              object-fit: cover;
              border-radius: 6px;
              display: block;
              margin-bottom: 16px;
            "
          />
        ` : ''}
        
        <p style="
          margin: 0 0 6px 0;
          font-family: Inter, Arial, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: #C0392B;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        ">
          Story ${i + 1} of 3
          ${story.sourceNames.length > 0 
            ? ' · ' + story.sourceNames.join(', ')
            : ''}
        </p>

        <h2 style="
          margin: 0 0 12px 0;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1A1A1A;
          line-height: 1.35;
        ">
          ${story.title}
        </h2>

        ${story.summary ? `
          <p style="
            margin: 0 0 16px 0;
            font-family: Inter, Arial, sans-serif;
            font-size: 15px;
            color: #4A4A4A;
            line-height: 1.6;
            font-style: italic;
          ">
            ${story.summary}
          </p>
        ` : ''}

        <p style="
          margin: 0 0 16px 0;
          font-family: Inter, Arial, sans-serif;
          font-size: 12px;
          color: #9CA3AF;
        ">
          ${story.totalSources} source${story.totalSources !== 1 ? 's' : ''} covering this story
        </p>

        <a 
          href="${story.hubUrl}"
          style="
            display: inline-block;
            padding: 10px 20px;
            background: #C0392B;
            color: white;
            font-family: Inter, Arial, sans-serif;
            font-size: 13px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 4px;
          "
        >
          Read full coverage →
        </a>

        ${i < stories.length - 1 ? `
          <hr style="
            border: none;
            border-top: 1px solid #E5E5E0;
            margin: 32px 0 0 0;
          "/>
        ` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Panchranga Daily — ${date}</title>
    </head>
    <body style="
      margin: 0;
      padding: 0;
      background: #F5F5F3;
      font-family: Inter, Arial, sans-serif;
    ">
      <table 
        width="100%" 
        cellpadding="0" 
        cellspacing="0"
        style="background: #F5F5F3; padding: 24px 0;"
      >
        <tr>
          <td align="center">
            <table 
              width="600" 
              cellpadding="0" 
              cellspacing="0"
              style="
                max-width: 600px;
                width: 100%;
                background: white;
                border-radius: 8px;
                overflow: hidden;
              "
            >
              <!-- HEADER -->
              <tr>
                <td style="
                  background: #1A1A1A;
                  padding: 24px 32px;
                ">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <span style="
                          font-family: Georgia, serif;
                          font-size: 24px;
                          font-weight: 800;
                          color: white;
                          letter-spacing: -0.5px;
                        ">
                          Panchranga
                        </span>
                        <span style="
                          font-family: Inter, Arial, sans-serif;
                          font-size: 10px;
                          color: #9CA3AF;
                          display: block;
                          letter-spacing: 0.15em;
                          text-transform: uppercase;
                          margin-top: 2px;
                        ">
                          पंचरंग · Every Color of the Story
                        </span>
                      </td>
                      <td align="right">
                        <span style="
                          font-family: Inter, Arial, sans-serif;
                          font-size: 12px;
                          color: #9CA3AF;
                        ">
                          ${date}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- INTRO STRIP -->
              <tr>
                <td style="
                  background: #C0392B;
                  padding: 10px 32px;
                ">
                  <p style="
                    margin: 0;
                    font-family: Inter, Arial, sans-serif;
                    font-size: 12px;
                    color: white;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                  ">
                    ↗ TODAY'S TOP 3 STORIES · MAINSTREAM + GRASSROOTS + PUBLIC DISCOURSE
                  </p>
                </td>
              </tr>

              <!-- STORIES -->
              <tr>
                <td style="padding: 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    ${storyBlocks}
                  </table>
                </td>
              </tr>

              <!-- DIVIDER -->
              <tr>
                <td style="
                  padding: 0 32px;
                  border-top: 1px solid #E5E5E0;
                ">
                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="padding: 24px 32px;">
                  <p style="
                    margin: 0 0 8px 0;
                    font-family: Inter, Arial, sans-serif;
                    font-size: 12px;
                    color: #9CA3AF;
                    line-height: 1.6;
                  ">
                    You're receiving this because you subscribed to Panchranga's daily newsletter.
                  </p>
                  <p style="
                    margin: 0;
                    font-family: Inter, Arial, sans-serif;
                    font-size: 12px;
                    color: #9CA3AF;
                  ">
                    <a 
                      href="${unsubscribeUrl}"
                      style="color: #9CA3AF;"
                    >
                      Unsubscribe
                    </a>
                    &nbsp;·&nbsp;
                    <a 
                      href="${siteUrl}"
                      style="color: #9CA3AF;"
                    >
                      Visit Panchranga
                    </a>
                    &nbsp;·&nbsp;
                    Open source · No editors · No paywall
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
