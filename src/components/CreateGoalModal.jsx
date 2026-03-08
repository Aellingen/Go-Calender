import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '../store/ui';
import { useCreateGoal } from '../hooks/useGoals';
import DatePicker from './DatePicker';

export default function CreateGoalModal() {
  const { createGoalOpen, closeCreateGoal } = useUIStore();
  if (!createGoalOpen) return null;
  return (
    <ModalBackdrop onClose={closeCreateGoal}>
      <FormContent onClose={closeCreateGoal} />
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
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          width: 400, maxHeight: 560,
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function FormContent({ onClose }) {
  const nameRef = useRef(null);
  const createGoal = useCreateGoal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [mode, setMode] = useState('checkbox');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError('');
    const data = { name: name.trim(), mode };
    if (description.trim()) data.description = description.trim();
    if (dueDate) data.dueDate = dueDate;
    if (mode === 'numerical') {
      if (target !== '') data.target = Number(target);
      if (unit.trim()) data.unit = unit.trim();
    }
    onClose();
    try { await createGoal.mutateAsync(data); } catch {}
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ padding: '24px 24px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 className="font-display" style={{ fontSize: 20, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
            New Goal
          </h2>
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 0' }}>
            What are you working toward?
          </p>
        </div>
        <button type="button" onClick={onClose} style={closeBtnStyle}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: '0 24px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Name *">
          <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Run a marathon" style={inputStyle} />
        </Field>
        <Field label="Description">
          <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional context" style={inputStyle} />
        </Field>
        <Field label="Due date">
          <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pick a date" />
        </Field>
        <Field label="Mode">
          <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
            {['checkbox', 'numerical'].map((m) => (
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
        {mode === 'numerical' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Field label="Target" style={{ flex: 1 }}>
              <input type="number" step="any" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 42" style={inputStyle} />
            </Field>
            <Field label="Unit" style={{ flex: 1 }}>
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. km" style={inputStyle} />
            </Field>
          </div>
        )}
        {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
      </div>

      <div style={{ padding: '14px 24px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" disabled={!name.trim()} style={{
          padding: '9px 22px', borderRadius: 'var(--r-full)', fontSize: 13,
          fontWeight: 700, color: '#fff', border: 'none',
          background: 'var(--accent)', cursor: 'pointer',
          opacity: !name.trim() ? 0.4 : 1,
          boxShadow: name.trim() ? 'var(--shadow-accent)' : 'none',
          transition: 'all 0.15s',
        }}>
          Create Goal
        </button>
      </div>
    </form>
  );
}

function Field({ label, style: wrapperStyle, children }) {
  return (
    <div style={wrapperStyle}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 5 }}>
        {label}
      </label>
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
