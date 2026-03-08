import { useState, useEffect } from 'react';
import { useActions } from '../hooks/useActions';
import { useUpdateGoal, useDeleteGoal } from '../hooks/useGoals';
import { useUIStore } from '../store/ui';
import { formatDueDate } from '../lib/dates';
import ActionSliderCard from './ActionSliderCard';
import DatePicker from './DatePicker';

export default function GoalDetailModal({ goal, onClose }) {
  const { data: actions = [] } = useActions(goal.id);
  const updateGoal = useUpdateGoal();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isNumerical = goal.mode === 'numerical';
  const activeActions = actions.filter((a) => (a.currentValue ?? 0) > 0).length;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(28,25,23,0.35)',
        backdropFilter: 'blur(4px)',
        padding: 40, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-2xl)',
          width: '80%', maxWidth: 940, maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="font-display" style={{
                fontSize: 24, color: 'var(--text)', letterSpacing: '-0.03em',
                margin: 0, lineHeight: 1.2,
              }}>
                {goal.name}
              </h2>
              {goal.description && (
                <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  {goal.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                <span style={{
                  background: 'var(--accent-softer)', color: 'var(--accent)',
                  borderRadius: 'var(--r-full)', padding: '3px 12px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {isNumerical ? 'Numerical' : 'Checkbox'}
                </span>
                {goal.dueDate && (
                  <span style={{
                    background: 'var(--bg)', color: 'var(--text-secondary)',
                    borderRadius: 'var(--r-full)', padding: '3px 12px',
                    fontSize: 11, fontWeight: 600, border: '1px solid var(--border)',
                  }}>
                    Due {formatDueDate(goal.dueDate)}
                  </span>
                )}
                {actions.length > 0 && (
                  <span style={{
                    background: activeActions > 0 ? 'var(--warm-softer)' : 'var(--bg)',
                    color: activeActions > 0 ? 'var(--warm)' : 'var(--text-muted)',
                    borderRadius: 'var(--r-full)', padding: '3px 12px',
                    fontSize: 11, fontWeight: 700,
                  }}>
                    {activeActions}/{actions.length} active
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 20 }}>
              {isNumerical ? (
                <div style={{ textAlign: 'right' }}>
                  <span className="font-display" style={{
                    fontSize: 32, color: 'var(--accent)', lineHeight: 1,
                  }}>
                    {goal.currentValue ?? 0}
                  </span>
                  {goal.target != null && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      of {goal.target} {goal.unit || ''}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{
                  fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)',
                  padding: '4px 12px', background: 'var(--bg)', borderRadius: 'var(--r-full)',
                }}>
                  {actions.filter((a) => a.status === 'complete').length}/{actions.length} done
                </span>
              )}

              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                style={{
                  width: 36, height: 36, borderRadius: 'var(--r-md)',
                  background: settingsOpen ? 'var(--accent-softer)' : 'var(--bg)',
                  border: `1px solid ${settingsOpen ? 'var(--accent-light)' : 'var(--border)'}`,
                  color: settingsOpen ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                title="Settings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </button>

              <button
                onClick={onClose}
                style={{
                  width: 36, height: 36, borderRadius: 'var(--r-md)',
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Settings panel */}
        {settingsOpen && (
          <SettingsPanel goal={goal} updateGoal={updateGoal} onClose={onClose} />
        )}

        {/* Body: actions grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 24px' }}>
          {actions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div
                onClick={() => useUIStore.getState().openCreateAction(goal)}
                style={{
                  width: 48, height: 48, borderRadius: 'var(--r-lg)',
                  background: 'var(--accent-softer)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px', cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                No actions yet —{' '}
                <span
                  onClick={() => useUIStore.getState().openCreateAction(goal)}
                  style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}
                >
                  add your first action
                </span>
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {actions.map((action) => (
                <ActionSliderCard key={action.id} action={action} />
              ))}
            </div>
          )}

          {actions.length > 0 && (
            <button
              onClick={() => useUIStore.getState().openCreateAction(goal)}
              style={{
                width: '100%', marginTop: 14, padding: '12px 0',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--r-lg)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease-out)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-light)';
                e.currentTarget.style.color = 'var(--accent)';
                e.currentTarget.style.background = 'var(--accent-softer)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              + Add action
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ goal, updateGoal, onClose }) {
  const deleteGoal = useDeleteGoal();
  const [name, setName] = useState(goal.name || '');
  const [description, setDescription] = useState(goal.description || '');
  const [dueDate, setDueDate] = useState(goal.dueDate || '');
  const [mode, setMode] = useState(goal.mode || 'checkbox');
  const [target, setTarget] = useState(goal.target != null ? String(goal.target) : '');
  const [unit, setUnit] = useState(goal.unit || '');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = {};
    if (name.trim() && name.trim() !== goal.name) data.name = name.trim();
    if (description.trim() !== (goal.description || '')) data.description = description.trim();
    if (dueDate !== (goal.dueDate || '')) data.dueDate = dueDate || null;
    if (mode !== (goal.mode || 'checkbox')) data.mode = mode;
    if (mode === 'numerical') {
      if (target !== (goal.target != null ? String(goal.target) : '')) data.target = target ? Number(target) : null;
      if (unit !== (goal.unit || '')) data.unit = unit;
    } else {
      if (goal.target != null) data.target = null;
      if (goal.unit) data.unit = '';
    }
    if (Object.keys(data).length > 0) {
      try { await updateGoal.mutateAsync({ goalId: goal.id, ...data }); } catch {}
    }
    setSaving(false);
  };

  const handleDelete = () => {
    onClose();
    deleteGoal.mutate(goal.id);
  };

  return (
    <div style={{
      background: 'var(--bg)', borderBottom: '1px solid var(--border)',
      padding: '18px 28px',
      animation: 'slideDown 0.15s var(--ease-out)',
    }}>
      <div style={{
        fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)',
        fontWeight: 700, marginBottom: 14, letterSpacing: '0.06em',
      }}>
        Edit Goal
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="Optional" />
        </Field>
        <Field label="Due Date">
          <DatePicker value={dueDate} onChange={setDueDate} placeholder="Pick a date" />
        </Field>
        <Field label="Mode">
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
            <option value="checkbox">Checkbox</option>
            <option value="numerical">Numerical</option>
          </select>
        </Field>
        {mode === 'numerical' && (
          <>
            <Field label="Target">
              <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Unit">
              <input value={unit} onChange={(e) => setUnit(e.target.value)} style={inputStyle} placeholder="e.g. km" />
            </Field>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
        <button onClick={handleSave} disabled={saving} style={primaryBtnStyle(saving)}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button onClick={() => setDeleteConfirm(true)} style={dangerOutlineBtnStyle}>
          Delete Goal
        </button>
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
              Delete goal?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 22px', lineHeight: 1.5 }}>
              This will permanently delete <strong>{goal.name}</strong> and all its actions and logs.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(false)} style={{
                padding: '9px 22px', borderRadius: 'var(--r-full)', fontSize: 13,
                fontWeight: 700, color: 'var(--text-muted)', background: 'var(--bg)',
                border: '1px solid var(--border)', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleDelete} style={{
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

function Field({ label, style: wrapperStyle, children }) {
  return (
    <div style={wrapperStyle}>
      <label style={{
        display: 'block', fontSize: 10, fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-muted)', marginBottom: 5,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)', padding: '9px 12px', fontSize: 13,
  color: 'var(--text)', outline: 'none', width: '100%',
  fontFamily: "'Nunito', sans-serif",
  transition: 'border-color 0.15s',
};

const primaryBtnStyle = (disabled) => ({
  background: 'var(--accent)', color: '#fff',
  border: 'none', borderRadius: 'var(--r-full)', padding: '9px 20px',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  opacity: disabled ? 0.6 : 1,
  boxShadow: 'var(--shadow-accent)',
  transition: 'all 0.15s',
});

const dangerOutlineBtnStyle = {
  background: 'transparent', color: 'var(--danger)',
  border: '1px solid var(--danger-light)', borderRadius: 'var(--r-full)',
  padding: '8px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
};

const dangerBtnStyle = {
  background: 'var(--danger)', color: '#fff',
  border: 'none', borderRadius: 'var(--r-sm)', padding: '5px 12px',
  fontSize: 11, fontWeight: 700, cursor: 'pointer',
};

const cancelBtnStyle = {
  background: 'var(--bg)', color: 'var(--text-muted)',
  border: 'none', borderRadius: 'var(--r-sm)', padding: '5px 12px',
  fontSize: 11, cursor: 'pointer',
};
