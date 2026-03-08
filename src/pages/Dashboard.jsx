import { useEffect } from 'react';
import { format } from 'date-fns';
import { useGoals } from '../hooks/useGoals';
import { useUIStore } from '../store/ui';
import CalendarSidebar from '../components/CalendarPanel';
import PinnedActions from '../components/PinnedActions';
import GoalCard from '../components/GoalCard';
import GoalDetailModal from '../components/GoalDetailModal';
import ActionEditModal from '../components/ActionEditModal';
import LogModal from '../components/LogModal';
import CreateGoalModal from '../components/CreateGoalModal';
import CreateActionModal from '../components/CreateActionModal';
import LateralLinkPopover from '../components/LateralLinkPopover';
import ReviewButton from '../components/ReviewButton';
import ReviewPanel from '../components/ReviewPanel';
import ToastContainer from '../components/Toast';

export default function Dashboard() {
  const { data: goals = [], isLoading } = useGoals('active');
  const calendarOpen = useUIStore((s) => s.calendarOpen);

  const goalDetailModal = useUIStore((s) => s.goalDetailModal);
  const actionEditModal = useUIStore((s) => s.actionEditModal);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        useUIStore.getState().openCreateGoal();
      } else if (isMod && e.key === 'K') {
        e.preventDefault();
        if (goals.length > 0) {
          useUIStore.getState().openCreateAction(goals[0]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goals]);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header style={{
        height: 60,
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Logo mark */}
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r-md)',
            background: 'linear-gradient(135deg, var(--accent), var(--accent-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-accent)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: 20, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            Go Calendar
          </span>
        </div>

        <span style={{
          fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
        }}>
          {format(today, 'EEEE, MMMM d')}
        </span>
      </header>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Main Content ── */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 36px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
        }}>
          {/* Greeting + summary */}
          <div style={{ marginBottom: -4 }}>
            <h1 className="font-display" style={{
              fontSize: 28, color: 'var(--text)', margin: 0,
              letterSpacing: '-0.03em', lineHeight: 1.2,
            }}>
              {greeting}
            </h1>
            <p style={{
              fontSize: 14, color: 'var(--text-muted)', marginTop: 4,
            }}>
              {goals.length === 0 ? 'Set your first goal to get started.' :
               `${goals.length} active goal${goals.length !== 1 ? 's' : ''} — keep going.`}
            </p>
          </div>

          {/* Pinned Actions */}
          <PinnedActions />

          {/* Goals Section */}
          <section>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 16,
            }}>
              <h2 className="font-display" style={{
                fontSize: 17, color: 'var(--text)', margin: 0,
                letterSpacing: '-0.01em',
              }}>
                Your Goals
              </h2>
              <button
                onClick={() => useUIStore.getState().openCreateGoal()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px',
                  borderRadius: 'var(--r-full)',
                  background: 'var(--accent-softer)',
                  color: 'var(--accent)',
                  border: 'none',
                  fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s var(--ease-out)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.boxShadow = 'var(--shadow-accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--accent-softer)';
                  e.currentTarget.style.color = 'var(--accent)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Goal
              </button>
            </div>

            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--r-xl)' }} />
                ))}
              </div>
            ) : goals.length === 0 ? (
              <div style={{
                background: 'var(--surface)',
                border: '2px dashed var(--border)',
                borderRadius: 'var(--r-xl)',
                padding: '56px 32px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--r-lg)',
                  background: 'var(--accent-softer)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <h2 className="font-display" style={{
                  fontSize: 20, color: 'var(--text)', margin: '0 0 6px',
                }}>
                  No goals yet
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 280, margin: '0 auto' }}>
                  Create your first goal and start tracking what matters to you.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
              }}>
                {goals.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onClick={() => useUIStore.getState().openGoalDetail(g)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>

        {/* ── Calendar Sidebar — right ── */}
        <CalendarSidebar />
      </div>

      {/* Modals */}
      {goalDetailModal && (
        <GoalDetailModal
          goal={goalDetailModal}
          onClose={() => useUIStore.getState().closeGoalDetail()}
        />
      )}
      {actionEditModal && (
        <ActionEditModal
          action={actionEditModal}
          onClose={() => useUIStore.getState().closeActionEdit()}
        />
      )}
      <LogModal />
      <CreateGoalModal />
      <CreateActionModal />
      <LateralLinkPopover />
      <ReviewButton />
      <ReviewPanel />
      <ToastContainer />
    </div>
  );
}
