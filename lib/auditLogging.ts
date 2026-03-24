/**
 * Audit Logging System
 * Tracks all field changes with timestamps and delta information
 */

export interface FieldChange {
  fieldName: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

export interface AuditLog {
  id?: string;
  classId: string;
  creatorId: string;
  creatorName?: string;
  timestamp: string;
  action: 'created' | 'updated' | 'approved' | 'rejected';
  changes: FieldChange[];
  ipAddress?: string;
  userAgent?: string;
  notes?: string;
}

/**
 * Create a new audit log entry for a class update
 */
export function createAuditLog(
  classId: string,
  creatorId: string,
  changes: FieldChange[],
  options?: {
    creatorName?: string;
    action?: AuditLog['action'];
    notes?: string;
  }
): AuditLog {
  return {
    classId,
    creatorId,
    timestamp: new Date().toISOString(),
    action: options?.action || 'updated',
    changes,
    creatorName: options?.creatorName,
    notes: options?.notes,
  };
}

/**
 * Compare old and new values to generate field changes
 */
export function generateFieldChanges(
  oldValues: Record<string, any>,
  newValues: Record<string, any>
): FieldChange[] {
  const changes: FieldChange[] = [];

  // Check all fields in new values
  for (const [fieldName, newValue] of Object.entries(newValues)) {
    const oldValue = oldValues[fieldName];

    // Skip if values are the same
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    changes.push({
      fieldName,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });
  }

  return changes;
}

/**
 * Format a field change for human-readable display
 */
export function formatFieldChange(change: FieldChange): string {
  const fieldLabel = change.fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  const oldStr = formatValue(change.oldValue);
  const newStr = formatValue(change.newValue);

  return `${fieldLabel}: "${oldStr}" → "${newStr}"`;
}

/**
 * Helper to format values for display
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) return 'empty';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).substring(0, 50); // Truncate long strings
}

/**
 * Generate an audit log summary for display
 */
export function getAuditLogSummary(log: AuditLog): string {
  const timestamp = new Date(log.timestamp).toLocaleString();
  const changesCount = log.changes.length;
  const changesSummary = log.changes
    .map((c) => `${c.fieldName}`)
    .join(', ');

  return `${log.action} by ${log.creatorName || log.creatorId} on ${timestamp} (${changesCount} field${changesCount === 1 ? '' : 's'} changed: ${changesSummary})`;
}
