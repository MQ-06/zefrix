export type EmailPolicyEvent =
  | 'admin_contact_message'
  | 'admin_creator_signup'
  | 'creator_payout_released';

const IMPORTANT_EVENTS = new Set<EmailPolicyEvent>([
  'admin_contact_message',
  'admin_creator_signup',
  'creator_payout_released',
]);

function normalizeBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function parseCsvToSet(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function shouldSendEmailForEvent(event: EmailPolicyEvent): boolean {
  // Global kill switch for emergency throttling.
  if (normalizeBool(process.env.EMAIL_SENDING_DISABLED, false)) {
    return false;
  }

  const normalizedEvent = event.trim().toLowerCase();
  const disabledEvents = parseCsvToSet(process.env.EMAIL_DISABLED_EVENTS);
  if (disabledEvents.has(normalizedEvent)) {
    return false;
  }

  const enabledEvents = parseCsvToSet(process.env.EMAIL_ENABLED_EVENTS);
  if (enabledEvents.size > 0) {
    return enabledEvents.has(normalizedEvent);
  }

  const importantOnly = normalizeBool(process.env.EMAIL_IMPORTANT_ONLY, true);
  if (importantOnly) {
    return IMPORTANT_EVENTS.has(event);
  }

  return true;
}
