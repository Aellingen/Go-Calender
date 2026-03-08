import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useUIStore } from '../store/ui';
import { useActions } from '../hooks/useActions';
import { useSubmitReview, useReviewHistory } from '../hooks/useReviews';
import { toast } from '../store/toast';
import ActionReviewCard from './ActionReviewCard';
import WeeklyRollup from './WeeklyRollup';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatPeriodTitle(type, start, end) {
  if (type === 'monthly') {
    const d = parseISO(start);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d')}`;
}

export default function ReviewForm() {
  const activeReview = useUIStore((s) => s.activeReview);
  const clearActiveReview = useUIStore((s) => s.clearActiveReview);
  const closeReviewPanel = useUIStore((s) => s.closeReviewPanel);
  const submitReview = useSubmitReview();

  const { reviewType, periodStart, periodEnd, actions } = activeReview;
  const isWeekly = reviewType === 'weekly';

  // Local state for each action's current value
  const [values, setValues] = useState(() => {
    const init = {};
    for (const a of actions) {
      init[a.actionId] = a.currentValue;
    }
    return init;
  });
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Monthly context: show monthly actions during weekly review
  const { data: allActions = [] } = useActions();
  const monthlyActions = isWeekly
    ? allActions.filter((a) => a.periodType === 'monthly' && a.recurrenceMode !== 'none')
    : [];

  // Weekly rollup: for monthly reviews, fetch weekly review history
  const { data: weeklyHistory = [] } = useReviewHistory('weekly');

  const handleValueChange = (actionId, newVal) => {
    setValues((prev) => ({ ...prev, [actionId]: newVal }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const snapshots = actions.map((a) => ({
        actionId: a.actionId,
        sealedValue: values[a.actionId] ?? a.currentValue,
      }));
      await submitReview.mutateAsync({
        reviewType,
        periodStart,
        periodEnd,
        note,
        actionSnapshots: snapshots,
      });
      const label = formatPeriodTitle(reviewType, periodStart, periodEnd);
      toast.success(
        isWeekly
          ? `Week of ${format(parseISO(periodStart), 'MMM d')}–${format(parseISO(periodEnd), 'MMM d')} reviewed`
          : `${label} reviewed`,
      );
      clearActiveReview();
      // Close panel if desired (user can reopen if more pending)
      closeReviewPanel();
    } catch {
      setSubmitting(false);
    }
  };

  // Filter weekly history to weeks within this month (for monthly review)
  const monthStart = periodStart;
  const monthEnd = periodEnd;
  const weeksThisMonth = !isWeekly
    ? weeklyHistory.filter((r) => r.period_end >= monthStart && r.period_start <= monthEnd)
    : [];

  return (
    <>
      {/* Header */}
      <div style={{ padding: '28px 32px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <button
              onClick={clearActiveReview}
              style={{
                width: 32, height: 32, borderRadius: 'var(--r-sm)',
                background: 'var(--bg)', border: '1px solid var(--border)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--text-muted)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span className="font-display" style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '3px 10px', borderRadius: 'var(--r-full)',
              color: isWeekly ? 'var(--accent)' : '#D97706',
              background: isWeekly ? 'var(--accent-softer)' : '#FEF3C7',
            }}>
              {isWeekly ? 'Weekly Review' : 'Monthly Review'}
            </span>
          </div>
          <h2 className="font-display" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
            {formatPeriodTitle(reviewType, periodStart, periodEnd)}
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Review your performance and seal the {isWeekly ? 'week' : 'month'}.
          </p>
        </div>
        <button onClick={closeReviewPanel} style={closeBtnStyle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
        {/* Section 1: Action cards with sliders */}
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12,
        }}>
          {isWeekly ? 'Weekly' : 'Monthly'} goals — final values
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {actions.map((a) => (
            <ActionReviewCard
              key={a.actionId}
              action={a}
              current={values[a.actionId] ?? a.currentValue}
              onChange={(val) => handleValueChange(a.actionId, val)}
            />
          ))}
        </div>

        {/* Section 2a: Monthly context (weekly review only) */}
        {isWeekly && monthlyActions.length > 0 && (
          <div style={{
            marginTop: 28,
            background: 'var(--accent-softer)',
            borderRadius: 16,
            padding: '16px 20px',
            border: '1px solid #DDD6FE',
          }}>
            <div className="font-display" style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: 'var(--accent)', marginBottom: 10,
            }}>
              Monthly goals — progress so far
            </div>
            {monthlyActions.map((a) => (
              <div key={a.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid rgba(124,58,237,0.1)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>
                    Target: {a.target} {a.unit}{a.periodType === 'monthly' ? ' this month' : ''}
                  </div>
                </div>
                <div className="font-display" style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)' }}>
                  {a.currentValue ?? 0} / {a.target}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Section 2b: Weekly rollup (monthly review only) */}
        {!isWeekly && (
          <WeeklyRollup
            periodStart={periodStart}
            periodEnd={periodEnd}
            weeklyReviews={weeksThisMonth}
          />
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

        {/* Section 3: Notes */}
        <div style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12,
        }}>
          Notes on this {isWeekly ? 'week' : 'month'}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            isWeekly
              ? 'How did the week go? Anything worth remembering?'
              : 'How did the month go? Any patterns you noticed?'
          }
          style={{
            width: '100%', minHeight: 100, borderRadius: 16,
            border: '2px solid var(--border)', background: '#FAFAF9',
            padding: 16, fontFamily: "'Nunito', sans-serif",
            fontSize: 14, color: 'var(--text)',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.background = '#fff';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = '#FAFAF9';
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px 32px 28px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid var(--border)', marginTop: 8,
      }}>
        <button
          onClick={closeReviewPanel}
          style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 600,
            color: 'var(--text-muted)', background: 'none', border: 'none',
            cursor: 'pointer', padding: '8px 16px',
          }}
        >
          Later
        </button>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
          This will seal values and start a new period
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 700,
            color: '#fff', background: 'var(--accent)', border: 'none',
            cursor: submitting ? 'default' : 'pointer',
            padding: '12px 28px', borderRadius: 'var(--r-full)',
            boxShadow: 'var(--shadow-accent)',
            opacity: submitting ? 0.6 : 1,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          {submitting ? 'Saving...' : 'Complete Review'}
        </button>
      </div>
    </>
  );
}

const closeBtnStyle = {
  width: 36, height: 36, borderRadius: 12, border: 'none',
  background: 'var(--bg)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};
