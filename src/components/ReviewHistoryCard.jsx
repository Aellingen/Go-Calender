import { format, parseISO } from 'date-fns';
import { useUIStore } from '../store/ui';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function formatPeriodLabel(type, start, end) {
  if (type === 'monthly') {
    const d = parseISO(start);
    return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return `${format(parseISO(start), 'MMM d')} – ${format(parseISO(end), 'MMM d')}`;
}

export default function ReviewHistoryCard({ review }) {
  const expandedReviewId = useUIStore((s) => s.expandedReviewId);
  const setExpandedReviewId = useUIStore((s) => s.setExpandedReviewId);
  const isExpanded = expandedReviewId === review.id;

  const snapshots = review.action_snapshots || [];
  const total = snapshots.length;
  const hits = snapshots.filter((s) => s.sealedValue >= s.target).length;
  const misses = total - hits;
  const isWeekly = review.review_type === 'weekly';

  // Score ring
  const circumference = 2 * Math.PI * 20; // r=20
  const ratio = total > 0 ? hits / total : 0;
  const offset = circumference * (1 - ratio);
  const ringColor = ratio >= 1 ? 'var(--success)' : ratio >= 0.5 ? 'var(--accent)' : 'var(--warm)';

  if (isExpanded) {
    return (
      <div style={{
        background: '#fff',
        border: '2px solid var(--accent-light)',
        borderRadius: 'var(--r-lg)',
        padding: 24,
        marginBottom: 10,
        cursor: 'pointer',
      }}
        onClick={() => setExpandedReviewId(review.id)}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span className="font-display" style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 'var(--r-full)',
              background: isWeekly ? 'var(--accent-softer)' : '#FEF3C7',
              color: isWeekly ? 'var(--accent)' : '#D97706',
              display: 'inline-block', marginBottom: 4,
            }}>
              {isWeekly ? 'Weekly Review' : 'Monthly Review'}
            </span>
            <div className="font-display" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
              {formatPeriodLabel(review.review_type, review.period_start, review.period_end)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600 }}>
              Reviewed {format(new Date(review.completed_at), 'MMM d, yyyy')}
            </div>
          </div>
          <ScoreRing hits={hits} total={total} ringColor={ringColor} circumference={circumference} offset={offset} size={48} />
        </div>

        {/* Action list */}
        <div style={{ marginTop: 16 }}>
          {snapshots.map((s, i) => {
            const isHit = s.sealedValue >= s.target;
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0',
                borderBottom: i < snapshots.length - 1 ? '1px solid #F5F5F4' : 'none',
              }}>
                <div>
                  <div className="font-display" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {s.actionName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {s.parentGoalName}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-display" style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)' }}>
                    {s.sealedValue}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    / {s.target} {s.unit}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px',
                    borderRadius: 'var(--r-full)',
                    background: isHit ? '#ECFDF5' : '#FFF7ED',
                    color: isHit ? 'var(--success)' : 'var(--warm)',
                  }}>
                    {isHit ? 'HIT' : 'MISS'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        {review.note && (
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: '#FAFAF9', borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.05em', color: 'var(--text-dim)',
              fontStyle: 'normal', marginBottom: 6,
            }}>
              Notes
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
              {review.note}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Collapsed card
  return (
    <div
      onClick={() => setExpandedReviewId(review.id)}
      style={{
        background: '#FAFAF9',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '18px 20px',
        marginBottom: 10,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-light)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(120,100,80,0.08), 0 4px 12px rgba(120,100,80,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="font-display" style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 'var(--r-full)',
            background: isWeekly ? 'var(--accent-softer)' : '#FEF3C7',
            color: isWeekly ? 'var(--accent)' : '#D97706',
            display: 'inline-block', marginBottom: 4,
          }}>
            {isWeekly ? 'Weekly' : 'Monthly'}
          </span>
          <div className="font-display" style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            {formatPeriodLabel(review.review_type, review.period_start, review.period_end)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginTop: 2 }}>
            Reviewed {format(new Date(review.completed_at), 'MMM d')}
          </div>
        </div>
        <ScoreRing hits={hits} total={total} ringColor={ringColor} circumference={circumference} offset={offset} size={48} />
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {hits > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {hits} target{hits !== 1 ? 's' : ''} hit
            </span>
          </div>
        )}
        {misses > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warm)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {misses} missed
            </span>
          </div>
        )}
      </div>

      {/* Note preview */}
      {review.note && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid var(--border)',
          fontSize: 12.5, color: 'var(--text-muted)',
          fontStyle: 'italic', lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {review.note}
        </div>
      )}
    </div>
  );
}

function ScoreRing({ hits, total, ringColor, circumference, offset, size }) {
  const r = size === 48 ? 20 : 20;
  const cx = size / 2;
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#EEECE9" strokeWidth="3"/>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={ringColor} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <span className="font-display" style={{ fontSize: 12, fontWeight: 800, color: ringColor }}>
        {hits}/{total}
      </span>
    </div>
  );
}
