import { useState, useEffect, useRef } from 'react';
import { useUIStore } from '../store/ui';
import { useLogs, useCreateLog, useUpdateLog } from '../hooks/useLogs';
import { getPeriodLabel, formatDueDate } from '../lib/dates';

export default function LogModal() {
  const { logModal, closeLogModal } = useUIStore();
  const inputRef = useRef(null);
  if (!logModal) return null;
  return (
    <ModalBackdrop onClose={closeLogModal}>
      <ModalContent item={logModal} onClose={closeLogModal} inputRef={inputRef} />
    </ModalBackdrop>
  );
}

function ModalBackdrop({ onClose, children }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(28,25,23,0.35)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="animate-modal-in"
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)', width: 400, maxHeight: 560,
          display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ModalContent({ item, onClose, inputRef }) {
  const [value, setValue] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitState, setSubmitState] = useState('idle');
  const [editingLogId, setEditingLogId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const isBoolean = item.unit?.toLowerCase() === 'boolean';
  const { data: logs = [], isLoading: logsLoading } = useLogs(item.id, item.sourceType);
  const createLog = useCreateLog();
  const updateLog = useUpdateLog();
  const periodLabel = getPeriodLabel(item.currentPeriodStart, item.periodEnd);

  useEffect(() => { if (!isBoolean) inputRef.current?.focus(); }, [isBoolean, inputRef]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const numValue = isBoolean ? 1 : Number(value);
    if (!isBoolean && (value === '' || Number.isNaN(numValue))) return;
    setSubmitState('submitting');
    try {
      await createLog.mutateAsync({
        sourceId: item.id, sourceType: item.sourceType,
        value: numValue, logDate, entryType: isBoolean ? 'boolean' : 'numeric',
      });
      setSubmitState('success');
      setValue('');
      setTimeout(() => setSubmitState('idle'), 600);
    } catch { setSubmitState('idle'); }
  };

  const handleEdit = async (logId) => {
    const numValue = Number(editValue);
    if (editValue === '' || Number.isNaN(numValue)) return;
    try {
      await updateLog.mutateAsync({ logId, value: numValue });
      setEditingLogId(null); setEditValue('');
    } catch {}
  };

  return (
    <>
      <div style={{ padding: '22px 24px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 className="font-display" style={{ fontSize: 19, lineHeight: 1.3, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              {item.name}
            </h2>
            {periodLabel && (
              <p style={{ fontSize: 12, marginTop: 3, color: 'var(--text-muted)', fontWeight: 600 }}>{periodLabel}</p>
            )}
          </div>
          <button onClick={onClose} style={{
            marginLeft: 8, width: 30, height: 30, borderRadius: 'var(--r-sm)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{
          marginTop: 14, padding: '10px 14px', borderRadius: 'var(--r-md)',
          background: 'var(--bg)', border: '1px solid var(--border)',
        }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Current:{' '}
            <span style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {item.currentValue ?? 0}
            </span>
            {item.target != null && <span style={{ color: 'var(--text-muted)' }}> / {item.target}</span>}
            {item.unit && item.unit !== 'boolean' && ` ${item.unit}`}
          </p>
        </div>
      </div>

      <div style={{ padding: '0 24px 14px' }}>
        {isBoolean ? (
          <button onClick={handleSubmit} disabled={submitState === 'submitting'} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 'var(--r-md)', fontSize: 13.5, fontWeight: 600,
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', cursor: 'pointer', transition: 'all 0.15s',
            opacity: submitState === 'submitting' ? 0.6 : 1,
          }}>
            <span style={{
              width: 20, height: 20, borderRadius: 'var(--r-sm)',
              border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: submitState === 'success' ? 'var(--accent)' : 'transparent',
            }}>
              {submitState === 'success' && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 6 5 9 10 3" />
                </svg>
              )}
            </span>
            Mark complete for today
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input ref={inputRef} type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter value" style={{
              flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: 13.5,
              outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)',
              color: 'var(--text)', fontFamily: "'Nunito', sans-serif",
            }} />
            <button type="submit" disabled={submitState === 'submitting' || value === ''} style={{
              padding: '10px 18px', borderRadius: 'var(--r-full)', fontSize: 13,
              fontWeight: 700, color: '#fff', border: 'none',
              background: 'var(--accent)', cursor: 'pointer',
              opacity: submitState === 'submitting' || value === '' ? 0.4 : 1,
              boxShadow: 'var(--shadow-accent)', transition: 'all 0.15s',
            }}>
              {submitState === 'submitting' ? '...' : submitState === 'success' ? '✓' : 'Log'}
            </button>
          </form>
        )}

        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Date</span>
          <input type="date" value={logDate} max={new Date().toISOString().split('T')[0]} onChange={(e) => setLogDate(e.target.value)} style={{
            fontSize: 12, padding: '5px 10px', borderRadius: 'var(--r-sm)',
            outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: "'Nunito', sans-serif",
          }} />
        </div>
      </div>

      {item.recurrenceMode && item.recurrenceMode !== 'none' && item.periodEnd && item.periodType && (
        <div style={{ padding: '0 24px 14px' }}>
          <button onClick={() => {
            onClose();
            useUIStore.getState().openReviewPanel();
          }} style={{
            width: '100%', padding: '9px 14px', borderRadius: 'var(--r-md)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', transition: 'all 0.12s',
          }}>
            Open review panel
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 22px', borderTop: '1px solid var(--border)' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--text-muted)', margin: '14px 0 8px',
        }}>
          Recent entries
        </p>

        {logsLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 30 }} />)}
          </div>
        ) : logs.length === 0 ? (
          <p style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--text-muted)' }}>No entries yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {logs.map((log) => (
              <div key={log.id}>
                {editingLogId === log.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{formatDueDate(log.logDate)}</span>
                    <input type="number" step="any" value={editValue} onChange={(e) => setEditValue(e.target.value)} style={{
                      width: 70, padding: '4px 8px', borderRadius: 'var(--r-sm)', fontSize: 12,
                      outline: 'none', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)',
                    }} autoFocus />
                    <button onClick={() => handleEdit(log.id)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => { setEditingLogId(null); setEditValue(''); }} style={{ fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 56, fontWeight: 600 }}>{formatDueDate(log.logDate)}</span>
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>+{log.value} {item.unit && item.unit !== 'boolean' ? item.unit : ''}</span>
                    <button onClick={() => { setEditingLogId(log.id); setEditValue(String(log.value)); }} style={{
                      fontSize: 11, color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
                      opacity: 0.6, transition: 'opacity 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                    >edit</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
