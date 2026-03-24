/**
 * Field Access Control System
 * Manages which fields can be edited before and after course approval
 */

export interface EditableField {
  name: string;
  label: string;
  editable: 'always' | 'pre-approval-only' | 'post-approval-only';
  reason?: string;
}

export const CLASS_EDITABLE_FIELDS: EditableField[] = [
  // Always editable fields (cosmetic, non-breaking)
  {
    name: 'title',
    label: 'Title',
    editable: 'always',
    reason: 'Can be updated anytime for better clarity'
  },
  {
    name: 'subtitle',
    label: 'Subtitle',
    editable: 'always',
    reason: 'Cosmetic field, safe to edit'
  },
  {
    name: 'videoLink',
    label: 'Thumbnail/Video Link',
    editable: 'always',
    reason: 'Cosmetic field, can improve presentation'
  },
  {
    name: 'thumbnailFile',
    label: 'Thumbnail Image',
    editable: 'always',
    reason: 'Cosmetic field, safe to edit'
  },

  // Post-approval only (too risky pre-approval)
  {
    name: 'description',
    label: 'Description',
    editable: 'post-approval-only',
    reason: 'Fundamental course content - only minor updates post-approval'
  },
  {
    name: 'whatStudentsWillLearn',
    label: 'Learning Outcomes',
    editable: 'post-approval-only',
    reason: 'Core learning outcomes approved by admin'
  },

  // Pre-approval only (cannot change post-approval)
  {
    name: 'category',
    label: 'Category',
    editable: 'pre-approval-only',
    reason: 'Changing category would affect course classification and student expectations'
  },
  {
    name: 'subCategory',
    label: 'Sub-Category',
    editable: 'pre-approval-only',
    reason: 'Core course classification - cannot be changed post-approval'
  },
  {
    name: 'price',
    label: 'Price',
    editable: 'pre-approval-only',
    reason: 'Cannot change price after students have enrolled'
  },
  {
    name: 'maxSeats',
    label: 'Max Seats',
    editable: 'pre-approval-only',
    reason: 'Capacity affects enrollment contracts and cannot be changed for approved courses'
  },
  {
    name: 'level',
    label: 'Level',
    editable: 'pre-approval-only',
    reason: 'Course level is part of the approved curriculum'
  },
];

/**
 * Check if a field can be edited given the approval status
 */
export function canEditField(fieldName: string, isApproved: boolean): boolean {
  const field = CLASS_EDITABLE_FIELDS.find(f => f.name === fieldName);
  if (!field) return true; // Unknown fields default to editable

  if (field.editable === 'always') return true;
  if (field.editable === 'pre-approval-only') return !isApproved;
  if (field.editable === 'post-approval-only') return isApproved;

  return false;
}

/**
 * Get the reason why a field cannot be edited
 */
export function getEditRestrictionReason(fieldName: string, isApproved: boolean): string | null {
  const field = CLASS_EDITABLE_FIELDS.find(f => f.name === fieldName);
  if (!field) return null;

  if (canEditField(fieldName, isApproved)) return null;

  if (field.editable === 'pre-approval-only' && isApproved) {
    return `This field cannot be edited after approval. ${field.reason}`;
  }

  if (field.editable === 'post-approval-only' && !isApproved) {
    return `This field can only be edited after the course is approved. ${field.reason}`;
  }

  return null;
}

/**
 * Get all restricted fields for a given approval status
 */
export function getRestrictedFields(isApproved: boolean): string[] {
  return CLASS_EDITABLE_FIELDS
    .filter(f => !canEditField(f.name, isApproved))
    .map(f => f.name);
}

/**
 * Get all editable fields for a given approval status
 */
export function getEditableFields(isApproved: boolean): string[] {
  return CLASS_EDITABLE_FIELDS
    .filter(f => canEditField(f.name, isApproved))
    .map(f => f.name);
}
