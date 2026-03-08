import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useUIStore } from '../store/ui';
import { usePendingReviews, useReviewHistory } from '../hooks/useReviews';
import ReviewHistoryCard from './ReviewHistoryCard';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatPeriodLabel(type, start, end) {
  if (type === 'monthly') {
    const d = parseISO(start);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d')}`;
}

export default function ReviewHub() {
  const [tab, setTab] = useState('pending');
  const closeReviewPanel = useUIStore((s) => s.closeReviewPanel);
  const setActiveReview = useUIStore((s) => s.setActiveReview);
  const { data: pending = [], isLoading: pendingLoading } = usePendingReviews();
  const { data: history = [], isLoading: historyLoading } = useReviewHistory();

  return (
    <>
      {/* Header */}
      <div style={{ padding: '28px 32px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            Reviews
          </h2>
          <button onClick={closeReviewPanel} style={closeBtnStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          <TabButton active={tab === 'pending'} onClick={() => setTab('pending')}>
            Pending
            {pending.length > 0 && <span style={badgeStyle('orange')}>{pending.length}</span>}
          </TabButton>
          <TabButton active={tab === 'history'} onClick={() => setTab('history')}>
            History
            {history.length > 0 && <span style={badgeStyle('muted')}>{history.length}</span>}
          </TabButton>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        {tab === 'pending' ? (
          pendingLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--r-lg)' }} />)}
            </div>
          ) : pending.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No pending reviews. You're all caught up!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map((pr, i) => (
                <div
                  key={i}
                  onClick={() => setActiveReview(pr)}
                  style={pendingCardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(249,115,22,0.12)';
                    e.currentTarget.style.borderColor = 'var(--warm)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = '#FED7AA';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'var(--warm)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                        <rect x="9" y="3" width="6" height="4" rx="1"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--warm)' }}>
                        {pr.reviewType === 'weekly' ? 'Weekly Review' : 'Monthly Review'}
                      </div>
                      <div className="font-display" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
                        {formatPeriodLabel(pr.reviewType, pr.periodStart, pr.periodEnd)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                        {pr.actions.length} action{pr.actions.length !== 1 ? 's' : ''} to review
                      </div>
                    </div>
                  </div>
                  <span style={{ color: 'var(--warm)', fontSize: 18 }}>→</span>
                </div>
              ))}
            </div>
          )
        ) : (
          historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--r-lg)' }} />)}
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No completed reviews yet.</p>
            </div>
          ) : (
            <HistoryList reviews={history} />
          )
        )}
      </div>
    </>
  );
}

function HistoryList({ reviews }) {
  // Group by month
  const groups = {};
  for (const r of reviews) {
    const d = new Date(r.completed_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = { label, items: [] };
    groups[key].items.push(r);
  }

  return (
    <div>
      {Object.entries(groups).map(([key, group]) => (
        <div key={key}>
          <div style={{
            fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--text-muted)',
            margin: '24px 0 12px',
          }}>
            {group.label}
          </div>
          {group.items.map((r) => (
            <ReviewHistoryCard key={r.id} review={r} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px', fontSize: 13, fontWeight: 700,
        color: active ? 'var(--accent)' : 'var(--text-muted)',
        border: 'none', background: 'none', cursor: 'pointer',
        position: 'relative',
        fontFamily: "'Nunito', sans-serif",
        transition: 'color 0.2s',
      }}
    >
      {children}
      {active && (
        <div style={{
          position: 'absolute', bottom: -1, left: 12, right: 12,
          height: 2, background: 'var(--accent)', borderRadius: 2,
        }} />
      )}
    </button>
  );
}

const closeBtnStyle = {
  width: 36, height: 36, borderRadius: 12, border: 'none',
  background: 'var(--bg)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

const pendingCardStyle = {
  background: '#FFF7ED',
  border: '1px solid #FED7AA',
  borderRadius: 'var(--r-lg)',
  padding: '18px 20px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

function badgeStyle(variant) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: 18, height: 18, borderRadius: 'var(--r-full)',
    fontSize: 10, fontWeight: 800, marginLeft: 6, padding: '0 5px',
    background: variant === 'orange' ? 'var(--warm)' : 'var(--bg)',
    color: variant === 'orange' ? '#fff' : 'var(--text-muted)',
  };
}
