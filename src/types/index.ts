export type UserRole = 'admin' | 'member';
export type UserStatus = 'active' | 'pending' | 'rejected';

export interface User {
  id: string;
  username: string; // User ID / Employee ID
  fullName: string;
  role: UserRole;
  status: UserStatus;
  password?: string;
  avatarUrl?: string;
  email?: string;
  department?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export type TaskCategory = 'lesson_plan' | 'evaluation' | 'research' | 'report' | 'other';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  startDate: string; // dd/mm/yyyy
  dueDate: string;   // dd/mm/yyyy
  isRange: boolean;
  dateRange: [string, string]; // [dd/mm/yyyy, dd/mm/yyyy]
  targetRole?: 'all' | 'teachers';
  createdBy: string;
  status: 'active' | 'archived';
  isPaperCompleted?: boolean;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  date: string; // dd/mm/yyyy
  category?: string;
  createdBy: string;
  expiresAt: string; // ISO String (15 days after createdAt)
  linkedTaskId?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface SubmittedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  driveFileId?: string;
  uploadedAt: string; // ISO String
}

export type SubmissionStatus = 'submitted' | 'approved' | 'revision';

export interface Submission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description?: string;
  files: SubmittedFile[];
  submittedAt: string; // ISO String
  status: SubmissionStatus;
  score?: number;
  remarks?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export type DocumentCategory = 'sample' | 'official_order'; // 1. Sample Documents (เอกสารตัวอย่าง), 2. Official Orders (หนังสือคำสั่ง)

export interface DocumentItem {
  id: string;
  title: string;
  category: DocumentCategory;
  description: string;
  orderNumber?: string;
  file: SubmittedFile;
  uploadedBy: string;
  uploaderName?: string;
  driveFileId?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export type AcademicDocument = DocumentItem;

export interface WebsiteDirectory {
  id: string;
  title: string;
  description: string;
  url: string;
  logoUrl: string;
  order: number;
  category?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export type RecommendedWebsite = WebsiteDirectory;

export interface SchoolSettings {
  schoolName: string;
  schoolNameEn?: string;
  schoolLogoUrl?: string;
  academicYear: string | number;
  semester: string | number;
  departmentName: string;
  googleDriveFolderId?: string;
  googleAppsScriptUrl?: string;
  googleSheetId?: string;
  updatedAt: string; // ISO String
}

export type ActiveTab = 'dashboard' | 'tasks' | 'documents' | 'websites';

export interface SweetAlertOptions {
  title: string;
  text?: string;
  icon: 'success' | 'error' | 'warning' | 'info' | 'question';
  showCancelButton?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}
