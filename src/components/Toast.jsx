import { useToastStore } from '../store/toast';

const icons = {
  error: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="7" cy="7" r="6" />
      <line x1="7" y1="4" x2="7" y2="7.5" />
      <circle cx="7" cy="10" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  success: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="6" />
      <polyline points="4 7 6 9 10 5" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="7" cy="7" r="6" />
      <line x1="7" y1="6.5" x2="7" y2="10" />
      <circle cx="7" cy="4" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
};

const colors = {
  error: { bg: 'var(--danger-softer)', border: 'var(--danger-light)', text: 'var(--danger)' },
  success: { bg: 'var(--success-softer)', border: 'var(--success-light)', text: 'var(--success)' },
  info: { bg: 'var(--accent-softer)', border: 'var(--accent-light)', text: 'var(--accent)' },
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const c = colors[t.type] || colors.error;
        return (
          <div
            key={t.id}
            className="animate-slide-up"
            style={{
              pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px',
              borderRadius: 'var(--r-lg)',
              fontSize: 12.5, fontWeight: 600,
              boxShadow: 'var(--shadow-md)',
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.text,
              backdropFilter: 'blur(12px)',
              maxWidth: 360,
            }}
          >
            {icons[t.type]}
            <span style={{ flex: 1 }}>{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                marginLeft: 4, color: c.text, background: 'none',
                border: 'none', cursor: 'pointer', opacity: 0.6,
                display: 'flex', alignItems: 'center',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
