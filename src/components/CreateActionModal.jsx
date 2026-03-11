import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/ui';
import { useCreateAction, useActions } from '../hooks/useActions';
import DatePicker from './DatePicker';

export default function CreateActionModal() {
  const { createActionGoal, closeCreateAction } = useUIStore();
  if (!createActionGoal) return null;
  return (
    <ModalBackdrop onClose={closeCreateAction}>
      <FormContent goal={createActionGoal} onClose={closeCreateAction} />
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
          borderRadius: 'var(--r-2xl)', width: 400, maxHeight: 640,
          display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function FormContent({ goal, onClose }) {
  const nameRef = useRef(null);
  const createAction = useCreateAction();
  const { data: allActions = [] } = useActions();
  const [name, setName] = useState('');
  const [mode, setMode] = useState('counted');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [periodType, setPeriodType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [lateralLinkTargetId, setLateralLinkTargetId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { nameRef.current?.focus(); }, []);
  useEffect(() => {
    if (periodType === 'weekly' || periodType === 'monthly') setDueDate('');
  }, [periodType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError('');
    const data = { name: name.trim(), parentGoalId: goal.id, mode };
    if (mode === 'counted') {
      if (target !== '') data.target = Number(target);
      if (unit.trim()) data.unit = unit.trim();
    }
    if (periodType) data.periodType = periodType;
    if (dueDate && dueDate !== 'open-ended') data.dueDate = dueDate;
    if (lateralLinkTargetId) {
      data.lateralLinkTargetId = lateralLinkTargetId;
      data.lateralLinkType = 'value';
    }
    try { await createAction.mutateAsync(data); onClose(); }
    catch (err) { setError(err.message); setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '24px 24px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            New Action
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            under {goal.name}
          </p>
        </div>
        <button type="button" onClick={onClose} style={closeBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 24px 8px' }}>
        <Field label="Parent Goal">
          <div style={{ ...inputStyle, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {goal.name}
          </div>
        </Field>
      </div>

      <div style={{ padding: '0 24px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Name *">
          <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning jog" style={inputStyle} />
        </Field>
        <Field label="Mode">
          <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {['simple', 'counted'].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                flex: 1, padding: '9px 0', fontSize: 12.5, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'var(--bg)',
                color: mode === m ? '#fff' : 'var(--text-muted)',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}>
                {m}
              </button>
            ))}
          </div>
        </Field>
        {mode === 'counted' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Target" style={{ flex: 1 }}>
              <input type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 5" style={inputStyle} />
            </Field>
            <Field label="Unit" style={{ flex: 1 }}>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. sessions" style={inputStyle} />
            </Field>
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <Field label="Recurring" style={{ flex: 1 }}>
            <select value={periodType} onChange={(e) => setPeriodType(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">None</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Due date" style={{ flex: 1 }}>
            {periodType === 'weekly' || periodType === 'monthly' ? (
              <div style={{ ...inputStyle, color: 'var(--text-muted)', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                {periodType === 'weekly' ? 'Resets every Sunday' : 'Resets at end of month'}
              </div>
            ) : (
              <DatePicker value={dueDate} onChange={setDueDate} />
            )}
          </Field>
        </div>
        {mode === 'counted' && (
          <Field label="Feeds into">
            <select value={lateralLinkTargetId} onChange={(e) => setLateralLinkTargetId(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">None</option>
              {allActions.filter((a) => a.status === 'active' && a.mode === 'counted').map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </Field>
        )}
        {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
      </div>

      <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={submitting || !name.trim()} style={{
          padding: '9px 22px', borderRadius: 'var(--r-full)', fontSize: 13,
          fontWeight: 700, color: '#fff', border: 'none',
          background: 'var(--accent)', cursor: 'pointer',
          opacity: submitting || !name.trim() ? 0.4 : 1,
          boxShadow: 'var(--shadow-accent)', transition: 'all 0.15s',
        }}>
          {submitting ? '...' : 'Create Action'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, style: wrapperStyle, children }) {
  return (
    <div style={wrapperStyle}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13.5,
  color: 'var(--text)', outline: 'none', width: '100%',
  fontFamily: "'Nunito', sans-serif", transition: 'border-color 0.15s',
};

const closeBtnStyle = {
  width: 30, height: 30, borderRadius: 'var(--r-sm)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const cancelBtnStyle = {
  padding: '9px 18px', borderRadius: 'var(--r-full)', fontSize: 13,
  color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer',
};
