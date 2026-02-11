/**
 * Persist CRM segment edits locally when the server does not support update (404/405/400).
 * Merged into segment list/detail on load so changes survive refresh.
 */

const STORAGE_KEY = 'glimmora_crm_segment_overrides';

export function getSegmentOverrides(): Record<string, Record<string, unknown>> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function setSegmentOverride(id: string, data: Record<string, unknown>): void {
  try {
    const overrides = getSegmentOverrides();
    overrides[id] = { ...data, id };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}

export function clearSegmentOverride(id: string): void {
  try {
    const overrides = getSegmentOverrides();
    delete overrides[id];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    // ignore
  }
}
