import { useState, useRef, useEffect } from 'react';

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDisplayDate(iso) {
  if (!iso) return null;
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}

function toISO(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getStartDay(year, month) { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1; }

export default function DatePicker({ value, onChange, placeholder = 'Select date' }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);
  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  const initial = value ? new Date(value + 'T00:00:00') : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target) && !btnRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [open]);

  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopPos({ top: rect.bottom + 6, left: rect.left });
    }
  }, [open]);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const startDay = getStartDay(viewYear, viewMonth);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const handleSelect = (day) => { onChange(toISO(viewYear, viewMonth, day)); setOpen(false); };

  return (
    <div style={{ position: 'relative' }}>
      <button ref={btnRef} type="button" onClick={() => setOpen(!open)} style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13.5,
        color: value ? 'var(--text)' : 'var(--text-muted)',
        outline: 'none', width: '100%', cursor: 'pointer', textAlign: 'left',
        fontFamily: "'Nunito', sans-serif", transition: 'border-color 0.15s',
      }}>
        {value ? formatDisplayDate(value) : placeholder}
      </button>

      {open && (
        <div ref={popRef} style={{
          position: 'fixed', top: popPos.top, left: popPos.left,
          width: 260, background: 'var(--surface)',
          border: '1px solid var(--border)', borderRadius: 'var(--r-xl)',
          padding: 16, boxShadow: 'var(--shadow-lg)', zIndex: 100,
        }} className="animate-scale-in">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <button onClick={prevMonth} type="button" style={navBtnStyle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} type="button" style={navBtnStyle}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
            {DAYS.map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, padding: '3px 0' }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: startDay }).map((_, i) => <div key={`e-${i}`} style={{ width: 32, height: 32 }} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const iso = toISO(viewYear, viewMonth, day);
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button key={day} type="button" onClick={() => handleSelect(day)} style={{
                  width: 32, height: 32, borderRadius: 'var(--r-sm)',
                  border: isToday && !isSelected ? '1px solid var(--accent-light)' : '1px solid transparent',
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  color: isSelected ? '#fff' : 'var(--text)',
                  fontSize: 12.5, fontWeight: isSelected || isToday ? 700 : 500,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--accent-softer)'; }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} style={{
              marginTop: 10, width: '100%', padding: '6px 0',
              background: 'none', border: 'none',
              fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer',
            }}>
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const navBtnStyle = {
  width: 28, height: 28, borderRadius: 'var(--r-sm)',
  background: 'var(--bg)', border: '1px solid var(--border)',
  color: 'var(--text-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
