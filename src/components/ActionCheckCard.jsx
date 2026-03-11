import { useState, useEffect } from 'react';
import { useCreateLog } from '../hooks/useLogs';
import { useUIStore } from '../store/ui';
import { usePinnedActions } from '../hooks/usePinnedActions';
import { formatDueDate } from '../lib/dates';
import { toast } from '../store/toast';

export default function ActionCheckCard({ action }) {
  const [hovered, setHovered] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const createLog = useCreateLog();
  const { isPinned, pin, unpin } = usePinnedActions();
  const pinned = isPinned(action.id);

  const currentValue = action.currentValue ?? 0;
  const isDoneToday = currentValue > 0;
  const target = action.target;
  const hasTarget = target != null && target > 0;

  const handleCheck = async (e) => {
    e.stopPropagation();
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    try {
      await createLog.mutateAsync({
        sourceId: action.id,
        sourceType: 'action',
        value: 1,
        logDate: new Date().toISOString().split('T')[0],
        entryType: 'boolean',
      });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 1200);
    } catch {
      setSaveStatus('error');
      toast.error('Failed to log');
      setTimeout(() => setSaveStatus('idle'), 1500);
    }
  };

  const handlePinClick = (e) => {
    e.stopPropagation();
    if (pinned) unpin(action.id);
    else pin(action.id);
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
        display: 'flex',
        alignItems: 'center',
        gap: 14,
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

      {/* Checkbox button */}
      <button
        onClick={handleCheck}
        onDoubleClick={(e) => e.stopPropagation()}
        style={{
          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
          border: `2.5px solid ${isDoneToday ? 'var(--success)' : 'var(--accent)'}`,
          background: isDoneToday ? 'var(--success)' : 'transparent',
          cursor: saveStatus === 'saving' ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s var(--ease-out)',
          opacity: saveStatus === 'saving' ? 0.6 : 1,
        }}
      >
        {isDoneToday && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 8 6.5 11.5 13 4.5" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: 30 }}>
        <div style={{
          fontSize: 13.5, fontWeight: 700, color: 'var(--text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontFamily: "'Bricolage Grotesque', sans-serif",
        }}>
          {action.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
          {isDoneToday ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>
              {hasTarget ? `${currentValue} / ${target}` : 'Done today'}
            </span>
          ) : (
            hasTarget && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                {currentValue} / {target}
              </span>
            )
          )}
          {action.dueDate && (
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
              Due {formatDueDate(action.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
