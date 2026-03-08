import { useState, useEffect } from 'react';
import { useUIStore } from '../store/ui';
import { useActions, useUpdateAction } from '../hooks/useActions';

export default function LateralLinkPopover() {
  const { lateralPopover, closeLateralPopover } = useUIStore();
  const updateAction = useUpdateAction();
  const { data: actions = [] } = useActions();
  const [linkType, setLinkType] = useState('value');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!lateralPopover) return;
    const handleKey = (e) => { if (e.key === 'Escape') closeLateralPopover(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lateralPopover, closeLateralPopover]);

  if (!lateralPopover) return null;

  const sourceAction = actions.find((a) => a.id === lateralPopover.sourceActionId);
  const existingLinkId = sourceAction?.lateralLinkTargetId;
  const existingLinkName = existingLinkId ? actions.find((a) => a.id === existingLinkId)?.name || 'another action' : null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await updateAction.mutateAsync({
        actionId: lateralPopover.sourceActionId,
        lateralLinkTargetId: lateralPopover.targetActionId,
        lateralLinkType: linkType,
      });
      closeLateralPopover();
    } catch { setSubmitting(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={closeLateralPopover}>
      <div
        className="animate-scale-in"
        style={{
          position: 'absolute', left: lateralPopover.x, top: lateralPopover.y,
          minWidth: 240, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
          padding: 18, boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', margin: '0 0 10px', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Link to {lateralPopover.targetName}
        </p>

        {existingLinkName && (
          <p style={{
            fontSize: 11.5, margin: '0 0 10px', padding: '8px 10px', borderRadius: 'var(--r-md)',
            background: 'var(--danger-softer)', color: 'var(--danger)',
            border: '1px solid var(--danger-light)', fontWeight: 600,
          }}>
            Replace existing link to <strong>{existingLinkName}</strong>?
          </p>
        )}

        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Link type
        </p>

        {['count', 'value'].map((type) => (
          <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, cursor: 'pointer' }}>
            <input type="radio" name="linkType" value={type} checked={linkType === type} onChange={() => setLinkType(type)} style={{ accentColor: 'var(--accent)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--text)', fontWeight: 600, textTransform: 'capitalize' }}>
              {type} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({type === 'count' ? 'each log = +1' : 'each log = +amount'})</span>
            </span>
          </label>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button onClick={handleConfirm} disabled={submitting} style={{
            padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700,
            color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer',
            opacity: submitting ? 0.5 : 1, boxShadow: 'var(--shadow-accent)',
          }}>
            {submitting ? 'Linking...' : existingLinkName ? 'Replace' : 'Confirm'}
          </button>
          <button onClick={closeLateralPopover} style={{
            padding: '7px 14px', borderRadius: 'var(--r-full)', fontSize: 12,
            color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
