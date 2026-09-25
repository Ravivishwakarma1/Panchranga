'use client';

import { useState } from 'react';
import PanchrangaLoader from './PanchrangaLoader';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.message === 'already_subscribed') {
          setStatus('success');
          setMessage("You're already subscribed! 🎉");
        } else {
          setStatus('success');
          setMessage('Subscribed! First edition arrives tomorrow at 7 AM IST.');
          setEmail('');
        }
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Something went wrong. Try again.');
    }
  }

  return (
    <div style={{
      background: '#1A1A1A',
      padding: '32px',
      borderRadius: '8px',
      maxWidth: '480px',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <p style={{
        margin: '0 0 4px 0',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: 700,
        color: '#C0392B',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Daily Newsletter
      </p>
      <h3 style={{
        margin: '0 0 8px 0',
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
        color: 'white',
        fontWeight: 700
      }}>
        Every Color, Every Morning
      </h3>
      <p style={{
        margin: '0 0 20px 0',
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        color: '#9CA3AF',
        lineHeight: 1.6
      }}>
        Top 3 stories of the day with 
        mainstream, grassroots and public 
        perspective — delivered at 7 AM IST.
      </p>

      {status === 'success' ? (
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#4ADE80',
          margin: 0,
          fontWeight: 500
        }}>
          ✓ {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px 16px',
                border: '1px solid #333',
                borderRadius: '4px',
                background: '#2A2A2A',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '10px 20px',
                background: '#C0392B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                cursor: status === 'loading' 
                  ? 'wait' : 'pointer',
                whiteSpace: 'nowrap',
                minWidth: '130px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {status === 'loading' ? (
                <PanchrangaLoader loading={true} size="sm" showWordmark={false} />
              ) : (
                'Subscribe →'
              )}
            </button>
          </div>

          {status === 'error' && (
            <p style={{
              margin: '8px 0 0 0',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              color: '#F87171'
            }}>
              {message}
            </p>
          )}

          <p style={{
            margin: '10px 0 0 0',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#6B6B6B'
          }}>
            Free forever · No spam · 
            Unsubscribe anytime
          </p>
        </form>
      )}
    </div>
  );
}
