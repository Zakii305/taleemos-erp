import { type MessageTemplate } from '../types';
import { logAuditEvent } from './auditLogger';

const TEMPLATES_STORAGE_PREFIX = 'taleemos_msg_templates_v5_';

export const DYNAMIC_PLACEHOLDERS = [
  { tag: '{student_name}', label: 'Student Name', sample: 'Muhammad Hamza' },
  { tag: '{parent_name}', label: 'Parent / Father Name', sample: 'Ghulam Rasool' },
  { tag: '{roll_no}', label: 'Roll Number', sample: 'TAK-26-001' },
  { tag: '{class_name}', label: 'Class / Batch', sample: 'Batch 2026-A (Morning)' },
  { tag: '{due_amount}', label: 'Fee Due Amount', sample: '7,500' },
  { tag: '{due_date}', label: 'Due Date', sample: '28th Oct 2026' },
  { tag: '{consecutive_days}', label: 'Absence Days', sample: '4' },
  { tag: '{academy_name}', label: 'Academy Name', sample: 'Taleem Academy' },
  { tag: '{phone}', label: 'Contact Phone', sample: '+92 300 1234567' },
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl-fee-due',
    title: 'Monthly Tuition Fee Due Reminder',
    category: 'Fee Reminder',
    channel: 'SMS',
    message:
      'Dear Parent of {student_name} ({roll_no}), monthly fee of PKR {due_amount} for {class_name} is due by {due_date}. Please clear dues to avoid late fee surcharge. - {academy_name}',
    createdDate: '2026-10-24',
    isSystem: true,
  },
  {
    id: 'tmpl-absence-consecutive',
    title: 'Consecutive Absence Alert (>3 Days)',
    category: 'Attendance Alert',
    channel: 'WhatsApp',
    message:
      'URGENT NOTICE: Student {student_name} ({roll_no}) has missed {consecutive_days} consecutive classes in {class_name} without prior leave. Immediate parental explanation requested at academy office. - {academy_name}',
    createdDate: '2026-10-24',
    isSystem: true,
  },
  {
    id: 'tmpl-exam-schedule',
    title: 'Mid-Term Date Sheet & Exam Schedule',
    category: 'Exam Notice',
    channel: 'WhatsApp',
    message:
      'Dear Parent, Date Sheet for {class_name} Mid-Term Exams has been published. Student {student_name} must bring roll number slip and official ID card. - {academy_name}',
    createdDate: '2026-10-24',
    isSystem: true,
  },
  {
    id: 'tmpl-ptm-invite',
    title: 'Parent-Teacher Meeting (PTM) Invitation',
    category: 'General Announcement',
    channel: 'SMS',
    message:
      'Respected Parents, PTM for {class_name} is scheduled this Saturday from 10:00 AM to 01:00 PM. Kindly visit to review academic progress of {student_name}. - {academy_name}',
    createdDate: '2026-10-24',
    isSystem: true,
  },
  {
    id: 'tmpl-admission-confirm',
    title: 'Admission Confirmation & Welcome',
    category: 'Admission',
    channel: 'WhatsApp',
    message:
      'Welcome to {academy_name}! Admission of {student_name} (Roll #{roll_no}) is confirmed in {class_name}. Classes commence at 08:30 AM. - {academy_name}',
    createdDate: '2026-10-24',
    isSystem: true,
  },
];

export function getMessageTemplates(academyId?: string | null): MessageTemplate[] {
  const acadId = academyId || 'inst-1';
  const key = `${TEMPLATES_STORAGE_PREFIX}${acadId}`;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load message templates from storage:', e);
  }

  // Fallback to default
  try {
    localStorage.setItem(key, JSON.stringify(DEFAULT_TEMPLATES));
  } catch {}
  return DEFAULT_TEMPLATES;
}

export function saveMessageTemplate(
  template: Omit<MessageTemplate, 'id'> & { id?: string },
  academyId?: string | null
): { success: boolean; error?: string; template?: MessageTemplate } {
  const acadId = academyId || 'inst-1';
  const current = getMessageTemplates(acadId);

  if (!template.title.trim()) {
    return { success: false, error: 'Template title cannot be empty.' };
  }
  if (!template.message.trim()) {
    return { success: false, error: 'Message body cannot be empty.' };
  }

  let updatedList: MessageTemplate[];
  let savedItem: MessageTemplate;

  if (template.id) {
    // Edit existing
    const idx = current.findIndex((t) => t.id === template.id);
    if (idx !== -1) {
      savedItem = {
        ...current[idx],
        ...template,
        academyId: acadId,
      } as MessageTemplate;
      updatedList = [...current];
      updatedList[idx] = savedItem;
    } else {
      savedItem = {
        ...template,
        id: template.id,
        academyId: acadId,
        createdDate: new Date().toISOString().split('T')[0],
      } as MessageTemplate;
      updatedList = [savedItem, ...current];
    }
  } else {
    // New
    savedItem = {
      ...template,
      id: `tmpl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      academyId: acadId,
      createdDate: new Date().toISOString().split('T')[0],
      isSystem: false,
    };
    updatedList = [savedItem, ...current];
  }

  try {
    const key = `${TEMPLATES_STORAGE_PREFIX}${acadId}`;
    localStorage.setItem(key, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('taleemos_templates_changed'));

    logAuditEvent({
      action: template.id ? 'UPDATE_SMS_TEMPLATE' : 'CREATE_SMS_TEMPLATE',
      module: 'Communication',
      targetRecord: `Template: ${savedItem.title}`,
      targetId: savedItem.id,
      details: `Saved message draft "${savedItem.title}" under category "${savedItem.category}"`,
      academyId: acadId,
    });

    return { success: true, template: savedItem };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to save template.' };
  }
}

export function deleteMessageTemplate(
  id: string,
  academyId?: string | null
): { success: boolean; error?: string } {
  const acadId = academyId || 'inst-1';
  const current = getMessageTemplates(acadId);
  const target = current.find((t) => t.id === id);

  const updated = current.filter((t) => t.id !== id);
  try {
    const key = `${TEMPLATES_STORAGE_PREFIX}${acadId}`;
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('taleemos_templates_changed'));

    logAuditEvent({
      action: 'DELETE_SMS_TEMPLATE',
      module: 'Communication',
      targetRecord: `Template: ${target?.title || id}`,
      targetId: id,
      details: `Deleted message draft template "${target?.title || id}"`,
      academyId: acadId,
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to delete template.' };
  }
}

/**
 * Replace placeholders in text with actual or sample context values
 */
export function substitutePlaceholders(
  templateText: string,
  context: Record<string, string | number> = {}
): string {
  let result = templateText;
  const mergedContext: Record<string, string | number> = {
    '{student_name}': context.student_name || 'Muhammad Hamza',
    '{parent_name}': context.parent_name || 'Ghulam Rasool',
    '{roll_no}': context.roll_no || 'TAK-26-001',
    '{class_name}': context.class_name || 'Batch 2026-A (Morning)',
    '{due_amount}': context.due_amount || '7,500',
    '{due_date}': context.due_date || '28th Oct 2026',
    '{consecutive_days}': context.consecutive_days || '4',
    '{academy_name}': context.academy_name || 'Taleem Academy',
    '{phone}': context.phone || '+92 300 1234567',
    ...context,
  };

  Object.entries(mergedContext).forEach(([key, val]) => {
    const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, String(val));
  });

  return result;
}
