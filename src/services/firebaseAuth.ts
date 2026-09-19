import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Submission, Task } from '../types';

// Initialize Firebase once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Workspace Scopes as configured
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.setCustomParameters({ prompt: 'select_account' });

// Flag to track sign in state
let isSigningIn = false;
// Cached access token in memory only
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่สามารถรับสิทธิ์การเข้าถึง Google Workspace ได้');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

/**
 * Export Task Submissions report directly to a new Google Spreadsheet
 */
export async function exportSubmissionsToGoogleSheets(
  task: Task,
  submissions: Submission[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเข้าสู่ระบบด้วย Google ก่อนใช้งานฟีเจอร์นี้');
  }

  // 1. Create a new spreadsheet
  const title = `รายงานการส่งงาน: ${task.title} (${new Date().toLocaleDateString('th-TH')})`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถสร้าง Google Sheets ได้');
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare headers and rows
  const headerRow = [
    'ลำดับ',
    'ชื่อ-นามสกุล ผู้ส่งงาน',
    'หัวข้องานที่ส่ง',
    'วันที่ส่ง (dd/mm/yyyy HH:mm)',
    'สถานะ',
    'จำนวนไฟล์แนบ',
    'ชื่อไฟล์แนบ',
    'หมายเหตุ/ข้อคิดเห็น',
  ];

  const dataRows = submissions.map((sub, idx) => {
    const submittedDate = new Date(sub.submittedAt).toLocaleString('th-TH');
    const fileNames = sub.files.map((f) => f.name).join(', ') || '-';
    const statusText =
      sub.status === 'approved' ? 'อนุมัติแล้ว' : sub.status === 'revision' ? 'แก้ไขใหม่' : 'ส่งแล้ว (รอตรวจ)';

    return [
      idx + 1,
      sub.userName,
      sub.title,
      submittedDate,
      statusText,
      sub.files.length,
      fileNames,
      sub.remarks || '-',
    ];
  });

  const values = [
    [`สรุปรายงานการส่งงาน - ${task.title}`],
    [`กำหนดส่ง: ${task.dueDate} | สร้างเมื่อ: ${new Date().toLocaleDateString('th-TH')}`],
    [],
    headerRow,
    ...dataRows,
  ];

  // 3. Write values to the sheet
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:H${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!updateRes.ok) {
    console.warn('Sheets update values had minor warning, but sheet was created:', await updateRes.text());
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Upload a file directly to user's Google Drive
 */
export async function uploadFileToGoogleDrive(
  file: File,
  folderName = 'Academic_Management_Files'
): Promise<{ fileId: string; webViewLink?: string; name: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('กรุณาเชื่อมต่อ Google Drive ก่อนอัปโหลดไฟล์');
  }

  const metadata = {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    description: `Uploaded from Academic Management System for folder ${folderName}`,
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถอัปโหลดไฟล์ไปยัง Google Drive ได้');
  }

  const data = await res.json();
  return {
    fileId: data.id,
    webViewLink: data.webViewLink,
    name: data.name,
  };
}
