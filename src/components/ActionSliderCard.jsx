import { useState, useRef, useCallback, useEffect } from 'react';
import { useCreateLog } from '../hooks/useLogs';
import { useUIStore } from '../store/ui';
import { usePinnedActions } from '../hooks/usePinnedActions';
import { formatDueDate } from '../lib/dates';
import { toast } from '../store/toast';

export default function ActionSliderCard({ action }) {
  const [val, setVal] = useState(action.currentValue ?? 0);
  const [savedVal, setSavedVal] = useState(action.currentValue ?? 0);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hovered, setHovered] = useState(false);
  const dirty = val !== savedVal;
  const target = action.target ?? 1;
  const createLog = useCreateLog();
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const { isPinned, pin, unpin } = usePinnedActions();
  const pinned = isPinned(action.id);

  useEffect(() => {
    setSavedVal(action.currentValue ?? 0);
    setVal(action.currentValue ?? 0);
  }, [action.id]);

  const savedPct = Math.min(100, (savedVal / target) * 100);
  const curPct = Math.min(100, (val / target) * 100);

  const computeValFromX = useCallback((clientX) => {
    if (!trackRef.current) return val;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * target);
  }, [target, val]);

  const handleTrackClick = (e) => {
    setVal(computeValFromX(e.clientX));
  };

  const handleThumbDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
    const onMove = (ev) => setVal(computeValFromX(ev.clientX));
    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!dirty || saveStatus === 'saving') return;
    const delta = val - savedVal;
    setSaveStatus('saving');
    try {
      await createLog.mutateAsync({
        sourceId: action.id,
        sourceType: 'action',
        value: delta,
        logDate: new Date().toISOString().split('T')[0],
      });
      setSavedVal(val);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 1200);
    } catch {
      setSaveStatus('error');
      toast.error('Failed to save progress');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    if (pinned) unpin(action.id);
    else pin(action.id);
  };

  const getSaveStyle = () => {
    const base = {
      height: 30, padding: '0 14px', borderRadius: 'var(--r-full)', border: 'none',
      cursor: 'pointer', transition: 'all 0.2s var(--ease-out)',
      fontSize: 12, fontWeight: 700,
    };
    if (saveStatus === 'saving') return { ...base, background: 'var(--accent)', color: '#fff', opacity: 0.7, cursor: 'default' };
    if (saveStatus === 'success') return { ...base, background: 'var(--success)', color: '#fff' };
    if (saveStatus === 'error') return { ...base, background: 'var(--danger)', color: '#fff', animation: 'shake 0.3s ease-out' };
    if (dirty) return { ...base, background: 'var(--accent)', color: '#fff', boxShadow: 'var(--shadow-accent)' };
    return { ...base, background: 'var(--slider-bg)', color: 'var(--text-dim)', cursor: 'default', pointerEvents: 'none', opacity: 0.4 };
  };

  const getSaveLabel = () => {
    if (saveStatus === 'saving') return '…';
    if (saveStatus === 'success') return '✓';
    if (saveStatus === 'error') return '✗';
    return 'Save';
  };

  return (
    <div
      onDoubleClick={() => useUIStore.getState().openActionEdit(action)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--bg-warm)' : 'var(--bg)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 'var(--r-lg)',
        padding: '16px 18px',
        cursor: 'default',
        userSelect: 'none',
        transition: 'all 0.2s var(--ease-out)',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? 'var(--shadow)' : 'none',
        position: 'relative',
      }}
    >
      {/* Pin button */}
      <button
        onClick={handlePinClick}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 26, height: 26, borderRadius: 'var(--r-sm)',
          background: pinned ? 'var(--accent-softer)' : 'transparent',
          border: `1px solid ${pinned ? 'var(--accent-light)' : 'var(--border)'}`,
          color: pinned ? 'var(--accent)' : 'var(--text-dim)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, transition: 'all 0.15s',
          opacity: hovered || pinned ? 1 : 0,
        }}
        title={pinned ? 'Unpin action' : 'Pin action'}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={pinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 17v5" />
          <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
        </svg>
      </button>

      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingRight: 30 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}>
            {action.name}
          </div>
          {action.dueDate && (
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 3,
            }}>
              Due {formatDueDate(action.dueDate)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
          <span style={{
            fontSize: 24, fontWeight: 800, lineHeight: 1,
            color: dirty ? 'var(--accent)' : 'var(--text)',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            transition: 'color 0.15s',
          }}>
            {val}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 2, fontWeight: 600 }}>
            / {target} {action.unit || ''}
          </span>
        </div>
      </div>

      {/* Slider row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
        {/* Minus */}
        <button
          onClick={(e) => { e.stopPropagation(); setVal(Math.max(0, val - 1)); }}
          onDoubleClick={(e) => e.stopPropagation()}
          style={stepBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-light)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          −
        </button>

        {/* Track */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          style={{
            flex: 1, height: 8, background: 'var(--slider-bg)',
            borderRadius: 'var(--r-full)', position: 'relative', cursor: 'pointer',
          }}
        >
          <div style={{
            position: 'absolute', left: 0, top: 0, height: '100%',
            width: `${savedPct}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent-light))',
            borderRadius: 'var(--r-full)', zIndex: 1,
          }} />
          {val > savedVal && (
            <div style={{
              position: 'absolute', top: 0, height: '100%',
              left: `${savedPct}%`, width: `${curPct - savedPct}%`,
              background: 'var(--slider-new)',
              borderRadius: '0 var(--r-full) var(--r-full) 0', zIndex: 1,
            }} />
          )}
          <div
            onMouseDown={handleThumbDown}
            style={{
              position: 'absolute', top: '50%', left: `${curPct}%`,
              transform: 'translate(-50%, -50%)',
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff',
              border: '2.5px solid var(--accent)',
              boxShadow: '0 2px 6px rgba(124,58,237,0.2)',
              cursor: dragging ? 'grabbing' : 'grab',
              zIndex: 2, transition: 'box-shadow 0.12s',
            }}
          />
        </div>

        {/* Plus */}
        <button
          onClick={(e) => { e.stopPropagation(); setVal(Math.min(target, val + 1)); }}
          onDoubleClick={(e) => e.stopPropagation()}
          style={stepBtnStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-light)';
            e.currentTarget.style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          +
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving' || (!dirty && saveStatus === 'idle')}
          style={getSaveStyle()}
        >
          {getSaveLabel()}
        </button>
      </div>
    </div>
  );
}

const stepBtnStyle = {
  width: 30, height: 30, borderRadius: 'var(--r-sm)',
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', fontSize: 16, fontWeight: 600,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.12s',
};
