import { useState, useRef, useCallback } from 'react';

export default function ActionReviewCard({ action, current, onChange }) {
  const logged = action.currentValue;
  const target = action.target || 1;
  const isDirty = current !== logged;
  const isHit = current >= target;

  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const computeValFromX = useCallback((clientX) => {
    if (!trackRef.current) return current;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * target);
  }, [target, current]);

  const handleTrackClick = (e) => {
    onChange(computeValFromX(e.clientX));
  };

  const handleThumbDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const onMove = (ev) => onChange(computeValFromX(ev.clientX));
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const loggedPct = target > 0 ? (logged / target) * 100 : 0;
  const currentPct = target > 0 ? (current / target) * 100 : 0;

  // Logged fill width: show full logged bar, but if current < logged, shrink to current
  const loggedFillWidth = current >= logged
    ? Math.min(loggedPct, 100)
    : Math.min(currentPct, 100);

  // Delta fill
  let deltaLeft = 0;
  let deltaWidth = 0;
  let deltaClass = '';
  if (current > logged) {
    deltaLeft = Math.min(loggedPct, 100);
    deltaWidth = Math.min(currentPct, 100) - deltaLeft;
    deltaClass = 'increase';
  } else if (current < logged) {
    deltaLeft = Math.min(currentPct, 100);
    deltaWidth = Math.min(loggedPct, 100) - deltaLeft;
    deltaClass = 'decrease';
  }

  return (
    <div style={{
      background: isDirty ? '#FDFCFB' : '#FAFAF9',
      border: `1px solid ${isDirty ? 'var(--accent-light)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      padding: '18px 20px',
      transition: 'border-color 0.2s, background 0.2s',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div className="font-display" style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            {action.actionName}
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              marginLeft: 6, display: 'inline-block', verticalAlign: 'middle',
              background: isHit ? 'var(--success)' : 'var(--warm)',
              boxShadow: isHit
                ? '0 0 6px rgba(16,185,129,0.4)'
                : '0 0 6px rgba(249,115,22,0.3)',
            }} />
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
            {action.parentGoalName}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="font-display" style={{
            fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em',
            color: isDirty ? 'var(--accent)' : 'var(--text)',
            transition: 'color 0.2s',
          }}>
            {current}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            of {target} {action.unit}
          </div>
        </div>
      </div>

      {/* Slider row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Minus */}
        <button
          onClick={() => onChange(Math.max(0, current - 1))}
          style={stepperStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.background = 'var(--accent-softer)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = '#fff';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="2" y1="6" x2="10" y2="6"/>
          </svg>
        </button>

        {/* Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{
            flex: 1, height: 30,
            display: 'flex', alignItems: 'center',
            position: 'relative', cursor: 'pointer',
          }}
        >
          <div style={{
            width: '100%', height: 8, borderRadius: 'var(--r-full)',
            background: '#EEECE9', position: 'relative', overflow: 'hidden',
          }}>
            {/* Logged fill */}
            <div style={{
              position: 'absolute', top: 0, left: 0, height: '100%',
              width: `${loggedFillWidth}%`,
              borderRadius: 'var(--r-full)',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
              transition: 'width 0.2s',
            }} />

            {/* Delta fill */}
            {deltaWidth > 0 && (
              <div style={{
                position: 'absolute', top: 0, height: '100%',
                left: `${deltaLeft}%`,
                width: `${deltaWidth}%`,
                background: deltaClass === 'increase'
                  ? 'rgba(124, 58, 237, 0.25)'
                  : 'rgba(239, 68, 68, 0.2)',
                borderRadius: deltaClass === 'increase'
                  ? '0 9999px 9999px 0'
                  : '9999px 0 0 9999px',
                transition: 'left 0.2s, width 0.2s',
              }} />
            )}
          </div>

          {/* Logged marker (only when dirty) */}
          {isDirty && (
            <div style={{
              position: 'absolute',
              top: -4,
              left: `${Math.min(loggedPct, 100)}%`,
              width: 2, height: 16,
              background: 'var(--accent)',
              borderRadius: 1,
              opacity: 0.4,
              transform: 'translateX(-50%)',
              zIndex: 1,
              transition: 'left 0.2s',
            }} />
          )}

          {/* Thumb */}
          <div
            onMouseDown={handleThumbDown}
            style={{
              position: 'absolute',
              top: '50%',
              left: `${Math.min(currentPct, 100)}%`,
              transform: 'translate(-50%, -50%)',
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff',
              border: '2.5px solid var(--accent)',
              boxShadow: '0 1px 4px rgba(124,58,237,0.2)',
              cursor: dragging ? 'grabbing' : 'grab',
              zIndex: 2,
              transition: dragging ? 'none' : 'left 0.2s, box-shadow 0.15s',
            }}
          />
        </div>

        {/* Plus */}
        <button
          onClick={() => onChange(Math.min(target, current + 1))}
          style={stepperStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.background = 'var(--accent-softer)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = '#fff';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="2" y1="6" x2="10" y2="6"/>
            <line x1="6" y1="2" x2="6" y2="10"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

const stepperStyle = {
  width: 30, height: 30, borderRadius: 'var(--r-full)',
  border: '1.5px solid var(--border)',
  background: '#fff', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s',
  flexShrink: 0,
  color: 'var(--text-secondary)',
};
