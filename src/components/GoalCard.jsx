import { useMemo } from 'react';
import { useActions } from '../hooks/useActions';
import { formatDueDate } from '../lib/dates';

/* ── Circular progress ring ── */
function ProgressRing({ progress, size = 52, strokeWidth = 4, color = 'var(--accent)' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, progress) / 100) * circumference;

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="var(--slider-bg)" strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s var(--ease-out)' }}
      />
    </svg>
  );
}

/* ── Momentum dots (last 7 conceptual slots based on actions) ── */
function MomentumDots({ activeCount, totalCount }) {
  const dots = [];
  for (let i = 0; i < Math.min(totalCount, 7); i++) {
    dots.push(i < activeCount);
  }
  // Pad to at least 5 dots
  while (dots.length < 5) dots.push(false);

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {dots.map((active, i) => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: active ? 'var(--warm)' : 'var(--slider-bg)',
            transition: 'background 0.3s',
            boxShadow: active ? 'var(--shadow-warm)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

const GOAL_COLOR_MAP = {
  violet: { border: 'var(--accent)', tint: 'rgba(124, 58, 237, 0.10)' },
  orange: { border: 'var(--warm)',   tint: 'rgba(249, 115, 22, 0.10)' },
  green:  { border: 'var(--success)', tint: 'rgba(16, 185, 129, 0.10)' },
  red:    { border: 'var(--danger)',  tint: 'rgba(239, 68, 68, 0.10)' },
};

export default function GoalCard({ goal, goals = [], onClick, dragHandleListeners, dragHandleAttributes }) {
  const { data: actions = [] } = useActions(goal.id);
  const isOptimistic = goal._optimistic;
  const isNumerical = goal.mode === 'counted';
  const colorInfo = goal.color ? GOAL_COLOR_MAP[goal.color] : null;

  const { progress, activeActions, totalActions, momentumLabel, progressLabel } = useMemo(() => {
    let prog = 0;
    const total = actions.length;
    const active = actions.filter((a) => (a.currentValue ?? 0) > 0).length;
    const complete = actions.filter((a) => a.status === 'complete').length;

    if (isNumerical && goal.target) {
      prog = Math.min(100, ((goal.currentValue ?? 0) / goal.target) * 100);
    } else if (!isNumerical && total > 0) {
      prog = Math.min(100, (complete / total) * 100);
    }

    // Momentum label
    let mLabel = '';
    if (total === 0) {
      mLabel = 'No actions yet';
    } else if (active === total) {
      mLabel = 'All actions active';
    } else if (active > 0) {
      mLabel = `${active} of ${total} active`;
    } else {
      mLabel = 'Not started';
    }

    // Progress label
    let pLabel = '';
    if (isNumerical) {
      pLabel = `${goal.currentValue ?? 0} / ${goal.target ?? '–'}${goal.unit ? ` ${goal.unit}` : ''}`;
    } else if (total > 0) {
      pLabel = `${complete} / ${total} done`;
    }

    return {
      progress: prog,
      activeActions: active,
      totalActions: total,
      momentumLabel: mLabel,
      progressLabel: pLabel,
    };
  }, [goal, actions, isNumerical]);

  // Ring color based on momentum
  const ringColor = progress >= 100 ? 'var(--success)' : progress > 0 ? 'var(--accent)' : 'var(--slider-bg)';

  return (
    <div
      onClick={isOptimistic ? undefined : onClick}
      className="animate-scale-in"
      style={{
        background: colorInfo
          ? `linear-gradient(135deg, ${colorInfo.tint} 0%, transparent 60%), var(--card)`
          : 'var(--card)',
        border: '1px solid var(--border)',
        borderLeft: colorInfo ? `5px solid ${colorInfo.border}` : undefined,
        borderRadius: 'var(--r-xl)',
        padding: '22px 24px 20px',
        cursor: isOptimistic ? 'default' : 'pointer',
        transition: 'all 0.25s var(--ease-out)',
        opacity: isOptimistic ? 0.55 : 1,
        pointerEvents: isOptimistic ? 'none' : 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (isOptimistic) return;
        const s = e.currentTarget.style;
        s.borderTopColor = 'var(--accent-light)';
        s.borderRightColor = 'var(--accent-light)';
        s.borderBottomColor = 'var(--accent-light)';
        if (!colorInfo) s.borderLeftColor = 'var(--accent-light)';
        s.transform = 'translateY(-3px)';
        s.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        if (isOptimistic) return;
        const s = e.currentTarget.style;
        s.borderTopColor = 'var(--border)';
        s.borderRightColor = 'var(--border)';
        s.borderBottomColor = 'var(--border)';
        if (!colorInfo) s.borderLeftColor = 'var(--border)';
        s.transform = 'translateY(0)';
        s.boxShadow = 'none';
      }}
    >
      {/* Drag handle */}
      {dragHandleListeners && (
        <div
          {...dragHandleListeners}
          {...dragHandleAttributes}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', top: 8, right: 8,
            padding: 4, cursor: 'grab',
            opacity: 0.35, transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--r-sm)',
            zIndex: 2,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35'; }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--text-muted)">
            <circle cx="5" cy="3" r="1.5"/><circle cx="11" cy="3" r="1.5"/>
            <circle cx="5" cy="8" r="1.5"/><circle cx="11" cy="8" r="1.5"/>
            <circle cx="5" cy="13" r="1.5"/><circle cx="11" cy="13" r="1.5"/>
          </svg>
        </div>
      )}

      {/* Top row: name + ring */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="font-display" style={{
            fontSize: 16, color: 'var(--text)', margin: 0,
            lineHeight: 1.3, letterSpacing: '-0.01em',
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {goal.name}
          </h3>

          {goal.description && (
            <p style={{
              fontSize: 12.5, color: 'var(--text-muted)', margin: '3px 0 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {goal.description}
            </p>
          )}
        </div>

        {/* Progress ring with center text */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <ProgressRing progress={progress} size={52} strokeWidth={4} color={ringColor} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: 'rotate(0deg)', /* counter the ring rotation */
          }}>
            <span style={{
              fontSize: 13, fontWeight: 800, color: progress >= 100 ? 'var(--success)' : 'var(--text)',
              fontFamily: "'Bricolage Grotesque', sans-serif",
            }}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Middle: progress label */}
      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {progressLabel}
        </span>
        {goal.periodType && (
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
            padding: '2px 8px', borderRadius: 'var(--r-full)',
            background: 'var(--accent-softer)',
          }}>
            {goal.periodType === 'weekly' ? 'Weekly' : 'Monthly'}
          </span>
        )}
        {goal.dueDate && !goal.periodType && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
            padding: '2px 8px', borderRadius: 'var(--r-full)',
            background: 'var(--bg)',
          }}>
            Due {formatDueDate(goal.dueDate)}
          </span>
        )}
      </div>

      {/* Progress bar — thin line version */}
      <div style={{
        marginTop: 10, height: 5, background: 'var(--slider-bg)',
        borderRadius: 'var(--r-full)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: progress >= 100
            ? 'linear-gradient(90deg, var(--success), var(--success-light))'
            : 'linear-gradient(90deg, var(--accent), var(--accent-light))',
          borderRadius: 'var(--r-full)',
          transition: 'width 0.5s var(--ease-out)',
        }} />
      </div>

      {/* Feeds into link */}
      {goal.linkedGoalId && (() => {
        const linkedGoal = goals.find((g) => g.id === goal.linkedGoalId);
        return linkedGoal ? (
          <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 500 }}>
            → Feeds into {linkedGoal.name}
          </div>
        ) : null;
      })()}

      {/* Bottom: Momentum section */}
      <div style={{
        marginTop: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MomentumDots activeCount={activeActions} totalCount={totalActions} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
            {momentumLabel}
          </span>
        </div>

        {/* Arrow indicator */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>

      {/* Action chips — compact */}
      {actions.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 12 }}>
          {actions.slice(0, 4).map((action) => {
            const actionProgress = action.target ? (action.currentValue ?? 0) / action.target : 0;
            const isComplete = action.status === 'complete' || actionProgress >= 1;
            return (
              <span
                key={action.id}
                style={{
                  background: isComplete ? 'var(--success-softer)' : 'rgba(255,255,255,0.85)',
                  border: `1px solid ${isComplete ? 'var(--success-light)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-full)',
                  padding: '3px 10px',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: isComplete ? 'var(--success)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 150,
                }}
              >
                {isComplete ? '✓ ' : ''}{action.name}
              </span>
            );
          })}
          {actions.length > 4 && (
            <span style={{
              padding: '3px 8px', fontSize: 10.5, fontWeight: 600,
              color: 'var(--text-muted)',
            }}>
              +{actions.length - 4}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
