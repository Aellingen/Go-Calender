import { create } from 'zustand';

export const useUIStore = create((set) => ({
  expandedGoals: new Set(),
  calendarOpen: false,
  showCompleted: false,

  // Log modal state
  logModal: null,

  openLogModal: (item, sourceType) =>
    set({
      logModal: {
        id: item.id,
        name: item.name,
        sourceType,
        target: item.target,
        unit: item.unit,
        currentValue: item.currentValue ?? 0,
        currentPeriodStart: item.currentPeriodStart,
        periodEnd: item.periodEnd,
        periodType: item.periodType,
        recurrenceMode: item.recurrenceMode,
        lateralLinkTargetId: item.lateralLinkTargetId,
      },
    }),

  closeLogModal: () => set({ logModal: null }),

  // Goal Detail modal
  goalDetailModal: null,
  openGoalDetail: (goal) => set({ goalDetailModal: goal }),
  closeGoalDetail: () => set({ goalDetailModal: null }),

  // Action Edit modal
  actionEditModal: null,
  openActionEdit: (action) => set({ actionEditModal: action }),
  closeActionEdit: () => set({ actionEditModal: null }),

  // Create Goal modal
  createGoalOpen: false,
  openCreateGoal: () => set({ createGoalOpen: true }),
  closeCreateGoal: () => set({ createGoalOpen: false }),

  // Create Action modal
  createActionGoal: null,
  openCreateAction: (goal) => set({ createActionGoal: { id: goal.id, name: goal.name } }),
  closeCreateAction: () => set({ createActionGoal: null }),

  // Lateral link popover
  lateralPopover: null,
  openLateralPopover: (data) => set({ lateralPopover: data }),
  closeLateralPopover: () => set({ lateralPopover: null }),

  // Review panel
  isReviewPanelOpen: false,
  openReviewPanel: () => set({ isReviewPanelOpen: true }),
  closeReviewPanel: () => set({ isReviewPanelOpen: false, activeReview: null }),

  // Active review (when user clicks into a specific pending review)
  activeReview: null,
  setActiveReview: (review) => set({ activeReview: review }),
  clearActiveReview: () => set({ activeReview: null }),

  // Expanded history record
  expandedReviewId: null,
  setExpandedReviewId: (id) => set((state) => ({
    expandedReviewId: state.expandedReviewId === id ? null : id,
  })),

  toggleGoal: (goalId) =>
    set((state) => {
      const next = new Set(state.expandedGoals);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return { expandedGoals: next };
    }),

  toggleCalendar: () =>
    set((state) => ({ calendarOpen: !state.calendarOpen })),

  toggleShowCompleted: () =>
    set((state) => ({ showCompleted: !state.showCompleted })),
}));
