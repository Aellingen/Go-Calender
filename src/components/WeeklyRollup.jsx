import { useState } from 'react';
import { format, parseISO, addWeeks, startOfWeek, endOfWeek, isBefore } from 'date-fns';

function getWeeksInMonth(periodStart, periodEnd) {
  const weeks = [];
  let current = startOfWeek(parseISO(periodStart), { weekStartsOn: 1 });
  const end = parseISO(periodEnd);
  let weekNum = 1;

  while (isBefore(current, end) || current.getTime() === end.getTime()) {
    const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
    weeks.push({
      label: `Week ${weekNum}`,
      start: format(current, 'yyyy-MM-dd'),
      end: format(weekEnd, 'yyyy-MM-dd'),
      startDisplay: format(current, 'MMM d'),
      endDisplay: format(weekEnd, 'MMM d'),
    });
    current = addWeeks(current, 1);
    weekNum++;
    if (weekNum > 6) break; // safety
  }
  return weeks;
}

export default function WeeklyRollup({ periodStart, periodEnd, weeklyReviews }) {
  const [expandedWeek, setExpandedWeek] = useState(null);
  const weeks = getWeeksInMonth(periodStart, periodEnd);

  const findReviewForWeek = (week) => {
    return weeklyReviews.find(
      (r) => r.period_start === week.start && r.period_end === week.end,
    );
  };

  return (
    <div style={{
      marginTop: 28,
      background: 'linear-gradient(135deg, #FAFAF9, #F5F3EF)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-muted)',
        padding: '16px 20px 0',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Weekly performance this month
      </div>

      {weeks.map((week, i) => {
        const review = findReviewForWeek(week);
        const isExpanded = expandedWeek === i;
        const hasReview = !!review;

        let pct = 0;
        let hits = 0;
        let total = 0;
        let snapshots = [];

        if (hasReview) {
          snapshots = review.action_snapshots || [];
          total = snapshots.length;
          hits = snapshots.filter((s) => s.sealedValue >= s.target).length;
          pct = total > 0 ? Math.round((hits / total) * 100) : 0;
        }

        const barColor = pct >= 100
          ? 'linear-gradient(90deg, var(--success), #34D399)'
          : pct >= 50
            ? 'linear-gradient(90deg, var(--accent), var(--accent-light))'
            : 'linear-gradient(90deg, var(--warm), #FBBF24)';

        const pctColor = pct >= 100 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--warm)';

        return (
          <div
            key={i}
            style={{
              cursor: hasReview ? 'pointer' : 'default',
              borderBottom: i < weeks.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
              transition: 'background 0.15s',
            }}
            onClick={() => hasReview && setExpandedWeek(isExpanded ? null : i)}
          >
            {/* Collapsed row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto',
              gap: 12,
              alignItems: 'center',
              padding: '14px 20px',
            }}>
              <div>
                <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {week.label}
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)' }}>
                  {week.startDisplay} – {week.endDisplay}
                </div>
              </div>

              {hasReview ? (
                <>
                  <div style={{
                    width: 80, height: 6, borderRadius: 'var(--r-full)',
                    background: 'var(--border)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 'var(--r-full)',
                      width: `${pct}%`, background: barColor,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <div className="font-display" style={{
                    fontSize: 13, fontWeight: 800, minWidth: 40, textAlign: 'right',
                    color: pctColor,
                  }}>
                    {pct}%
                  </div>
                  <div style={{
                    width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </>
              ) : (
                <div style={{
                  gridColumn: 'span 3',
                  fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, fontStyle: 'italic',
                }}>
                  Not yet reviewed
                </div>
              )}
            </div>

            {/* Expanded detail */}
            {hasReview && (
              <div style={{
                maxHeight: isExpanded ? 400 : 0,
                overflow: 'hidden',
                transition: 'max-height 0.3s ease, padding 0.3s ease',
                padding: isExpanded ? '0 20px 16px' : '0 20px',
                background: 'rgba(255,255,255,0.5)',
              }}>
                <div style={{ paddingTop: 4 }}>
                  {snapshots.map((s, j) => {
                    const isHit = s.sealedValue >= s.target;
                    return (
                      <div key={j} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '7px 0',
                        borderBottom: j < snapshots.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {s.actionName}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="font-display" style={{
                            fontSize: 12, fontWeight: 800,
                            color: isHit ? 'var(--success)' : 'var(--warm)',
                          }}>
                            {s.sealedValue} / {s.target}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px',
                            borderRadius: 'var(--r-full)', textTransform: 'uppercase', letterSpacing: '0.03em',
                            background: isHit ? '#ECFDF5' : '#FFF7ED',
                            color: isHit ? 'var(--success)' : 'var(--warm)',
                          }}>
                            {isHit ? 'Hit' : 'Miss'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {review.note && (
                    <div style={{
                      marginTop: 8, padding: '8px 12px',
                      background: '#fff', borderRadius: 'var(--r-sm)',
                      border: '1px solid var(--border)',
                      fontSize: 11.5, color: 'var(--text-muted)',
                      fontStyle: 'italic', lineHeight: 1.5,
                    }}>
                      {review.note}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
