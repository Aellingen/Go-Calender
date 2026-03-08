import { useActions } from '../hooks/useActions';
import { useGoals } from '../hooks/useGoals';
import { useUIStore } from '../store/ui';
import { usePinnedActions } from '../hooks/usePinnedActions';
import { formatDueDate } from '../lib/dates';

export default function PinnedActions() {
  const { data: actions = [], isLoading } = useActions(undefined, 'active');
  const { data: goals = [] } = useGoals('active');
  const { pinnedIds } = usePinnedActions();

  const pinned = pinnedIds.length > 0
    ? pinnedIds.map((id) => actions.find((a) => a.id === id)).filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div style={{ display: 'flex', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ flex: 1, height: 80, borderRadius: 'var(--r-lg)' }} />
        ))}
      </div>
    );
  }

  if (pinned.length === 0) return null;

  const handleClick = (action) => {
    const parentGoal = goals.find((g) => g.id === action.parentGoalId);
    if (parentGoal) {
      useUIStore.getState().openGoalDetail(parentGoal);
    }
  };

  return (
    <section>
      <h2 className="font-display" style={{
        fontSize: 14, color: 'var(--text-muted)', margin: '0 0 10px',
        letterSpacing: '-0.01em', fontWeight: 600,
      }}>
        Pinned
      </h2>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto' }} className="no-scrollbar">
        {pinned.map((action) => {
          const progress = action.target
            ? Math.min(100, ((action.currentValue ?? 0) / action.target) * 100)
            : 0;
          const isComplete = progress >= 100;

          return (
            <button
              key={action.id}
              onClick={() => handleClick(action)}
              style={{
                flex: '0 0 auto',
                minWidth: 180,
                maxWidth: 240,
                background: isComplete ? 'var(--success-bg)' : 'var(--surface)',
                border: `1px solid ${isComplete ? 'var(--success-light)' : 'var(--border)'}`,
                borderRadius: 'var(--r-lg)',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease-out)',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = 'var(--accent-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = isComplete ? 'var(--success-light)' : 'var(--border)';
              }}
            >
              <p style={{
                fontSize: 13, fontWeight: 700, color: 'var(--text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                margin: '0 0 8px',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}>
                {action.name}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 13, fontWeight: 700,
                  color: isComplete ? 'var(--success)' : 'var(--accent)',
                }}>
                  {action.currentValue ?? 0}
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>
                    /{action.target ?? '–'}
                  </span>
                </span>
                {action.dueDate && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                    padding: '1px 6px', borderRadius: 'var(--r-full)',
                    background: 'var(--bg)',
                  }}>
                    {formatDueDate(action.dueDate)}
                  </span>
                )}
              </div>

              {action.target != null && (
                <div style={{
                  marginTop: 8, height: 4,
                  background: 'var(--slider-bg)', borderRadius: 'var(--r-full)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${progress}%`,
                    background: isComplete
                      ? 'linear-gradient(90deg, var(--success), var(--success-light))'
                      : 'linear-gradient(90deg, var(--accent), var(--accent-light))',
                    borderRadius: 'var(--r-full)',
                    transition: 'width 0.4s var(--ease-out)',
                  }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
