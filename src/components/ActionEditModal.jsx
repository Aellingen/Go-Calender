import { useState, useEffect } from 'react';
import { useUpdateAction, useDeleteAction, useActions } from '../hooks/useActions';
import DatePicker from './DatePicker';

export default function ActionEditModal({ action, onClose }) {
  const updateAction = useUpdateAction();
  const deleteAction = useDeleteAction();
  const { data: allActions = [] } = useActions();
  const [name, setName] = useState(action.name || '');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [mode, setMode] = useState(action.mode || 'counted');
  const [target, setTarget] = useState(action.target != null ? String(action.target) : '');
  const [dueDate, setDueDate] = useState(action.dueDate || '');
  const [periodType, setPeriodType] = useState(action.periodType || '');
  const [lateralLinkTargetId, setLateralLinkTargetId] = useState(action.lateralLinkTargetId || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  useEffect(() => {
    if (periodType === 'weekly' || periodType === 'monthly') setDueDate('');
  }, [periodType]);

  const handleSave = async () => {
    setSaving(true);
    const data = {};
    if (name.trim() && name.trim() !== action.name) data.name = name.trim();
    if (mode !== (action.mode || 'counted')) data.mode = mode;
    if (mode === 'counted') {
      if (target !== (action.target != null ? String(action.target) : '')) data.target = target ? Number(target) : null;
    } else {
      if (action.target != null) data.target = null;
    }
    const effectiveDueDate = dueDate === 'open-ended' ? '' : dueDate;
    if (effectiveDueDate !== (action.dueDate || '')) data.dueDate = effectiveDueDate || null;
    if (periodType !== (action.periodType || '')) data.periodType = periodType || null;
    if (lateralLinkTargetId !== (action.lateralLinkTargetId || '')) {
      data.lateralLinkTargetId = lateralLinkTargetId || null;
      data.lateralLinkType = lateralLinkTargetId ? 'value' : null;
    }
    if (Object.keys(data).length > 0) {
      try { await updateAction.mutateAsync({ actionId: action.id, ...data }); } catch {}
    }
    setSaving(false);
    onClose();
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(28,25,23,0.35)', backdropFilter: 'blur(4px)',
        zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in"
        style={{
          width: 400, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-2xl)',
          boxShadow: 'var(--shadow-lg)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '22px 24px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 className="font-display" style={{ fontSize: 17, color: 'var(--text)', margin: 0 }}>Edit Action</h3>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 'var(--r-sm)',
            background: 'var(--bg)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Mode">
            <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="simple">Checkbox</option>
              <option value="counted">Counted</option>
            </select>
          </Field>
          {mode === 'counted' && (
            <Field label="Target">
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle} />
            </Field>
          )}
          <Field label="Due Date">
            {periodType === 'weekly' || periodType === 'monthly' ? (
              <div style={{ ...inputStyle, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                {periodType === 'weekly' ? 'Resets every Sunday' : 'Resets at end of month'}
              </div>
            ) : (
              <DatePicker value={dueDate} onChange={setDueDate} />
            )}
          </Field>
          <Field label="Recurring">
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">None</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          {mode === 'counted' && (
            <Field label="Feeds into">
              <select value={lateralLinkTargetId} onChange={(e) => setLateralLinkTargetId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">None</option>
                {allActions.filter((a) => a.status === 'active' && a.mode === 'counted' && a.id !== action.id).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={() => setDeleteConfirm(true)} style={{
              flex: 1, background: 'var(--danger, #dc2626)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-full)', padding: '10px 0',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Delete
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              flex: 1, background: 'var(--accent)', color: '#fff',
              border: 'none', borderRadius: 'var(--r-full)', padding: '10px 0',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: saving ? 0.6 : 1, boxShadow: 'var(--shadow-accent)',
            }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirm(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(28,25,23,0.4)', backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-modal-in"
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-2xl)', padding: '28px 32px',
              width: 340, textAlign: 'center', boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r-lg)',
              background: 'var(--danger-light, #fef2f2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger, #dc2626)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </div>
            <h3 className="font-display" style={{ fontSize: 18, color: 'var(--text)', margin: '0 0 6px' }}>
              Delete action?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
              This will permanently delete <strong>{action.name}</strong> and its logs.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(false)} style={{
                padding: '9px 22px', borderRadius: 'var(--r-full)', fontSize: 13,
                fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={async () => {
                try { await deleteAction.mutateAsync(action.id); } catch {}
                onClose();
              }} style={{
                padding: '9px 22px', borderRadius: 'var(--r-full)', fontSize: 13,
                fontWeight: 700, color: '#fff', background: 'var(--danger, #dc2626)',
                border: 'none', cursor: 'pointer',
              }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13.5,
  color: 'var(--text)', outline: 'none', width: '100%',
  fontFamily: "'Nunito', sans-serif",
};
