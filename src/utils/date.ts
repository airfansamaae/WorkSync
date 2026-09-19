export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const THAI_DAYS_SHORT = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

/**
 * Format a Date or ISO string into dd/mm/yyyy
 */
export function formatDateDMY(dateInput: Date | string | number): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a Date or dd/mm/yyyy string into Thai friendly text: "18 กันยายน 2569"
 */
export function formatThaiDate(dateInput: Date | string): string {
  let date: Date;
  if (typeof dateInput === 'string') {
    if (dateInput.includes('/')) {
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return dateInput.toString();

  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const yearBE = date.getFullYear() + 543;
  return `${day} ${month} ${yearBE}`;
}

/**
 * Format a Date or dd/mm/yyyy string into detailed Thai text with day of week:
 * e.g. "วันศุกร์ที่ 18 กันยายน พ.ศ. 2569"
 */
export function formatThaiFullDateWithDay(dateInput: Date | string): string {
  let date: Date;
  if (typeof dateInput === 'string') {
    if (dateInput.includes('/')) {
      const parts = dateInput.split('/');
      if (parts.length === 3) {
        date = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      } else {
        date = new Date(dateInput);
      }
    } else {
      date = new Date(dateInput);
    }
  } else {
    date = dateInput;
  }

  if (isNaN(date.getTime())) return dateInput.toString();

  const dayOfWeek = THAI_DAYS[date.getDay()];
  const day = date.getDate();
  const month = THAI_MONTHS[date.getMonth()];
  const yearBE = date.getFullYear() + 543;
  return `วัน${dayOfWeek}ที่ ${day} ${month} พ.ศ. ${yearBE}`;
}

/**
 * Parse dd/mm/yyyy into standard JavaScript Date
 */
export function parseDMY(dmyStr: string): Date | null {
  if (!dmyStr) return null;
  const parts = dmyStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const d = new Date(year, month, day, 23, 59, 59);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Check if a dd/mm/yyyy or ISO date is today
 */
export function isTodayDMY(dmyStr: string): boolean {
  const target = parseDMY(dmyStr);
  if (!target) return false;
  const today = new Date();
  return (
    target.getDate() === today.getDate() &&
    target.getMonth() === today.getMonth() &&
    target.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is within the next N days (default 30 days)
 */
export function isWithinDays(dmyStr: string, days = 30): boolean {
  const target = parseDMY(dmyStr);
  if (!target) return false;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Within past overdue up to 3 days or next 30 days
  return diffDays >= -2 && diffDays <= days;
}

/**
 * Check if an announcement has expired (15 days after creation)
 */
export function isNoticeActive(createdAtISO: string, expiresAtISO?: string): boolean {
  if (expiresAtISO) {
    return new Date(expiresAtISO).getTime() > Date.now();
  }
  const created = new Date(createdAtISO);
  if (isNaN(created.getTime())) return true;
  const expiry = new Date(created.getTime() + 15 * 24 * 60 * 60 * 1000);
  return expiry.getTime() > Date.now();
}

/**
 * Calculate remaining days until due date
 */
export function getDaysRemaining(dmyStr: string): { text: string; isOverdue: boolean; days: number } {
  const target = parseDMY(dmyStr);
  if (!target) return { text: '-', isOverdue: false, days: 0 };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `เลยกำหนด ${Math.abs(diffDays)} วัน`, isOverdue: true, days: diffDays };
  } else if (diffDays === 0) {
    return { text: 'ครบกำหนดวันนี้!', isOverdue: false, days: 0 };
  } else if (diffDays === 1) {
    return { text: 'เหลืออีก 1 วัน', isOverdue: false, days: 1 };
  } else {
    return { text: `เหลืออีก ${diffDays} วัน`, isOverdue: false, days: diffDays };
  }
}
