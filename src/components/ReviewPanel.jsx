import { useEffect } from 'react';
import { useUIStore } from '../store/ui';
import ReviewHub from './ReviewHub';
import ReviewForm from './ReviewForm';

export default function ReviewPanel() {
  const isOpen = useUIStore((s) => s.isReviewPanelOpen);
  const activeReview = useUIStore((s) => s.activeReview);
  const closeReviewPanel = useUIStore((s) => s.closeReviewPanel);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') closeReviewPanel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, closeReviewPanel]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeReviewPanel(); }}
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
          borderRadius: 'var(--r-2xl)',
          width: '100%',
          maxWidth: 780,
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(120,100,80,0.12), 0 16px 48px rgba(120,100,80,0.08)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {activeReview ? <ReviewForm /> : <ReviewHub />}
      </div>
    </div>
  );
}
