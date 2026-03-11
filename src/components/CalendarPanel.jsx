import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  differenceInDays,
  parseISO,
} from 'date-fns';
import { useUIStore } from '../store/ui';
import { useGoals } from '../hooks/useGoals';
import { useActions } from '../hooks/useActions';

export default function CalendarSidebar() {
  const { openLogModal } = useUIStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const today = new Date();

  const { data: goals = [] } = useGoals('active');
  const { data: actions = [] } = useActions();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Build event map
  const eventMap = useMemo(() => {
    const map = {};
    for (const goal of goals) {
      if (goal.dueDate) {
        if (!map[goal.dueDate]) map[goal.dueDate] = [];
        map[goal.dueDate].push({ ...goal, sourceType: 'goal' });
      }
    }
    for (const action of actions) {
      if (action.dueDate) {
        if (!map[action.dueDate]) map[action.dueDate] = [];
        map[action.dueDate].push({ ...action, sourceType: 'action' });
      }
    }
    return map;
  }, [goals, actions]);

  // Upcoming deadlines (sorted, next 5)
  const upcoming = useMemo(() => {
    const todayStr = format(today, 'yyyy-MM-dd');
    return Object.entries(eventMap)
      .filter(([date]) => date >= todayStr)
      .sort(([a], [b]) => a.localeCompare(b))
      .flatMap(([date, items]) => items.map((item) => ({ ...item, dateStr: date })))
      .slice(0, 5);
  }, [eventMap, today]);

  const selectedEvents = selectedDay
    ? eventMap[format(selectedDay, 'yyyy-MM-dd')] || []
    : [];

  const handleDayClick = (d) => {
    if (selectedDay && isSameDay(d, selectedDay)) {
      setSelectedDay(null);
    } else {
      setSelectedDay(d);
    }
  };

  return (
    <div style={{
      width: 280,
      minWidth: 280,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border)',
      background: 'var(--sidebar-bg)',
      overflow: 'hidden',
      position: 'relative',
    }}>

      {/* ── Expanded View ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 className="font-display" style={{
            fontSize: 15, color: 'var(--text)', margin: 0,
          }}>
            Calendar
          </h3>
        </div>

        {/* Month navigation */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px', marginBottom: 10,
        }}>
          <button
            onClick={() => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDay(null); }}
            style={navBtnStyle}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <span style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            fontFamily: "'Bricolage Grotesque', sans-serif",
          }}>
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDay(null); }}
            style={navBtnStyle}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 14px', marginBottom: 4 }}>
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} style={{
              textAlign: 'center', fontSize: 10, fontWeight: 700,
              color: 'var(--text-muted)', padding: '3px 0',
              textTransform: 'uppercase',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '0 14px', gap: 2 }}>
          {days.map((d, i) => {
            const isToday = isSameDay(d, today);
            const inMonth = isSameMonth(d, currentMonth);
            const isSelected = selectedDay && isSameDay(d, selectedDay);
            const dateKey = format(d, 'yyyy-MM-dd');
            const events = eventMap[dateKey] || [];
            const hasEvents = events.length > 0;

            return (
              <button
                key={i}
                onClick={() => handleDayClick(d)}
                style={{
                  height: 32, width: '100%',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: isSelected
                    ? 'var(--accent)'
                    : isToday
                      ? 'var(--accent-softer)'
                      : 'transparent',
                  color: isSelected
                    ? '#fff'
                    : isToday
                      ? 'var(--accent)'
                      : !inMonth
                        ? 'var(--text-dim)'
                        : 'var(--text)',
                  fontWeight: isToday || isSelected ? 700 : 500,
                  fontSize: 11.5,
                  cursor: 'pointer',
                  lineHeight: 1,
                  transition: 'all 0.12s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isToday) e.currentTarget.style.background = 'var(--bg)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isToday) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{format(d, 'd')}</span>
                {hasEvents && (
                  <span style={{
                    position: 'absolute', bottom: 2,
                    width: 4, height: 4, borderRadius: '50%',
                    background: isSelected ? '#fff' : 'var(--accent)',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day events */}
        {selectedDay && selectedEvents.length > 0 && (
          <div style={{
            margin: '10px 14px 0', padding: '10px',
            background: 'var(--surface)', borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {format(selectedDay, 'MMM d')}
            </span>
            {selectedEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => openLogModal(event, event.sourceType)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)', background: 'var(--bg-warm)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-light)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: event.sourceType === 'goal' ? 'var(--accent)' : 'var(--warm)',
                  flexShrink: 0,
                }} />
                <span style={{
                  fontSize: 11.5, fontWeight: 600, color: 'var(--text)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {event.name}
                </span>
                <span style={{
                  fontSize: 9.5, fontWeight: 600, color: 'var(--text-muted)',
                  padding: '1px 6px', borderRadius: 'var(--r-full)',
                  background: 'var(--surface)',
                  flexShrink: 0,
                }}>
                  {event.sourceType === 'goal' ? 'Goal' : 'Action'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', margin: '14px 18px 0' }} />

        {/* Upcoming deadlines */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 18px 16px',
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'block', marginBottom: 8,
          }}>
            Upcoming
          </span>

          {upcoming.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No upcoming deadlines
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {upcoming.map((item) => {
                const d = parseISO(item.dateStr);
                const daysUntil = differenceInDays(d, today);
                const isUrgent = daysUntil <= 3;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 0',
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--r-sm)',
                      background: isUrgent ? 'var(--warm-softer)' : 'var(--bg)',
                      border: `1px solid ${isUrgent ? 'var(--warm-light)' : 'var(--border)'}`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{
                        fontSize: 7, fontWeight: 700,
                        color: isUrgent ? 'var(--warm)' : 'var(--text-muted)',
                        textTransform: 'uppercase', lineHeight: 1,
                      }}>
                        {format(d, 'MMM')}
                      </span>
                      <span style={{
                        fontSize: 12, fontWeight: 800, lineHeight: 1,
                        color: isUrgent ? 'var(--warm)' : 'var(--text)',
                      }}>
                        {format(d, 'd')}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, fontWeight: 600, color: 'var(--text)',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {item.name}
                      </p>
                      <p style={{
                        fontSize: 10.5, color: isUrgent ? 'var(--warm)' : 'var(--text-muted)',
                        fontWeight: 600, margin: 0,
                      }}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  width: 28, height: 28, borderRadius: 'var(--r-sm)',
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.12s',
};
