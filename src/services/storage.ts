import {
  User,
  Task,
  Notice,
  Submission,
  DocumentItem,
  WebsiteDirectory,
  SchoolSettings
} from '../types';
import { formatDateDMY } from '../utils/date';
import { GoogleDriveService, TARGET_DRIVE_FOLDER_ID, DEFAULT_GAS_URL } from './googleDriveService';

const STORAGE_KEY = 'ACADEMIC_MGMT_V2';

export interface StorageData {
  users: User[];
  tasks: Task[];
  notices: Notice[];
  submissions: Submission[];
  documents: DocumentItem[];
  websites: WebsiteDirectory[];
  settings: SchoolSettings;
}

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

// Generate dynamic dates around current date
const formatFutureDate = (daysAhead: number) => {
  const d = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  return formatDateDMY(d);
};

const formatPastDate = (daysAgo: number) => {
  const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return formatDateDMY(d);
};

const initialUsers: User[] = [
  {
    id: 'user-admin',
    username: 'Admin',
    fullName: 'ดร.สมศักดิ์ สุขเจริญ (ผู้อำนวยการฝ่ายวิชาการ)',
    role: 'admin',
    status: 'active',
    password: '456789',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: 'admin@school.ac.th',
    department: 'ฝ่ายบริหารงานวิชาการ',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'user-teacher-1',
    username: 'kru_wichai',
    fullName: 'ครูวิชัย สุวรรณรัตน์',
    role: 'member',
    status: 'active',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'wichai@school.ac.th',
    department: 'กลุ่มสาระการเรียนรู้คณิตศาสตร์',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'user-teacher-2',
    username: 'kru_nareerat',
    fullName: 'ครูนารีรัตน์ พิทยาภรณ์',
    role: 'member',
    status: 'active',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    email: 'nareerat@school.ac.th',
    department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'user-teacher-pending',
    username: 'kru_anawat',
    fullName: 'ครูอนวัช ธนกิจไพศาล',
    role: 'member',
    status: 'pending',
    password: 'password123',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    email: 'anawat@school.ac.th',
    department: 'กลุ่มสาระการเรียนรู้ภาษาต่างประเทศ',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1 ประจำปีการศึกษา 2569',
    description: 'ขอให้คุณครูทุกท่านจัดทำแผนการจัดการเรียนรู้ตามมาตรฐานตัวชี้วัด พร้อมทั้งแนบไฟล์บันทึกหลังสอนและโครงสร้างรายวิชาฉบับเต็ม',
    category: 'lesson_plan',
    startDate: formatPastDate(5),
    dueDate: formatFutureDate(3),
    isRange: true,
    dateRange: [formatPastDate(5), formatFutureDate(3)],
    targetRole: 'all',
    createdBy: 'Admin',
    status: 'active',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'task-2',
    title: 'ส่งแบบ ปพ.5 และบันทึกคะแนนเก็บระหว่างภาคเรียน',
    description: 'สรุปผลคะแนนประเมินตัวชี้วัดรายวิชาพื้นฐานและเพิ่มเติม ตรวจสอบความถูกต้องและลงลายมือชื่อก่อนส่งไฟล์ระบบ',
    category: 'evaluation',
    startDate: formatPastDate(2),
    dueDate: formatFutureDate(10),
    isRange: true,
    dateRange: [formatPastDate(2), formatFutureDate(10)],
    targetRole: 'all',
    createdBy: 'Admin',
    status: 'active',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'task-3',
    title: 'รายงานผลการดำเนินงานวิจัยในชั้นเรียน (Classroom Action Research)',
    description: 'รายงานการแก้ปัญหาหรือพัฒนานวัตกรรมการเรียนรู้ของผู้เรียนอย่างน้อย 1 เรื่องต่อภาคเรียน',
    category: 'research',
    startDate: formatFutureDate(7),
    dueDate: formatFutureDate(22),
    isRange: true,
    dateRange: [formatFutureDate(7), formatFutureDate(22)],
    targetRole: 'all',
    createdBy: 'Admin',
    status: 'active',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'task-4',
    title: 'ส่งรายงานสรุปผลการปฏิบัติงานและโครงการตามแผนปฏิบัติการ (SAR รายบุคคล)',
    description: 'จัดทำเอกสารประเมินตนเอง พร้อมหลักฐานร่องรอยการปฏิบัติงานเพื่อรับการนิเทศภายใน',
    category: 'report',
    startDate: formatFutureDate(15),
    dueDate: formatFutureDate(28),
    isRange: false,
    dateRange: [formatFutureDate(28), formatFutureDate(28)],
    targetRole: 'all',
    createdBy: 'Admin',
    status: 'active',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const initialNotices: Notice[] = [
  {
    id: 'notice-1',
    title: '📢 ประชุมขับเคลื่อนการยกระดับผลสัมฤทธิ์ทางการเรียน ประจำภาคเรียนที่ 1/2569',
    description: 'เรียนเชิญคณะครูและบุคลากรทางการศึกษาทุกท่านเข้าร่วมประชุม ณ หอประชุมเสมาภิบาล เวลา 13.00 น. วันศุกร์นี้ เพื่อวางกรอบการประเมินและแนวทางส่งเสริมผู้เรียน',
    date: formatFutureDate(2),
    category: 'การประชุมวิชาการ',
    createdBy: 'Admin',
    expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'notice-2',
    title: '📌 แจ้งกำหนดการนิเทศการจัดการเรียนรู้แบบ Active Learning ในห้องเรียน',
    description: 'คณะกรรมการฝ่ายวิชาการจะเข้าสังเกตชั้นเรียนเพื่อเสริมสร้างศักยภาพการจัดกิจกรรมเชิงรุก ระหว่างวันที่ 20-30 ของเดือนนี้ โปรดเตรียมแผนการสอน',
    date: formatFutureDate(6),
    category: 'นิเทศการศึกษา',
    createdBy: 'Admin',
    expiresAt: new Date(Date.now() + 12 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'notice-3',
    title: '📝 เตือนกำหนดส่ง: แผนการจัดการเรียนรู้บูรณาการท้องถิ่น (ใกล้ครบกำหนด)',
    description: 'คุณครูท่านใดที่ยังไม่ได้อัปโหลดแผนการจัดการเรียนรู้ ให้ดำเนินการส่งผ่านระบบให้เรียบร้อยภายในสัปดาห์นี้เพื่อสรุปรายงานต่อฝ่ายบริหาร',
    date: formatFutureDate(3),
    category: 'ส่งงานวิชาการ',
    createdBy: 'Admin',
    expiresAt: new Date(Date.now() + 15 * 86400000).toISOString(),
    linkedTaskId: 'task-1',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

const initialSubmissions: Submission[] = [
  {
    id: 'sub-1',
    taskId: 'task-1',
    userId: 'user-teacher-1',
    userName: 'ครูวิชัย สุวรรณรัตน์',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'แผนการจัดการเรียนรู้คณิตศาสตร์ ม.3 เรื่อง วงกลมและสถิติ',
    description: 'แนบไฟล์แผนฉบับสมบูรณ์ พร้อมแบบวัดผลประเมินผล รูบริกส์ และสื่อดิจิทัลประกอบการสอน',
    files: [
      {
        id: 'file-1',
        name: 'แผนการสอน_คณิตศาสตร์ม3_เทอม1.pdf',
        size: 3450000,
        type: 'application/pdf',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'file-2',
        name: 'แบบประเมินRubrics_สถิติ.docx',
        size: 512000,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        url: '#',
        uploadedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      }
    ],
    submittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    status: 'approved',
    score: 95,
    remarks: 'แผนการสอนมีรายละเอียดชัดเจน สอดคล้องกับมาตรฐานและจัดกิจกรรมเชิงรุกได้ดีมาก',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  }
];

const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    title: 'แบบฟอร์มแผนการจัดการเรียนรู้แบบเชิงรุก (Active Learning Template 2569)',
    category: 'sample',
    description: 'เทมเพลตมาตรฐานสำหรับเขียนแผนการสอน 5 ขั้นตอน พร้อมคำอธิบายการจัดทำเครื่องมือวัดและประเมินผล',
    file: {
      id: 'file-doc-1',
      name: 'Template_ActiveLearning_Plan_2569.docx',
      size: 1240000,
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    uploadedBy: 'user-admin',
    uploaderName: 'ดร.สมศักดิ์ สุขเจริญ',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'doc-2',
    title: 'แบบฟอร์มรายงานการวิจัยในชั้นเรียน (CAR 5 บท)',
    category: 'sample',
    description: 'เค้าโครงรายงานวิจัยเชิงปฏิบัติการในชั้นเรียนเพื่อแก้ปัญหาการเรียนรู้ของผู้เรียน',
    file: {
      id: 'file-doc-2',
      name: 'Form_Classroom_Research_5Chapters.pdf',
      size: 2850000,
      type: 'application/pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    uploadedBy: 'user-admin',
    uploaderName: 'ดร.สมศักดิ์ สุขเจริญ',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'doc-3',
    title: 'คำสั่งโรงเรียนที่ 124/2569 เรื่อง แต่งตั้งคณะกรรมการพัฒนาหลักสูตรสถานศึกษา',
    category: 'official_order',
    orderNumber: '124/2569',
    description: 'มอบหมายภาระงานและโครงสร้างคณะกรรมการฝ่ายปรับปรุงหลักสูตรแกนกลางสถานศึกษา',
    file: {
      id: 'file-doc-3',
      name: 'Order_124_2569_Curriculum_Committee.pdf',
      size: 4200000,
      type: 'application/pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    },
    uploadedBy: 'user-admin',
    uploaderName: 'ดร.สมศักดิ์ สุขเจริญ',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'doc-4',
    title: 'คำสั่งโรงเรียนที่ 135/2569 เรื่อง แต่งตั้งคณะกรรมการนิเทศภายในสถานศึกษา',
    category: 'official_order',
    orderNumber: '135/2569',
    description: 'แต่งตั้งคณะครูผู้นิเทศและตารางการเข้าตรวจเยี่ยมชั้นเรียนในภาคเรียนที่ 1',
    file: {
      id: 'file-doc-4',
      name: 'Order_135_2569_Internal_Supervision.pdf',
      size: 3100000,
      type: 'application/pdf',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      uploadedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    },
    uploadedBy: 'user-admin',
    uploaderName: 'ดร.สมศักดิ์ สุขเจริญ',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  }
];

const initialWebsites: WebsiteDirectory[] = [
  {
    id: 'web-1',
    title: 'สพฐ. (OBEC)',
    description: 'สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน แหล่งรวมข่าวสาร นโยบาย และเอกสารหลักสูตรการศึกษาแห่งชาติ',
    url: 'https://www.obec.go.th',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/th/thumb/f/f2/Emblem_of_the_Office_of_the_Basic_Education_Commission.svg/200px-Emblem_of_the_Office_of_the_Basic_Education_Commission.svg.png',
    order: 0,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'web-2',
    title: 'กระทรวงศึกษาธิการ (MOE)',
    description: 'ศูนย์กลางราชการกระทรวงศึกษาธิการ ติดตามกฎระเบียบ นโยบายการศึกษา และมาตรฐานวิชาชีพครู',
    url: 'https://www.moe.go.th',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Emblem_of_the_Ministry_of_Education_of_Thailand.svg/200px-Emblem_of_the_Ministry_of_Education_of_Thailand.svg.png',
    order: 1,
    createdAt: new Date(Date.now() - 29 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
  },
  {
    id: 'web-3',
    title: 'DLIT การศึกษาทางไกล',
    description: 'Distance Learning Information Technology คลังสื่อดิจิทัล คลิปการสอน แผนการจัดการเรียนรู้ และข้อสอบมาตรฐาน',
    url: 'https://www.dlit.ac.th',
    logoUrl: 'https://api.iconify.design/lucide:tv.svg?color=%237c3aed',
    order: 2,
    createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
  },
  {
    id: 'web-4',
    title: 'คุรุสภา (Khurusapha)',
    description: 'ระบบต่อใบอนุญาตประกอบวิชาชีพครูและบุคลากรทางการศึกษา จรรยาบรรณวิชาชีพ และประกาศเกียรติคุณ',
    url: 'https://www.ksp.or.th',
    logoUrl: 'https://api.iconify.design/lucide:award.svg?color=%2310b981',
    order: 3,
    createdAt: new Date(Date.now() - 27 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 27 * 86400000).toISOString(),
  },
  {
    id: 'web-5',
    title: 'สพม. / สพป. เขตพื้นที่',
    description: 'ศูนย์ข้อมูลสารสนเทศเขตพื้นที่การศึกษา ระบบรับส่งหนังสือราชการอิเล็กทรอนิกส์ (e-Saraban)',
    url: 'https://www.krabiedu.go.th',
    logoUrl: 'https://api.iconify.design/lucide:building-2.svg?color=%23f59e0b',
    order: 4,
    createdAt: new Date(Date.now() - 26 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 26 * 86400000).toISOString(),
  },
  {
    id: 'web-6',
    title: 'คลังสื่อการสอน ครูเชียงราย',
    description: 'แหล่งรวมใบงาน แผนการสอน สื่อตกแต่งห้องเรียน และตัวอย่างผลงานทางวิชาการเพื่อเลื่อนวิทยฐานะ',
    url: 'https://www.kruchiangrai.net',
    logoUrl: 'https://api.iconify.design/lucide:book-open-check.svg?color=%23ef4444',
    order: 5,
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
];

const initialSettings: SchoolSettings = {
  schoolName: 'โรงเรียนวิชาการศึกษาพัฒน์วิทยายน',
  schoolNameEn: 'Phatthana Academic Demonstration School',
  schoolLogoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=160&auto=format&fit=crop&q=80',
  academicYear: '2569',
  semester: '1',
  departmentName: 'กลุ่มบริหารงานวิชาการ (Academic Affairs)',
  googleDriveFolderId: TARGET_DRIVE_FOLDER_ID,
  googleAppsScriptUrl: DEFAULT_GAS_URL,
  updatedAt: new Date().toISOString(),
};

export class StorageService {
  private static initialSyncDone = false;

  private static loadData(): StorageData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure Admin user always exists with password
        if (!parsed.users || !parsed.users.some((u: User) => u.username === 'Admin')) {
          parsed.users = [...(parsed.users || []), initialUsers[0]];
        }
        if (parsed.settings) {
          parsed.settings.googleAppsScriptUrl = DEFAULT_GAS_URL;
          parsed.settings.googleDriveFolderId = TARGET_DRIVE_FOLDER_ID;
        }

        // Trigger initial sync once in background
        if (!this.initialSyncDone) {
          this.initialSyncDone = true;
          setTimeout(() => {
            this.triggerAutoSyncToGoogleSheets(parsed);
          }, 1000);
        }

        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse local storage data:', e);
    }

    const defaultData: StorageData = {
      users: initialUsers,
      tasks: initialTasks,
      notices: initialNotices,
      submissions: initialSubmissions,
      documents: initialDocuments,
      websites: initialWebsites,
      settings: initialSettings,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));

    if (!this.initialSyncDone) {
      this.initialSyncDone = true;
      setTimeout(() => {
        this.triggerAutoSyncToGoogleSheets(defaultData);
      }, 1000);
    }

    return defaultData;
  }

  private static syncTimeout: any = null;

  private static triggerAutoSyncToGoogleSheets(data: StorageData) {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }
    // Debounce 1.5s to batch rapid changes and sync to Google Sheets automatically
    this.syncTimeout = setTimeout(() => {
      const gasUrl = GoogleDriveService.getGasUrl();
      if (!gasUrl) return;

      GoogleDriveService.syncToGoogleSheets({
        tasks: data.tasks,
        submissions: data.submissions,
        documents: data.documents,
        notices: data.notices,
        websites: data.websites,
        users: data.users,
        settings: data.settings,
      }).catch((err) => {
        console.warn('Auto-sync to Google Sheets background note:', err);
      });
    }, 1500);
  }

  /**
   * Immediate manual trigger to push all current data to Google Sheets
   */
  static async syncAllNow(): Promise<{ success: boolean; message: string }> {
    const data = this.loadData();
    return GoogleDriveService.syncToGoogleSheets({
      tasks: data.tasks,
      submissions: data.submissions,
      documents: data.documents,
      notices: data.notices,
      websites: data.websites,
      users: data.users,
      settings: data.settings,
    });
  }

  /**
   * Pull latest data from Google Sheets into local storage (enables multi-device / multi-browser sync)
   */
  static async pullFromGoogleSheets(): Promise<{ success: boolean; message: string; updated?: boolean }> {
    const res = await GoogleDriveService.fetchFromGoogleSheets();
    if (!res.success || !res.data) {
      return { success: false, message: res.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้' };
    }

    try {
      const current = this.loadData();
      const incoming = res.data;
      let hasUpdates = false;

      // Merge tasks
      if (Array.isArray(incoming.tasks) && incoming.tasks.length > 0) {
        current.tasks = incoming.tasks.map((t: any): Task => {
          const start = String(t.startDate || t['Start Date'] || '');
          const due = String(t.dueDate || t['Due Date'] || start);
          return {
            id: String(t.id || t.ID || `task-${Date.now()}`),
            title: String(t.title || t.Title || ''),
            description: String(t.description || t.Description || ''),
            category: (t.category || t.Category || 'lesson_plan') as any,
            startDate: start,
            dueDate: due,
            isRange: Boolean(t.isRange || (start && due && start !== due)),
            dateRange: [start, due],
            targetRole: (t.targetRole || t['Target Role'] || 'all') as any,
            createdBy: String(t.createdBy || t['Created By'] || 'Admin'),
            status: (t.status || t.Status || 'active') as any,
            createdAt: String(t.createdAt || t['Created At'] || new Date().toISOString()),
            updatedAt: String(t.updatedAt || t['Updated At'] || new Date().toISOString()),
          };
        });
        hasUpdates = true;
      }

      // Merge submissions
      if (Array.isArray(incoming.submissions) && incoming.submissions.length > 0) {
        current.submissions = incoming.submissions.map((s: any): Submission => {
          const subDate = String(s.submittedAt || s['Submitted At'] || new Date().toISOString());
          return {
            id: String(s.id || s['Submission ID'] || `sub-${Date.now()}`),
            taskId: String(s.taskId || s['Task ID'] || ''),
            userId: String(s.userId || s['User ID'] || ''),
            userName: String(s.userName || s['Teacher Name'] || ''),
            title: String(s.title || s.Title || ''),
            description: String(s.description || s.Description || ''),
            files: Array.isArray(s.files) ? s.files : [],
            status: (s.status || s.Status || 'submitted') as any,
            submittedAt: subDate,
            createdAt: String(s.createdAt || subDate),
            updatedAt: String(s.updatedAt || subDate),
          };
        });
        hasUpdates = true;
      }

      // Merge documents
      if (Array.isArray(incoming.documents) && incoming.documents.length > 0) {
        current.documents = incoming.documents.map((d: any): DocumentItem => ({
          id: String(d.id || d.ID || `doc-${Date.now()}`),
          title: String(d.title || d.Title || ''),
          category: (d.category || d.Category || 'sample') as any,
          orderNumber: d.orderNumber || d['Order Number'],
          description: String(d.description || d.Description || ''),
          file: d.file || {
            id: `file-${Date.now()}`,
            name: String(d['File Name'] || 'Document.pdf'),
            size: 1024000,
            type: 'application/pdf',
            url: String(d['Google Drive Link'] || ''),
            uploadedAt: new Date().toISOString(),
          },
          uploadedBy: String(d.uploadedBy || d['Uploaded By'] || 'user-admin'),
          createdAt: String(d.createdAt || d['Created At'] || new Date().toISOString()),
          updatedAt: String(d.updatedAt || d['Updated At'] || new Date().toISOString()),
        }));
        hasUpdates = true;
      }

      // Merge notices
      if (Array.isArray(incoming.notices) && incoming.notices.length > 0) {
        current.notices = incoming.notices.map((n: any): Notice => {
          const created = String(n.createdAt || n['Created At'] || new Date().toISOString());
          return {
            id: String(n.id || n.ID || `notice-${Date.now()}`),
            title: String(n.title || n.Title || ''),
            description: String(n.description || n.content || n.Content || n.Description || ''),
            date: String(n.date || new Date().toLocaleDateString('th-TH')),
            category: n.category || n.Category || 'general',
            createdBy: String(n.createdBy || n.author || n.Author || 'Admin'),
            createdAt: created,
            updatedAt: String(n.updatedAt || created),
            expiresAt: String(n.expiresAt || n['Expires At'] || new Date(Date.now() + 15 * 86400000).toISOString()),
          };
        });
        hasUpdates = true;
      }

      // Merge websites
      if (Array.isArray(incoming.websites) && incoming.websites.length > 0) {
        current.websites = incoming.websites.map((w: any): WebsiteDirectory => ({
          id: String(w.id || w.ID || `web-${Date.now()}`),
          title: String(w.title || w.Title || ''),
          url: String(w.url || w.URL || ''),
          description: String(w.description || w.Description || ''),
          logoUrl: String(w.logoUrl || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(w.url || 'google.com')}&sz=128`),
          order: Number(w.order || w.Order || 0),
          category: w.category || w.Category,
          createdAt: String(w.createdAt || w['Created At'] || new Date().toISOString()),
          updatedAt: String(w.updatedAt || w['Updated At'] || new Date().toISOString()),
        }));
        hasUpdates = true;
      }

      // Merge users (always keeping Admin user intact)
      if (Array.isArray(incoming.users) && incoming.users.length > 0) {
        const mappedUsers: User[] = incoming.users.map((u: any): User => ({
          id: String(u.id || u.ID || `user-${Date.now()}`),
          username: String(u.username || u.Username || ''),
          fullName: String(u.fullName || u['Full Name'] || ''),
          role: (u.role || u.Role || 'member') as any,
          status: (u.status || u.Status || 'active') as any,
          department: u.department || u.Department || undefined,
          email: u.email || u.Email || undefined,
          createdAt: String(u.createdAt || u['Created At'] || new Date().toISOString()),
          updatedAt: String(u.updatedAt || u['Updated At'] || new Date().toISOString()),
        })).filter(u => u.username);

        if (!mappedUsers.some(u => u.username === 'Admin')) {
          const admin = current.users.find(u => u.username === 'Admin') || initialUsers[0];
          mappedUsers.unshift(admin);
        }
        current.users = mappedUsers;
        hasUpdates = true;
      }

      if (hasUpdates) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      }

      return {
        success: true,
        updated: hasUpdates,
        message: 'อัปเดตข้อมูลจาก Google Sheets เรียบร้อยแล้ว',
      };
    } catch (e: any) {
      return { success: false, message: e.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' };
    }
  }

  private static saveData(data: StorageData) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      // Auto-sync text and metadata to Google Sheets automatically
      this.triggerAutoSyncToGoogleSheets(data);
    } catch (e) {
      console.error('Failed to save to local storage:', e);
    }
  }

  // --- USERS ---
  static getUsers(): User[] {
    return this.loadData().users;
  }

  static getUserById(id: string): User | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  static getUserByUsername(username: string): User | undefined {
    const clean = username.trim().toLowerCase();
    return this.getUsers().find(
      (u) =>
        u.username.toLowerCase() === clean ||
        (u.email && u.email.toLowerCase() === clean)
    );
  }

  static getUserByUsernameOrEmail(identifier: string): User | undefined {
    return this.getUserByUsername(identifier);
  }

  static createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const data = this.loadData();
    const nowIso = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.users.push(newUser);
    this.saveData(data);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<User>): User | null {
    const data = this.loadData();
    const idx = data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    data.users[idx] = {
      ...data.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.users[idx];
  }

  static deleteUser(id: string): boolean {
    const data = this.loadData();
    const initialLen = data.users.length;
    data.users = data.users.filter((u) => u.id !== id);
    if (data.users.length !== initialLen) {
      this.saveData(data);
      return true;
    }
    return false;
  }

  // --- TASKS ---
  static getTasks(): Task[] {
    return this.loadData().tasks;
  }

  static createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const data = this.loadData();
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.tasks.unshift(newTask);
    this.saveData(data);
    return newTask;
  }

  static updateTask(id: string, updates: Partial<Task>): Task | null {
    const data = this.loadData();
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    data.tasks[idx] = {
      ...data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.tasks[idx];
  }

  static deleteTask(id: string): boolean {
    const data = this.loadData();
    data.tasks = data.tasks.filter((t) => t.id !== id);
    data.submissions = data.submissions.filter((s) => s.taskId !== id);
    this.saveData(data);
    return true;
  }

  // --- NOTICES ---
  static getNotices(): Notice[] {
    return this.loadData().notices;
  }

  static createNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>): Notice {
    const data = this.loadData();
    const nowIso = new Date().toISOString();
    const expiresIso = new Date(Date.now() + 15 * 86400000).toISOString(); // 15 days auto-expire
    const newNotice: Notice = {
      ...notice,
      id: `notice-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      expiresAt: expiresIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.notices.unshift(newNotice);
    this.saveData(data);
    return newNotice;
  }

  static deleteNotice(id: string): boolean {
    const data = this.loadData();
    data.notices = data.notices.filter((n) => n.id !== id);
    this.saveData(data);
    return true;
  }

  // --- SUBMISSIONS ---
  static getSubmissions(): Submission[] {
    return this.loadData().submissions;
  }

  static getSubmissionsByTaskId(taskId: string): Submission[] {
    return this.getSubmissions().filter((s) => s.taskId === taskId);
  }

  static getSubmissionByUserAndTask(userId: string, taskId: string): Submission | undefined {
    return this.getSubmissions().find((s) => s.userId === userId && s.taskId === taskId);
  }

  static saveSubmission(sub: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Submission {
    const data = this.loadData();
    const nowIso = new Date().toISOString();

    if (sub.id) {
      const idx = data.submissions.findIndex((s) => s.id === sub.id);
      if (idx !== -1) {
        data.submissions[idx] = {
          ...data.submissions[idx],
          ...sub,
          updatedAt: nowIso,
        };
        this.saveData(data);
        return data.submissions[idx];
      }
    }

    // Check if user already submitted for this task
    const existingIdx = data.submissions.findIndex((s) => s.userId === sub.userId && s.taskId === sub.taskId);
    if (existingIdx !== -1) {
      data.submissions[existingIdx] = {
        ...data.submissions[existingIdx],
        ...sub,
        updatedAt: nowIso,
      };
      this.saveData(data);
      return data.submissions[existingIdx];
    }

    const newSub: Submission = {
      ...sub,
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.submissions.push(newSub);
    this.saveData(data);
    return newSub;
  }

  static deleteSubmission(id: string): boolean {
    const data = this.loadData();
    data.submissions = data.submissions.filter((s) => s.id !== id);
    this.saveData(data);
    return true;
  }

  // --- DOCUMENTS ---
  static getDocuments(): DocumentItem[] {
    return this.loadData().documents;
  }

  static createDocument(doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>): DocumentItem {
    const data = this.loadData();
    const nowIso = new Date().toISOString();
    const newDoc: DocumentItem = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.documents.unshift(newDoc);
    this.saveData(data);
    return newDoc;
  }

  static updateDocument(id: string, updates: Partial<DocumentItem>): DocumentItem | null {
    const data = this.loadData();
    const idx = data.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;

    data.documents[idx] = {
      ...data.documents[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.documents[idx];
  }

  static deleteDocument(id: string): boolean {
    const data = this.loadData();
    data.documents = data.documents.filter((d) => d.id !== id);
    this.saveData(data);
    return true;
  }

  // --- WEBSITES ---
  static getWebsites(): WebsiteDirectory[] {
    return this.loadData().websites.sort((a, b) => a.order - b.order);
  }

  static createWebsite(site: Omit<WebsiteDirectory, 'id' | 'order' | 'createdAt' | 'updatedAt'> & { order?: number }): WebsiteDirectory {
    const data = this.loadData();
    const nowIso = new Date().toISOString();
    const newSite: WebsiteDirectory = {
      ...site,
      id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      order: site.order !== undefined ? site.order : data.websites.length,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    data.websites.push(newSite);
    this.saveData(data);
    return newSite;
  }

  static updateWebsite(id: string, updates: Partial<WebsiteDirectory>): WebsiteDirectory | null {
    const data = this.loadData();
    const idx = data.websites.findIndex((w) => w.id === id);
    if (idx === -1) return null;

    data.websites[idx] = {
      ...data.websites[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.websites[idx];
  }

  static deleteWebsite(id: string): boolean {
    const data = this.loadData();
    data.websites = data.websites.filter((w) => w.id !== id);
    this.saveData(data);
    return true;
  }

  static reorderWebsites(orderedIds: string[]): WebsiteDirectory[] {
    const data = this.loadData();
    orderedIds.forEach((id, index) => {
      const site = data.websites.find((w) => w.id === id);
      if (site) {
        site.order = index;
        site.updatedAt = new Date().toISOString();
      }
    });
    this.saveData(data);
    return data.websites.sort((a, b) => a.order - b.order);
  }

  // --- SETTINGS ---
  static getSettings(): SchoolSettings {
    return this.loadData().settings;
  }

  static updateSettings(updates: Partial<SchoolSettings>): SchoolSettings {
    const data = this.loadData();
    data.settings = {
      ...data.settings,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.googleAppsScriptUrl) {
      GoogleDriveService.setGasUrl(updates.googleAppsScriptUrl);
    }
    if (updates.googleSheetId !== undefined) {
      GoogleDriveService.setSheetId(updates.googleSheetId);
    }
    this.saveData(data);
    return data.settings;
  }

  static saveSettings(updates: Partial<SchoolSettings>): SchoolSettings {
    return this.updateSettings(updates);
  }

  // --- CONVENIENCE HELPERS ---
  static saveTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Task {
    if (task.id) {
      const updated = this.updateTask(task.id, task);
      if (updated) return updated;
    }
    return this.createTask(task);
  }

  static saveNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>): Notice {
    return this.createNotice(notice);
  }

  static saveDocument(doc: Omit<DocumentItem, 'id' | 'createdAt' | 'updatedAt'>): DocumentItem {
    return this.createDocument(doc);
  }

  static saveWebsite(site: Omit<WebsiteDirectory, 'id' | 'order' | 'createdAt' | 'updatedAt'> & { order?: number }): WebsiteDirectory {
    return this.createWebsite(site);
  }

  static saveAllWebsites(websites: WebsiteDirectory[]): void {
    const data = this.loadData();
    data.websites = websites;
    this.saveData(data);
  }

  static updateSubmissionStatus(
    submissionId: string,
    status: 'submitted' | 'approved' | 'revision',
    remarks?: string
  ): Submission | null {
    const data = this.loadData();
    const idx = data.submissions.findIndex((s) => s.id === submissionId);
    if (idx === -1) return null;

    data.submissions[idx] = {
      ...data.submissions[idx],
      status,
      remarks: remarks !== undefined ? remarks : data.submissions[idx].remarks,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.submissions[idx];
  }

  static updateUserStatus(userId: string, status: 'active' | 'pending' | 'rejected'): User | null {
    return this.updateUser(userId, { status });
  }
}
