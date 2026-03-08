# Review Feature — Implementation Spec

You are implementing a **Weekly & Monthly Review** feature for Go Calendar. This replaces the existing `PeriodResetModal` entirely. The review is a user-initiated ritual where they close out a recurring period: verify/correct final values, write a note, and seal the period. Completed reviews are stored as historical records and browsable as a journal.

Read the entire codebase before starting. Understand the existing patterns for modals, API calls, Zustand stores, and TanStack Query hooks. Then implement this feature using identical patterns — same styling approach (inline styles with CSS custom properties, NOT Tailwind utility classes), same state management conventions, same API call patterns.

---

## 1. What to Delete

**Delete `PeriodResetModal` entirely.** Remove the component file, its Zustand state (`openPeriodReset`, etc.), any import references, and the auto-trigger logic on dashboard load that checks `pending_reset` and opens the modal. The review feature absorbs all of this functionality.

Do NOT delete the `pending_reset` field on the user object or the period reset API endpoint — those are reused.

---

## 2. New Data Model: Review Record

Create a new entity for the backend. If using Notion as the data source, this is a new database. The review record stores:

```
ReviewRecord {
  id: string
  userId: string
  reviewType: "weekly" | "monthly"
  periodStart: string (ISO date)
  periodEnd: string (ISO date)
  completedAt: string (ISO datetime, when the user submitted the review)
  note: string (freeform text, can be empty)
  actionSnapshots: ActionSnapshot[]
}

ActionSnapshot {
  actionId: string
  actionName: string
  parentGoalName: string
  target: number
  unit: string
  loggedValue: number    // the value that was logged during the period BEFORE the review
  sealedValue: number    // the final value the user confirmed/corrected during review
}
```

The `loggedValue` is what the system had recorded (sum of logs during the period). The `sealedValue` is what the user confirmed as the final truth. They may be equal (user didn't change anything) or different (user corrected).

---

## 3. New API Endpoints

### `GET /api/reviews`
Returns all review records for the current user, newest first. Used for the history view.

### `GET /api/reviews/pending`
Returns an array of pending review objects. A pending review is computed server-side by looking at all actions with a `periodType` (weekly or monthly) whose `periodEnd` is in the past and whose period has NOT been reviewed yet (no ReviewRecord exists with matching `actionId` + `periodEnd`). Each pending review object:

```
{
  reviewType: "weekly" | "monthly"
  periodStart: string
  periodEnd: string
  actions: [
    {
      actionId: string
      actionName: string
      parentGoalId: string
      parentGoalName: string
      target: number
      unit: string
      currentValue: number  // sum of logs during this period
      periodType: string
    }
  ]
}
```

Group actions by their period window. All weekly actions with the same `periodStart`/`periodEnd` go into one pending review. All monthly actions with the same period go into another.

### `POST /api/reviews`
Creates a review record and resets the periods for all included actions. Request body:

```
{
  reviewType: "weekly" | "monthly"
  periodStart: string
  periodEnd: string
  note: string
  actionSnapshots: [
    {
      actionId: string
      sealedValue: number
    }
  ]
}
```

Server-side, this endpoint must:
1. Create the ReviewRecord (populating `actionName`, `parentGoalName`, `target`, `unit`, `loggedValue` from current data)
2. For each action in the snapshot: if `sealedValue !== loggedValue`, create a corrective log entry (value = `sealedValue - loggedValue`) with `entryType: "review_correction"` so the action's `currentValue` matches `sealedValue`
3. Reset each action's period (same logic the old period reset used: advance `currentPeriodStart`, set new `periodEnd`, reset `currentValue` to 0)
4. If no more pending reviews remain, clear the user's `pending_reset` flag

---

## 4. New UI State (Zustand)

Add to `src/store/ui.js`:

```js
// Review panel
isReviewPanelOpen: false,
openReviewPanel: () => set({ isReviewPanelOpen: true }),
closeReviewPanel: () => set({ isReviewPanelOpen: false }),

// Active review (when user clicks into a specific pending review)
activeReview: null,  // { reviewType, periodStart, periodEnd, actions }
setActiveReview: (review) => set({ activeReview: review }),
clearActiveReview: () => set({ activeReview: null }),

// Expanded history record (when viewing a past review in detail)
expandedReviewId: null,
setExpandedReviewId: (id) => set({ expandedReviewId: id }),
```

---

## 5. New TanStack Query Hooks

Create `src/hooks/useReviews.js`:

```js
// Fetch pending reviews
export function usePendingReviews() {
  return useQuery({
    queryKey: ['reviews', 'pending'],
    queryFn: () => fetch('/api/reviews/pending').then(r => r.json()),
    staleTime: 30_000,
  });
}

// Fetch review history
export function useReviewHistory() {
  return useQuery({
    queryKey: ['reviews', 'history'],
    queryFn: () => fetch('/api/reviews').then(r => r.json()),
    staleTime: 30_000,
  });
}

// Submit a review
export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reviewData) =>
      fetch('/api/reviews', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(reviewData) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
```

---

## 6. Components to Build

All components use **inline styles referencing CSS custom properties** — the same pattern as every other component in the codebase. Do NOT use Tailwind classes. Reference the existing design tokens:

```
--color-bg: #F6F4F0
--color-card: #FFFFFF
--color-sidebar: #FAF8F5
--color-accent: #7C3AED
--color-accent-light: #A78BFA
--color-accent-softer: #EDE9FE
--color-orange: #F97316
--color-green: #10B981
--color-red: #EF4444
--color-text-primary: #1C1917
--color-text-secondary: #57534E
--color-text-muted: #A8A29E
--color-text-dim: #D6D3D1
--color-border: #E7E5E4
```

Fonts: `Bricolage Grotesque` (display, `.font-display`), `Nunito` (body). Corners: cards 22px, modals 28px, pills 9999px, inputs 14px.

### 6.1 `ReviewButton`

**Location:** Rendered in the main dashboard layout, positioned fixed bottom-right, offset from the calendar sidebar (right: 84px when sidebar collapsed, right: 308px when expanded — read sidebar state from Zustand).

**Behavior:**
- Calls `usePendingReviews()` to get the count
- **Idle state** (0 pending): Soft appearance — white card, light border, icon in `--accent-softer` background. Label: "Reviews", sublabel: "All caught up"
- **Pending state** (1+ pending): Icon background turns `--orange`, sublabel turns orange and reads "N pending", orange badge with count appears top-right of the button
- **Click:** Opens the ReviewPanel via `openReviewPanel()`

**Visual spec:**
- Pill shape (border-radius: 9999px), padding 12px 20px
- Contains: 32px icon container (border-radius: 10px) + text column (label 13px bold, sublabel 11px)
- Shadow: deep warm shadow
- Hover: lift 2px, deeper shadow, border turns `--accent-light`
- Badge: 20px circle, absolute top -4px right -4px, orange bg, white text 11px weight 800, 2px white border

### 6.2 `ReviewPanel`

**Trigger:** ReviewButton click. This is a modal (backdrop + centered panel), using the same backdrop and animation pattern as other modals in the app.

**Dimensions:** max-width 780px, max-height 85vh, border-radius 28px.

**Two states:**
1. **Hub view** (when `activeReview` is null): Shows tabs for "Pending" and "History"
2. **Active review view** (when `activeReview` is set): Shows the review form

#### Hub View — Pending Tab

List of pending review cards. Each card:
- Orange-tinted background (`#FFF7ED`), orange border (`#FED7AA`)
- 40px orange icon, review type label (uppercase 11px), period label (15px bold), meta text ("N actions to review")
- Click: sets `activeReview` to this pending review's data, switching to the active review view

#### Hub View — History Tab

Scrollable list of completed reviews, grouped by month. Each history card:
- Light background (`#FAFAF9`), border, 18px radius
- Type badge (purple pill for weekly, yellow pill for monthly), period label, review date
- Score ring: small 48px SVG donut showing N/M targets hit
- Hit/miss summary: colored dots + text
- Note preview: 2-line clamp, italic, muted
- Click: toggles `expandedReviewId` to show/hide inline detail

**Expanded history detail** (renders inline replacing the collapsed card):
- White background, 2px purple-ish border
- Full action list: each action with name, parent goal, sealed value / target, HIT/MISS badge
- Full note text in a light container
- HIT badge: green-soft bg, green text. MISS badge: orange-soft bg, orange text

### 6.3 `ReviewForm` (the active review view inside ReviewPanel)

This is the core experience. Renders when `activeReview` is set.

**Header:**
- Back arrow (returns to hub by clearing `activeReview`)
- Period type badge: purple pill for weekly ("WEEKLY REVIEW"), yellow pill for monthly ("MONTHLY REVIEW")
- Period label: display font, 24px (e.g., "Mar 1 – Mar 7" or "February 2026")
- Subtitle: "Review your performance and seal the week/month."
- Close button (closes entire panel)

**Section 1: Action cards with sliders**

Label: "Weekly/Monthly goals — final values" (uppercase, 11px, muted)

For each action in the pending review, render an `ActionReviewCard`:

**ActionReviewCard layout:**
- Card: `#FAFAF9` background, 1px border, 18px radius, 18px 20px padding
- When value differs from logged: border turns `--accent-light`, bg turns `#FDFCFB` (dirty state)
- **Top row:** left = action name (display font, 14px, 800) + parent goal name (11.5px, muted). Right = current value (display font, 24px, 800) + "of N unit" (12px, muted). Value color: `--text-primary` when at logged value, `--accent` when edited.
- **Status dot** after action name: 8px circle. Green with green shadow if current >= target, orange with orange shadow if below.
- **Slider row:** minus button (30px circle, border) + slider track + plus button

**Slider behavior (critical — match the existing ActionSliderCard pattern):**
- Track: 8px tall, full-round, `#EEECE9` background
- **Logged fill:** solid purple gradient (`--accent` to `--accent-light`), width = `loggedValue / target * 100%`. This fill does NOT move when the user drags — it represents the original logged value.
- **Delta fill:** semi-transparent overlay between logged and current position.
  - If current > logged: purple at 25% opacity, positioned from logged to current. Shows what the user is adding.
  - If current < logged: red at 20% opacity, positioned from current to logged. Shows what the user is removing.
  - If current === logged: hidden.
- **Logged marker:** 2px wide, 16px tall vertical tick at the logged value position. 40% opacity purple. Only visible when dirty (value differs from logged).
- **Thumb:** 18px circle, white, 2.5px purple border, purple shadow. Draggable. Position = `current / target * 100%`.
- **Stepper buttons:** minus decrements by 1 (min 0), plus increments by 1 (max = target). Hover: border and icon turn purple, bg turns `--accent-softer`.
- **Track click:** jumps value to clicked position.
- **Drag:** standard mousemove/mouseup pattern (same as existing ActionSliderCard).

Local state per card: `{ current: number }` initialized from `action.currentValue`. The `logged` reference value is also `action.currentValue` (immutable during the review).

**Section 2 (weekly review only): Monthly context**

Only render this section during a weekly review if the user has monthly-period actions.

- Purple-tinted container (`--accent-softer` bg, `#DDD6FE` border, 16px radius)
- Title: "Monthly goals — progress so far" (uppercase, 11px, `--accent`)
- For each monthly action: name, parent goal + target info, current value / target (purple, display font)
- This section is read-only — no sliders, no editing. It's context.

Fetch monthly actions from the existing `GET /api/actions` endpoint filtered by `periodType: 'monthly'`.

**Section 2 (monthly review only): Weekly performance roll-up**

- Container: subtle gradient bg, border, 18px radius
- Title: "Weekly performance this month" with calendar icon
- For each week in the month: a **collapsible row**

**Collapsed row:**
- Grid: week label + dates | mini progress bar (80px wide, 6px tall) | percentage | chevron
- Progress bar fill color: green gradient if 100%, purple gradient if 50-99%, orange gradient if below 50%
- Percentage: display font, 13px, color matches bar
- Chevron: rotates 180° when expanded

**Expanded row** (toggles on click):
- Slides open with max-height transition (0.3s)
- Per-action items: name, value/target, HIT/MISS badge
- Week note preview in a light container (white bg, border, 10px radius, italic)

Pull this data from `GET /api/reviews?type=weekly` filtered to the month being reviewed. If a weekly review hasn't been completed for a week within this month, show "Not yet reviewed" in muted text.

**Section 3: Notes**

- Label: "Notes on this week/month" (uppercase, 11px, muted)
- Textarea: 100% width, min-height 100px, 16px radius, 2px border, `#FAFAF9` bg
- Placeholder: "How did the week go? Anything worth remembering?" (weekly) or "How did the month go? Any patterns you noticed?" (monthly)
- Focus: border turns `--accent`, bg turns white

**Footer:**
- Left: "Later" text button (muted, closes panel without submitting)
- Center: info text "This will seal values and start a new period" (11px, dim)
- Right: "Complete Review" button — purple pill, white text, 14px 700, purple shadow. Hover: lift 2px.

**Submit flow:**
1. Collect all action snapshots: `{ actionId, sealedValue: current }` from each card's local state
2. Collect the note text
3. Call `submitReview({ reviewType, periodStart, periodEnd, note, actionSnapshots })`
4. On success: show success toast, clear `activeReview`, invalidate queries (pending reviews will update), close panel if no more pending reviews
5. On error: show error toast, stay on the form

---

## 7. Integration Points

### Dashboard layout
Add `<ReviewButton />` to the dashboard page, after the main content area. It's fixed-position so it sits on top of everything. Z-index: 45 (below modals at 50+).

### Sidebar awareness
The ReviewButton must account for sidebar width. Read sidebar collapsed/expanded state from Zustand. When collapsed: `right: 84px`. When expanded: `right: 308px`. Animate the position change with a 0.3s transition to match the sidebar transition.

### Remove PeriodResetModal auto-trigger
In the dashboard's effect hook (or wherever `pending_reset` currently triggers the PeriodResetModal), remove that logic entirely. The `pending_reset` flag is now only used by `ReviewButton` to drive its badge state as a supplementary signal — the primary signal is the `usePendingReviews()` query count.

### Keyboard shortcut
No keyboard shortcut for the review panel. It's intentionally manual — the user goes to it when they're ready.

### Toast messages
- On successful review: "Week of Mar 1–7 reviewed" or "February 2026 reviewed" (success toast)
- On error: "Failed to save review" (error toast)

---

## 8. Edge Cases

- **Multiple pending reviews:** User might have 2 weekly reviews and 1 monthly pending (e.g., they didn't open the app for 3 weeks). The hub lists all of them. They complete them one at a time.
- **Monthly review before all weekly reviews:** The monthly review should still work even if weekly reviews within that month are pending. The weekly roll-up section will show "Not yet reviewed" for those weeks. The user can do them in any order.
- **Action deleted or goal abandoned mid-period:** If an action no longer exists when the review is pending, skip it. The pending review endpoint should only include active actions.
- **No recurring actions:** If the user has no recurring actions, `usePendingReviews` returns empty, the ReviewButton shows idle state, and clicking it opens the hub with an empty pending tab and the history tab.
- **Value correction to 0:** Valid. The user can seal a value at 0 even if logs show progress. This creates a negative corrective log entry.
- **Note is optional:** Empty string is fine. Don't block submission on empty notes.

---

## 9. File Structure

```
src/
  components/
    ReviewButton.jsx          # Fixed-position button on dashboard
    ReviewPanel.jsx           # Modal container with hub/form views
    ReviewHub.jsx             # Pending + History tabs
    ReviewForm.jsx            # Active review with sliders + notes
    ActionReviewCard.jsx      # Individual action with slider
    ReviewHistoryCard.jsx     # Collapsed/expanded history entry
    WeeklyRollup.jsx          # Monthly review's collapsible week rows
  hooks/
    useReviews.js             # TanStack Query hooks
  store/
    ui.js                     # Add review-related state (listed above)
```

---

## 10. Implementation Order

1. **Backend first:** Create the ReviewRecord model/database, implement the 3 API endpoints (`GET /api/reviews`, `GET /api/reviews/pending`, `POST /api/reviews`). Test them independently.
2. **Zustand state:** Add review UI state to `src/store/ui.js`.
3. **Query hooks:** Create `src/hooks/useReviews.js`.
4. **ReviewButton:** Build and place on dashboard. Verify it reads pending count and shows both states.
5. **ReviewPanel + ReviewHub:** Build the modal, tabs, pending cards, history list. Wire up navigation.
6. **ActionReviewCard:** Build the slider component with delta fill logic. This is the most complex UI piece — get it right before integrating.
7. **ReviewForm:** Compose the full review form — action cards, context sections, notes, submit.
8. **WeeklyRollup:** Build the collapsible week rows for monthly reviews.
9. **ReviewHistoryCard:** Build collapsed and expanded states for the history tab.
10. **Delete PeriodResetModal:** Remove the component, its state, its auto-trigger, and all imports.
11. **Test the full flow:** Create a review, verify period resets, verify history shows the record, verify pending count decrements.

---

## 11. Design Reference Files

HTML sketches of each view are available. Study them for exact layout, spacing, colors, and interaction details:

- `sketch-1-dashboard-button.html` — ReviewButton placement, idle and pending states
- `sketch-2-weekly-review-v2.html` — Weekly ReviewForm with interactive sliders (drag/click/step to see delta fill behavior)
- `sketch-3-review-history.html` — ReviewHub with pending cards, history list, and expanded detail
- `sketch-4-monthly-review-v2.html` — Monthly ReviewForm with collapsible weekly roll-up (click week rows to expand/collapse)

These are functional HTML prototypes. The slider interactions, delta fill colors, expand/collapse animations, and visual hierarchy are all implemented in the sketches. Replicate them exactly in React.
