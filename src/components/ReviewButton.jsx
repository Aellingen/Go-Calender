import { usePendingReviews } from '../hooks/useReviews';
import { useUIStore } from '../store/ui';

export default function ReviewButton() {
  const { data: pending = [] } = usePendingReviews();
  const openReviewPanel = useUIStore((s) => s.openReviewPanel);
  const calendarOpen = useUIStore((s) => s.calendarOpen);
  const count = pending.length;
  const hasPending = count > 0;

  return (
    <button
      onClick={openReviewPanel}
      style={{
        position: 'fixed',
        bottom: 28,
        right: calendarOpen ? 308 : 84,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        borderRadius: 'var(--r-full)',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: '0 4px 16px rgba(120,100,80,0.12), 0 8px 32px rgba(120,100,80,0.08)',
        cursor: 'pointer',
        transition: 'all 0.3s var(--ease-out)',
        zIndex: 45,
        fontFamily: "'Nunito', sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 24px rgba(120,100,80,0.15), 0 12px 40px rgba(120,100,80,0.1)';
        e.currentTarget.style.borderColor = 'var(--accent-light)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(120,100,80,0.12), 0 8px 32px rgba(120,100,80,0.08)';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 'var(--r-sm)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hasPending ? 'var(--warm)' : 'var(--accent-softer)',
        transition: 'background 0.2s',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={hasPending ? '#fff' : 'var(--accent)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <path d="M9 14l2 2 4-4"/>
        </svg>
      </div>

      {/* Text */}
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
          Reviews
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, lineHeight: 1.2,
          color: hasPending ? 'var(--warm)' : 'var(--text-muted)',
          transition: 'color 0.2s',
        }}>
          {hasPending ? `${count} pending` : 'All caught up'}
        </div>
      </div>

      {/* Badge */}
      {hasPending && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 20, height: 20, borderRadius: '50%',
          background: 'var(--warm)', color: '#fff',
          fontSize: 11, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--surface)',
          boxShadow: '0 2px 6px rgba(249,115,22,0.3)',
        }}>
          {count}
        </div>
      )}
    </button>
  );
}
