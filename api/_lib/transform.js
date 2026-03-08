/** Snake_case Supabase rows → camelCase frontend objects */

export function toCamelGoal(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    mode: row.mode,
    target: row.target,
    unit: row.unit,
    dueDate: row.due_date,
    periodType: row.period_type,
    periodEnd: row.period_end,
    currentPeriodStart: row.current_period_start,
    recurrenceMode: row.recurrence_mode,
    currentValue: 0,
    actions: [],
  };
}

export function toCamelAction(row) {
  return {
    id: row.id,
    name: row.name,
    parentGoalId: row.parent_goal_id,
    status: row.status,
    target: row.target,
    unit: row.unit,
    dueDate: row.due_date,
    periodType: row.period_type,
    periodEnd: row.period_end,
    currentPeriodStart: row.current_period_start,
    recurrenceMode: row.recurrence_mode,
    lateralLinkTargetId: row.lateral_link_target_id,
    lateralLinkType: row.lateral_link_type,
    currentValue: 0,
  };
}

export function toCamelLog(row) {
  return {
    id: row.id,
    sourceType: row.source_type,
    sourceId: row.source_id,
    logDate: row.log_date,
    value: row.value,
    entryType: row.entry_type,
    periodLabel: row.period_label,
    isClosingEntry: row.is_closing_entry,
  };
}

/** camelCase input → snake_case columns for goals */
export function toSnakeGoal(data) {
  const map = {};
  if (data.name !== undefined) map.name = data.name;
  if (data.description !== undefined) map.description = data.description;
  if (data.status !== undefined) map.status = data.status;
  if (data.mode !== undefined) map.mode = data.mode;
  if (data.target !== undefined) map.target = data.target;
  if (data.unit !== undefined) map.unit = data.unit;
  if (data.dueDate !== undefined) map.due_date = data.dueDate;
  if (data.periodType !== undefined) map.period_type = data.periodType;
  if (data.periodEnd !== undefined) map.period_end = data.periodEnd;
  if (data.currentPeriodStart !== undefined) map.current_period_start = data.currentPeriodStart;
  if (data.recurrenceMode !== undefined) map.recurrence_mode = data.recurrenceMode;
  return map;
}

/** camelCase input → snake_case columns for actions */
export function toSnakeAction(data) {
  const map = {};
  if (data.name !== undefined) map.name = data.name;
  if (data.parentGoalId !== undefined) map.parent_goal_id = data.parentGoalId;
  if (data.status !== undefined) map.status = data.status;
  if (data.target !== undefined) map.target = data.target;
  if (data.unit !== undefined) map.unit = data.unit;
  if (data.dueDate !== undefined) map.due_date = data.dueDate;
  if (data.periodType !== undefined) map.period_type = data.periodType;
  if (data.periodEnd !== undefined) map.period_end = data.periodEnd;
  if (data.currentPeriodStart !== undefined) map.current_period_start = data.currentPeriodStart;
  if (data.recurrenceMode !== undefined) map.recurrence_mode = data.recurrenceMode;
  if (data.lateralLinkTargetId !== undefined) map.lateral_link_target_id = data.lateralLinkTargetId;
  if (data.lateralLinkType !== undefined) map.lateral_link_type = data.lateralLinkType;
  return map;
}
