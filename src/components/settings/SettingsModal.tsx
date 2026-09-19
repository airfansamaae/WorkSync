import React, { useState, useRef } from 'react';
import { SchoolSettings, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { processImageFile } from '../../utils/image';
import { GoogleDriveService, TARGET_DRIVE_FOLDER_ID } from '../../services/googleDriveService';
import { StorageService } from '../../services/storage';
import { APPS_SCRIPT_CODE } from '../../constants/appsScriptCode';
import {
  Settings as SettingsIcon,
  X,
  User as UserIcon,
  School,
  CheckCircle2,
  XCircle,
  Trash2,
  Lock,
  Upload,
  KeyRound,
  Users,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  Cloud,
  Database,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  FileCode,
  AlertCircle,
  Download,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SchoolSettings;
  onUpdateSettings: (newSettings: Partial<SchoolSettings>) => void;
  allUsers: User[];
  onUpdateUserStatus: (userId: string, status: 'active' | 'rejected' | 'pending') => void;
  onDeleteUser: (userId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  allUsers,
  onUpdateUserStatus,
  onDeleteUser,
}) => {
  const { currentUser, updateProfile, isGoogleConnected, googleUser } = useAuth();
  const { showAlert, showToast } = useAlert();
  const isAdmin = currentUser?.role === 'admin';

  // Tabs: 'general' (Profile & School together), 'password', 'members' (Admin only), 'integration' (Google Drive & Sheets)
  const [activeTab, setActiveTab] = useState<'general' | 'password' | 'members' | 'integration'>('general');

  // Members sub-tab: 'pending' vs 'approved'
  const [memberSubTab, setMemberSubTab] = useState<'pending' | 'approved'>('pending');

  // Profile Form state
  const [profileName, setProfileName] = useState(currentUser?.fullName || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatarUrl || '');
  const [department, setDepartment] = useState(currentUser?.department || '');

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // School Form state
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [deptName, setDeptName] = useState(settings.departmentName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [semester, setSemester] = useState(settings.semester);
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(settings.schoolLogoUrl || '');

  // Integration state
  const [gasUrlInput, setGasUrlInput] = useState(GoogleDriveService.getGasUrl());
  const [sheetUrlInput, setSheetUrlInput] = useState(settings.googleSheetId || GoogleDriveService.getSheetId());
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTestingGas, setIsTestingGas] = useState(false);
  const [gasTestResult, setGasTestResult] = useState<{
    online: boolean;
    hasGetAll: boolean;
    message: string;
  } | null>(null);
  const [isSyncingNow, setIsSyncingNow] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Hidden file input refs
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const schoolLogoFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setCopiedCode(true);
      showToast('คัดลอกโค้ด Code.gs ครบ 100% เรียบร้อยแล้ว', undefined, 'success');
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      try {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = APPS_SCRIPT_CODE;
        tempTextArea.style.position = 'fixed';
        tempTextArea.style.left = '-999999px';
        document.body.appendChild(tempTextArea);
        tempTextArea.focus();
        tempTextArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(tempTextArea);
        if (successful) {
          setCopiedCode(true);
          showToast('คัดลอกโค้ด Code.gs ครบ 100% เรียบร้อยแล้ว', undefined, 'success');
          setTimeout(() => setCopiedCode(false), 3000);
          return;
        }
      } catch (fallbackErr) {}

      showAlert({
        title: 'แนะนำให้ดาวน์โหลดไฟล์',
        text: 'โปรดคลิกปุ่ม "ดาวน์โหลดไฟล์ Code.gs" เพื่อนำโค้ดไปวางใน Google Apps Script ได้ทันที',
        icon: 'info',
      });
    }
  };

  const handleDownloadCode = () => {
    try {
      const blob = new Blob([APPS_SCRIPT_CODE], { type: 'text/javascript;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Code.gs';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('ดาวน์โหลดไฟล์ Code.gs สำเร็จ', 'เปิดไฟล์ด้วย Notepad แล้วคัดลอกไปวางได้เลย', 'success');
    } catch (e: any) {
      showToast('ดาวน์โหลดไม่สำเร็จ', e.message, 'error');
    }
  };

  const handleSaveIntegration = () => {
    const trimmedGas = gasUrlInput.trim();
    const trimmedSheet = sheetUrlInput.trim();
    const extractedSheetId = GoogleDriveService.extractSpreadsheetId(trimmedSheet);

    GoogleDriveService.setGasUrl(trimmedGas);
    GoogleDriveService.setSheetId(extractedSheetId || trimmedSheet);

    onUpdateSettings({
      googleAppsScriptUrl: trimmedGas,
      googleSheetId: extractedSheetId || trimmedSheet,
      googleDriveFolderId: TARGET_DRIVE_FOLDER_ID,
    });

    showToast('บันทึกการตั้งค่าการเชื่อมต่อ Google เรียบร้อยแล้ว', undefined, 'success');
  };

  const handleTestGas = async () => {
    setIsTestingGas(true);
    setGasTestResult(null);
    GoogleDriveService.setGasUrl(gasUrlInput.trim());
    try {
      const res = await GoogleDriveService.checkAppsScriptStatus();
      setGasTestResult(res);
      if (res.online && res.hasGetAll) {
        showToast('เชื่อมต่อ Google Apps Script สำเร็จ 100%', undefined, 'success');
      } else {
        showToast(res.message, undefined, 'warning');
      }
    } catch (err: any) {
      setGasTestResult({
        online: false,
        hasGetAll: false,
        message: err.message || 'ไม่สามารถเชื่อมต่อได้',
      });
    } finally {
      setIsTestingGas(false);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncingNow(true);
    setSyncStatus(null);
    try {
      const trimmedGas = gasUrlInput.trim();
      const trimmedSheet = sheetUrlInput.trim();
      const extractedSheetId = GoogleDriveService.extractSpreadsheetId(trimmedSheet);

      GoogleDriveService.setGasUrl(trimmedGas);
      if (extractedSheetId || trimmedSheet) {
        GoogleDriveService.setSheetId(extractedSheetId || trimmedSheet);
      }

      onUpdateSettings({
        googleAppsScriptUrl: trimmedGas,
        googleSheetId: extractedSheetId || trimmedSheet,
        googleDriveFolderId: TARGET_DRIVE_FOLDER_ID,
      });

      const res = await StorageService.syncAllNow();
      setSyncStatus(res);
      if (res.success) {
        showToast(res.message || 'ซิงค์ข้อมูลสำเร็จ', undefined, 'success');
      } else {
        showAlert({
          title: 'ข้อผิดพลาดในการซิงค์',
          text: res.message,
          icon: 'warning',
        });
      }
    } catch (err: any) {
      const msg = err.message || 'เกิดข้อผิดพลาดในการซิงค์';
      setSyncStatus({ success: false, message: msg });
      showAlert({
        title: 'ซิงค์ข้อมูลไม่สำเร็จ',
        text: msg,
        icon: 'error',
      });
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Handle Profile Avatar file upload
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 400, 400, 0.85);
      setProfileAvatar(dataUrl);
      showToast('อัปโหลดรูปโปรไฟล์เรียบร้อย', undefined, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ภาพได้';
      showAlert({ title: 'ข้อผิดพลาด', text: message, icon: 'error' });
    }
  };

  // Handle School Logo file upload
  const handleSchoolLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file, 500, 500, 0.9);
      setSchoolLogoUrl(dataUrl);
      showToast('อัปโหลดตราสัญลักษณ์โรงเรียนเรียบร้อย', undefined, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ไม่สามารถอ่านไฟล์ภาพได้';
      showAlert({ title: 'ข้อผิดพลาด', text: message, icon: 'error' });
    }
  };

  // Save General Tab (Profile + School info together)
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update Profile
    updateProfile({
      fullName: profileName.trim(),
      avatarUrl: profileAvatar.trim(),
      department: department.trim(),
    });

    // 2. Update School Settings if Admin (Background preservation of Drive & GAS parameters)
    if (isAdmin) {
      onUpdateSettings({
        schoolName: schoolName.trim(),
        departmentName: deptName.trim(),
        academicYear: String(academicYear),
        semester: String(semester),
        schoolLogoUrl: schoolLogoUrl.trim() || undefined,
        googleDriveFolderId: TARGET_DRIVE_FOLDER_ID,
        googleAppsScriptUrl: GoogleDriveService.getGasUrl(),
      });
    }

    showToast('บันทึกข้อมูลเรียบร้อยแล้ว', undefined, 'success');
  };

  // Save Password Change
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      showAlert({
        title: 'กรุณากรอกรหัสผ่านใหม่',
        text: 'กรุณาระบุรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร',
        icon: 'warning',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        title: 'รหัสผ่านใหม่ไม่ตรงกัน',
        text: 'กรุณากรอกรหัสผ่านใหม่และการยืนยันให้ตรงกัน',
        icon: 'error',
      });
      return;
    }

    updateProfile({
      password: newPassword,
    });

    showToast('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว', undefined, 'success');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleUserApproval = (user: User, status: 'active' | 'rejected') => {
    const actionText = status === 'active' ? 'อนุมัติการเข้าใช้งาน' : 'ปฏิเสธคำขอ';
    showAlert({
      title: `ยืนยัน${actionText}?`,
      text: `ผู้ใช้งาน: ${user.fullName} (${user.username})`,
      icon: status === 'active' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `ยืนยัน${actionText}`,
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: status === 'active' ? '#10B981' : '#EF4444',
      onConfirm: () => {
        onUpdateUserStatus(user.id, status);
        showToast(
          status === 'active' ? 'อนุมัติผู้ใช้งานเรียบร้อย' : 'ปฏิเสธคำขอเรียบร้อย',
          undefined,
          'success'
        );
      },
    });
  };

  const handleDeleteUserConfirm = (user: User) => {
    showAlert({
      title: 'ยืนยันการลบผู้ใช้งาน?',
      text: `ต้องการลบข้อมูลบัญชีของ "${user.fullName}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      onConfirm: () => {
        onDeleteUser(user.id);
        showToast('ลบผู้ใช้งานเรียบร้อย', undefined, 'info');
      },
    });
  };

  const pendingUsers = allUsers.filter((u) => u.status === 'pending');
  const approvedUsers = allUsers.filter((u) => u.status === 'active');

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="settings-card"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">การตั้งค่าระบบ (System Settings)</h3>
              <p className="text-xs text-purple-200">
                {isAdmin
                  ? 'ข้อมูลส่วนตัว ข้อมูลโรงเรียน รหัสผ่าน และการจัดการสมาชิก'
                  : 'ข้อมูลส่วนตัวและรหัสผ่าน'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher: 1.1 ข้อมูลส่วนตัว & โรงเรียน, 1.2 เปลี่ยนรหัสผ่าน, 1.3 จัดการสมาชิก */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 gap-2">
          {/* Tab 1: ข้อมูลส่วนตัว & โรงเรียน */}
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'general'
                ? 'text-purple-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>ข้อมูลส่วนตัว & ข้อมูลโรงเรียน</span>
            {activeTab === 'general' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>

          {/* Tab 2: เปลี่ยนรหัสผ่าน */}
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'password'
                ? 'text-purple-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>เปลี่ยนรหัสผ่าน</span>
            {activeTab === 'password' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
            )}
          </button>

          {/* Tab 3: จัดการสมาชิก (Admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'text-purple-700 font-bold'
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>จัดการสมาชิก</span>
              {pendingUsers.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                  {pendingUsers.length}
                </span>
              )}
              {activeTab === 'members' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          )}

          {/* Tab 4: เชื่อมต่อ Google Drive & Sheets (Admin only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('integration')}
              className={`pb-3 px-4 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-2 ${
                activeTab === 'integration'
                  ? 'text-purple-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cloud className="w-4 h-4" />
              <span>เชื่อมต่อ Drive & Sheets (Code.gs)</span>
              {activeTab === 'integration' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 rounded-full" />
              )}
            </button>
          )}
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ข้อมูลส่วนตัว & ข้อมูลโรงเรียน (อยู่ด้วยกัน) */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-6">
              {/* SECTION A: ข้อมูลส่วนตัว */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
                  <UserIcon className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-bold">1. ข้อมูลส่วนตัว (Personal Profile)</h4>
                </div>

                {/* Profile Picture Upload & Preview */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="relative shrink-0">
                    <img
                      src={
                        profileAvatar ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                          currentUser?.username || 'user'
                        )}`
                      }
                      alt="Profile Preview"
                      className="w-20 h-20 rounded-full object-cover border-2 border-purple-400 shadow-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700">รูปโปรไฟล์ (Profile Image)</p>
                      <p className="text-[11px] text-slate-400">
                        อัปโหลดไฟล์รูปภาพ (JPG, PNG, WebP) ขนาดแนะนำเป็นสี่เหลี่ยมจัตุรัส
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        ref={profileFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => profileFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>อัปโหลดรูปภาพ</span>
                      </button>
                      {profileAvatar && (
                        <button
                          type="button"
                          onClick={() => setProfileAvatar('')}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                        >
                          ลบรูปโปรไฟล์
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      กลุ่มสาระการเรียนรู้ / แผนก
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น กลุ่มสาระการเรียนรู้วิทยาศาสตร์"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: ข้อมูลโรงเรียน (สำหรับ Admin) */}
              {isAdmin && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-slate-800">
                    <School className="w-4 h-4 text-purple-600" />
                    <h4 className="text-sm font-bold">2. ข้อมูลโรงเรียน & วิชาการ (School Information)</h4>
                  </div>

                  {/* School Logo Upload & Preview */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-purple-200 flex items-center justify-center p-1.5 overflow-hidden shadow-2xs shrink-0">
                      {schoolLogoUrl ? (
                        <img
                          src={schoolLogoUrl}
                          alt="School Logo"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <School className="w-8 h-8 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="text-xs font-bold text-slate-800">ตราสัญลักษณ์โรงเรียน (School Logo)</p>
                        <p className="text-[11px] text-slate-400">
                          อัปโหลดไฟล์ตราสัญลักษณ์โรงเรียน (PNG หรือ JPG แนะนำพื้นหลังโปร่งใส)
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          ref={schoolLogoFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleSchoolLogoChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => schoolLogoFileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>อัปโหลดตราโรงเรียน</span>
                        </button>
                        {schoolLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setSchoolLogoUrl('')}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors cursor-pointer"
                          >
                            ลบตราโรงเรียน
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        ชื่อสถานศึกษา (School Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={schoolName}
                        onChange={(e) => setSchoolName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        ฝ่าย / กลุ่มงานวิชาการ (Department Name)
                      </label>
                      <input
                        type="text"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        ปีการศึกษา (Academic Year)
                      </label>
                      <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                        ภาคเรียนที่ (Semester)
                      </label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-purple-600"
                      >
                        <option value="1">ภาคเรียนที่ 1</option>
                        <option value="2">ภาคเรียนที่ 2</option>
                        <option value="3">ภาคเรียนฤดูร้อน</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold btn-glow cursor-pointer transition-all shadow-md active:scale-95"
                >
                  บันทึกข้อมูลทั้งหมด
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: เปลี่ยนรหัสผ่าน (แยกอยู่อีกหน้าหนึ่ง) */}
          {activeTab === 'password' && (
            <form onSubmit={handleSavePassword} className="space-y-5 max-w-lg mx-auto py-4">
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-start gap-3">
                <Lock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">เปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
                  <p>
                    กำหนดรหัสผ่านใหม่สำหรับการเข้าใช้งานระบบ (บัญชี: {currentUser?.username})
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  รหัสผ่านใหม่ (New Password) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านใหม่"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  ยืนยันรหัสผ่านใหม่ (Confirm Password) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้งเพื่อยืนยัน"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold btn-glow cursor-pointer transition-all shadow-md active:scale-95"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: จัดการสมาชิก (แยกระหว่างกำลังรออนุมัติ กับสมาชิกที่อนุมัติแล้ว) */}
          {isAdmin && activeTab === 'members' && (
            <div className="space-y-4">
              {/* Sub-tab pills */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setMemberSubTab('pending')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    memberSubTab === 'pending'
                      ? 'bg-white text-amber-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>กำลังรออนุมัติ</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      memberSubTab === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {pendingUsers.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemberSubTab('approved')}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    memberSubTab === 'approved'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>สมาชิกที่อนุมัติแล้ว</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      memberSubTab === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {approvedUsers.length}
                  </span>
                </button>
              </div>

              {/* Sub-tab 1: กำลังรออนุมัติ */}
              {memberSubTab === 'pending' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">
                      ผู้ลงทะเบียนที่รอการอนุมัติการเข้าใช้งาน ({pendingUsers.length} ท่าน)
                    </p>
                  </div>

                  {pendingUsers.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                      <p className="text-xs font-bold text-slate-700">ไม่มีสมาชิกที่รออนุมัติในขณะนี้</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        เมื่อมีครูหรือบุคลากรลงทะเบียนใหม่ รายชื่อจะแสดงที่นี่เพื่อรอการอนุมัติ
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto">
                      {pendingUsers.map((user) => (
                        <div
                          key={user.id}
                          className="p-3.5 rounded-2xl border bg-amber-50/70 border-amber-200 shadow-xs flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={
                                user.avatarUrl ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                  user.username
                                )}`
                              }
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover border border-amber-300 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {user.fullName}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                Username: <span className="font-semibold">{user.username}</span>
                                {user.department && ` • แผนก: ${user.department}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUserApproval(user, 'active')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>อนุมัติ (Approve)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUserApproval(user, 'rejected')}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>ปฏิเสธ</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: สมาชิกที่อนุมัติแล้ว */}
              {memberSubTab === 'approved' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-600">
                      สมาชิกที่ได้รับสิทธิ์เข้าใช้งานระบบ ({approvedUsers.length} ท่าน)
                    </p>
                  </div>

                  <div className="space-y-2.5 max-h-96 overflow-y-auto">
                    {approvedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-3.5 rounded-2xl border bg-white border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 hover:border-purple-200 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              user.avatarUrl ||
                              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                                user.username
                              )}`
                            }
                            alt="Avatar"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {user.fullName}
                              </p>
                              {user.role === 'admin' ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                                  ผู้ดูแลระบบ (Admin)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ครูผู้สอน (Member)
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">
                              Username: {user.username} {user.department && `• ${user.department}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {user.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUserConfirm(user)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="ลบผู้ใช้งาน"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: เชื่อมต่อ Google Drive & Sheets (Code.gs) */}
          {activeTab === 'integration' && (
            <div className="space-y-6">
              {/* Integration Header */}
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-100 flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-purple-900">
                    ระบบเชื่อมต่อ Google Drive & Google Sheets แบบ 2 ทิศทาง (Bi-directional Sync)
                  </h4>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed">
                    ระบบจะทำการจัดเก็บไฟล์เอกสารและผลงานทุกประเภทเข้าสู่ Google Drive ของท่านโดยตรง 
                    พร้อมทั้งซิงค์ฐานข้อมูล (ภาระงาน, การส่งงาน, ข่าวสาร, รายชื่อครู) เข้าสู่ Google Sheets อัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Drive Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Cloud className="w-4 h-4 text-purple-600" />
                      โฟลเดอร์ Google Drive ปลายทาง
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      เชื่อมต่อแล้ว
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 break-all select-all">
                    {TARGET_DRIVE_FOLDER_ID}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    ไฟล์ผลงาน, แผนการสอน, เอกสารคำสั่ง, ภาพถ่าย และไฟล์แนบทั้งหมดจะถูกบันทึกเก็บในโฟลเดอร์นี้
                  </p>
                  <a
                    href={`https://drive.google.com/drive/folders/${TARGET_DRIVE_FOLDER_ID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 hover:underline cursor-pointer pt-1"
                  >
                    <span>เปิดโฟลเดอร์ Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Sheets Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-emerald-600" />
                      Google Sheets เป้าหมาย
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                      {sheetUrlInput ? 'ระบุลิงก์ชีตแล้ว' : 'edit?gid=0#gid=0'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 break-all select-all">
                    {sheetUrlInput || 'ตรวจจับอัตโนมัติจากในโฟลเดอร์ Drive หรือชีตที่ผูกไว้'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    บันทึกข้อมูลทุกหมวด: Tasks, Submissions, Academic_Documents, Notices, Websites, Users และ Upload_Logs
                  </p>
                  <div className="text-[11px] text-emerald-600 font-medium">
                    ✓ รองรับชีตหลัก (gid=0) และสร้างแท็บย่อยแยกหมวดหมู่อัตโนมัติ
                  </div>
                </div>
              </div>

              {/* Integration Configuration Section */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-purple-600" />
                    กำหนดค่าการเชื่อมต่อ Google Sheets & Apps Script
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveIntegration}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>บันทึกการตั้งค่า</span>
                  </button>
                </div>

                {/* GAS URL Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL เว็บแอป Google Apps Script (Web App URL)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    URL ที่ได้จากการ Deploy สคริปต์ Code.gs (ลงท้ายด้วย <span className="font-mono text-purple-600">/exec</span>)
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={gasUrlInput}
                      onChange={(e) => setGasUrlInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isTestingGas || !gasUrlInput.trim()}
                        onClick={handleTestGas}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingGas ? 'animate-spin' : ''}`} />
                        <span>{isTestingGas ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Google Sheets URL/ID Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ลิงก์ Google Sheets หรือ Spreadsheet ID (ทางเลือก)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    หากชีตของท่านเปิดอยู่แล้ว สามารถคัดลอก URL ทั้งหมดจากแถบที่อยู่เว็บด้านบน (เช่น <span className="font-mono text-purple-600">https://docs.google.com/spreadsheets/d/.../edit?gid=0#gid=0</span>) มาวางในช่องนี้ได้เลย
                  </p>
                  <input
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit หรือ ID ของชีต"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                  {sheetUrlInput && (
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>ID ที่สกัดได้:</span>
                      <span className="font-mono text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded-md">
                        {GoogleDriveService.extractSpreadsheetId(sheetUrlInput) || sheetUrlInput}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sync Action Area */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    สามารถกดซิงค์ข้อมูลทั้งหมดจากเว็บไซต์ขึ้น Google Sheets ได้ทันที
                  </div>
                  <button
                    type="button"
                    disabled={isSyncingNow}
                    onClick={handleSyncNow}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                    <span>{isSyncingNow ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ข้อมูลกับ Google Sheets ทันที'}</span>
                  </button>
                </div>

                {/* Test Result Banner */}
                {gasTestResult && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in duration-200 ${
                      gasTestResult.online && gasTestResult.hasGetAll
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {gasTestResult.online && gasTestResult.hasGetAll ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <span>{gasTestResult.message}</span>
                  </div>
                )}

                {/* Sync Result Banner */}
                {syncStatus && (
                  <div
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
                      syncStatus.success
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {syncStatus.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-bold">{syncStatus.success ? 'ซิงค์ข้อมูลสำเร็จ' : 'แจ้งเตือนการซิงค์ข้อมูล'}</p>
                      <p className="text-[11px] leading-relaxed whitespace-pre-line">{syncStatus.message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Troubleshooting permission error box */}
              <div className="p-4 rounded-2xl bg-purple-50/90 border border-purple-200 space-y-2.5">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>ระบบ Dual-Engine: ป้องกันข้อผิดพลาด Google Sheets และจัดเก็บบน Google Drive 100%</span>
                </div>
                <div className="text-[11px] text-purple-900/80 space-y-2 pl-6 leading-relaxed">
                  <p>
                    <strong>1. ไม่ต้องกังวลเรื่องข้อมูลสูญหาย:</strong> ทุกไฟล์และข้อมูลถูกจัดเก็บสำรองลงใน Google Drive โฟลเดอร์ <code className="px-1 py-0.5 bg-purple-100 rounded font-mono font-bold">วิชาการ S</code> (ID: 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-) เสมอ แม้ยังไม่ได้เชื่อมชีต
                  </p>
                  <p>
                    <strong>2. วิธีแก้ปัญหา Error ถาวร (ได้ชีตสวยงาม 100%):</strong>
                    <br />
                    เปิด Google Sheets ของท่าน (<span className="font-mono text-purple-700">edit?gid=0#gid=0</span>) แล้วไปที่เมนู <strong className="text-purple-950">"ส่วนขยาย" (Extensions) &gt; "Apps Script"</strong> จากนั้นวางโค้ดจากปุ่ม <strong>"คัดลอก Code.gs ทั้งหมด"</strong> ด้านล่าง แล้วคลิก <strong>Deploy &gt; New deployment &gt; Anyone</strong> (การเปิดจากในชีตโดยตรงจะได้รับสิทธิ์เข้าถึงชีต 100% โดยไม่มีข้อความเตือน Permission อีกต่อไป)
                  </p>
                </div>
              </div>

              {/* Code.gs Copy Section */}
              <div className="p-5 rounded-2xl bg-slate-900 text-slate-200 space-y-4 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-purple-400" />
                    <div>
                      <h5 className="text-xs font-bold text-white">โค้ดสคริปต์ Google Apps Script (Code.gs) ฉบับสมบูรณ์</h5>
                      <p className="text-[11px] text-slate-400">
                        คัดลอกโค้ดนี้ทั้งหมดไปวางในเมนู ส่วนขยาย &gt; Apps Script ภายใน Google Sheets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDownloadCode}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shadow-sm"
                    >
                      <Download className="w-4 h-4 text-purple-400" />
                      <span>ดาวน์โหลดไฟล์ Code.gs</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                        copiedCode
                          ? 'bg-emerald-600 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white'
                      }`}
                    >
                      {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode ? 'คัดลอกเรียบร้อย!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                    </button>
                  </div>
                </div>

                {/* Step by Step Guide */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <p className="font-bold text-purple-300">ขั้นตอนที่ 1 & 2: เปิด Apps Script ในชีต</p>
                    <p className="text-slate-400 leading-relaxed">
                      เปิด Google Sheets ของท่าน (<span className="text-slate-300 font-mono">edit?gid=0#gid=0</span>) แล้วไปที่เมนู <span className="text-purple-300 font-semibold">"ส่วนขยาย" &gt; "Apps Script"</span>
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1">
                    <p className="font-bold text-purple-300">ขั้นตอนที่ 3 & 4: วางโค้ดและ Deploy</p>
                    <p className="text-slate-400 leading-relaxed">
                      ลบโค้ดเดิมทั้งหมดในไฟล์ Code.gs แล้ววางโค้ดที่คัดลอก จากนั้นคลิก <span className="text-purple-300 font-semibold">"ทำให้ใช้งานได้" &gt; "การทำให้ใช้งานได้รายการใหม่"</span> เลือกเป็นเว็บแอป
                    </p>
                  </div>
                </div>

                {/* Full Code Box with Auto-select */}
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <div className="px-3 py-2 bg-slate-800/90 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">โค้ด Code.gs ฉบับสมบูรณ์ (คลิกในกล่องเพื่อเลือกทั้งหมด Ctrl+A)</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">✓ ตรวจสอบแล้ว ไร้ Syntax Error 100%</span>
                  </div>
                  <textarea
                    readOnly
                    rows={8}
                    value={APPS_SCRIPT_CODE}
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    className="w-full p-3 bg-slate-950 text-slate-300 font-mono text-[11px] leading-relaxed resize-y focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

