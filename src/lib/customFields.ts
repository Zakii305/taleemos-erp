import { type CustomFieldDefinition } from '../types';
import { logAuditEvent } from './auditLogger';

const CUSTOM_FIELDS_STORAGE_PREFIX = 'taleemos_custom_fields_v5_';

const DEFAULT_ACADEMY_FIELDS: Record<string, CustomFieldDefinition[]> = {
  'inst-1': [
    {
      id: 'cf_emerg_contact',
      label: 'Emergency Guardian Contact',
      type: 'text',
      placeholder: 'e.g. Uncle: Haji Noor (+92 300 1234567)',
      isRequired: false,
      academyId: 'inst-1',
      createdAt: '2026-10-24',
    },
    {
      id: 'cf_vaccination_date',
      label: 'Polio / Vaccination Date',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
      isRequired: false,
      academyId: 'inst-1',
      createdAt: '2026-10-24',
    },
    {
      id: 'cf_prev_school',
      label: 'Previous School / Board',
      type: 'text',
      placeholder: 'e.g. BISE Larkana / Govt High School',
      isRequired: false,
      academyId: 'inst-1',
      createdAt: '2026-10-24',
    },
  ],
};

export function getCustomFieldsForAcademy(academyId?: string | null): CustomFieldDefinition[] {
  const acadId = academyId || 'inst-1';
  const key = `${CUSTOM_FIELDS_STORAGE_PREFIX}${acadId}`;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, 5);
      }
    }
  } catch (e) {
    console.warn('Failed to load custom fields from storage:', e);
  }

  // Fallback to default presets
  const defaults = DEFAULT_ACADEMY_FIELDS[acadId] || DEFAULT_ACADEMY_FIELDS['inst-1'] || [];
  try {
    localStorage.setItem(key, JSON.stringify(defaults));
  } catch {}
  return defaults;
}

export function saveCustomFieldsForAcademy(
  academyId: string,
  fields: CustomFieldDefinition[]
): { success: boolean; error?: string } {
  if (fields.length > 5) {
    return { success: false, error: 'Maximum limit of 5 custom fields exceeded.' };
  }

  const key = `${CUSTOM_FIELDS_STORAGE_PREFIX}${academyId}`;
  try {
    localStorage.setItem(key, JSON.stringify(fields));
    window.dispatchEvent(new CustomEvent('taleemos_custom_fields_changed', { detail: { academyId } }));
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Storage error' };
  }
}

export function addCustomField(
  academyId: string,
  field: { label: string; type: 'text' | 'date'; placeholder?: string; isRequired?: boolean }
): { success: boolean; error?: string; field?: CustomFieldDefinition } {
  const current = getCustomFieldsForAcademy(academyId);

  if (current.length >= 5) {
    return {
      success: false,
      error: 'Cannot add more than 5 custom fields. Please remove or edit an existing field.',
    };
  }

  if (!field.label.trim()) {
    return { success: false, error: 'Field label cannot be empty.' };
  }

  const exists = current.some((f) => f.label.toLowerCase().trim() === field.label.toLowerCase().trim());
  if (exists) {
    return { success: false, error: 'A custom field with this label already exists.' };
  }

  const newField: CustomFieldDefinition = {
    id: `cf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    label: field.label.trim(),
    type: field.type,
    placeholder: field.placeholder || '',
    isRequired: Boolean(field.isRequired),
    academyId,
    createdAt: new Date().toISOString().split('T')[0],
  };

  const updated = [...current, newField];
  const res = saveCustomFieldsForAcademy(academyId, updated);
  if (res.success) {
    logAuditEvent({
      action: 'ADD_CUSTOM_FIELD',
      module: 'Settings',
      targetRecord: `Field: ${newField.label} (${newField.type})`,
      targetId: newField.id,
      details: `Added custom student attribute "${newField.label}" of type "${newField.type}"`,
      academyId,
    });
    return { success: true, field: newField };
  }
  return res;
}

export function updateCustomField(
  academyId: string,
  id: string,
  updates: Partial<CustomFieldDefinition>
): { success: boolean; error?: string } {
  const current = getCustomFieldsForAcademy(academyId);
  const idx = current.findIndex((f) => f.id === id);
  if (idx === -1) {
    return { success: false, error: 'Custom field not found.' };
  }

  const updatedField = { ...current[idx], ...updates };
  const updated = [...current];
  updated[idx] = updatedField;

  const res = saveCustomFieldsForAcademy(academyId, updated);
  if (res.success) {
    logAuditEvent({
      action: 'UPDATE_CUSTOM_FIELD',
      module: 'Settings',
      targetRecord: `Field: ${updatedField.label}`,
      targetId: id,
      details: `Updated custom student attribute "${updatedField.label}" (${updatedField.type})`,
      academyId,
    });
  }
  return res;
}

export function deleteCustomField(
  academyId: string,
  id: string
): { success: boolean; error?: string } {
  const current = getCustomFieldsForAcademy(academyId);
  const fieldToDelete = current.find((f) => f.id === id);
  const updated = current.filter((f) => f.id !== id);

  const res = saveCustomFieldsForAcademy(academyId, updated);
  if (res.success) {
    logAuditEvent({
      action: 'DELETE_CUSTOM_FIELD',
      module: 'Settings',
      targetRecord: `Field: ${fieldToDelete?.label || id}`,
      targetId: id,
      details: `Removed custom student attribute "${fieldToDelete?.label || id}"`,
      academyId,
    });
  }
  return res;
}
