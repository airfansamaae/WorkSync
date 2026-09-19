import React, { useState, useRef } from 'react';
import { SchoolSettings, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { processImageFile } from '../../utils/image';
import { GoogleDriveService, TARGET_DRIVE_FOLDER_ID } from '../../services/googleDriveService';
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

  // Tabs: 'general' (Profile & School together), 'password' (Separate password change), 'members' (Admin only)
  const [activeTab, setActiveTab] = useState<'general' | 'password' | 'members'>('general');

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

  // Hidden file input refs
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const schoolLogoFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

