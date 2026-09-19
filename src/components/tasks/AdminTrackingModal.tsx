import React from 'react';
import { Task, Submission, SubmittedFile, User } from '../../types';
import { useAlert } from '../../context/AlertContext';
import { GoogleDriveService } from '../../services/googleDriveService';
import {
  Users,
  X,
  AlertCircle,
  Eye,
  Download,
  Trash2
} from 'lucide-react';

interface AdminTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  submissions: Submission[];
  allUsers: User[];
  onDeleteSubmission: (submissionId: string) => void;
  onUpdateSubmissionStatus?: (submissionId: string, status: 'approved' | 'revision', remarks?: string) => void;
  onPreviewFile: (file: SubmittedFile) => void;
}

export const AdminTrackingModal: React.FC<AdminTrackingModalProps> = ({
  isOpen,
  onClose,
  task,
  submissions,
  allUsers,
  onDeleteSubmission,
  onPreviewFile,
}) => {
  const { showAlert, showToast } = useAlert();

  if (!isOpen || !task) return null;

  const taskSubmissions = submissions.filter((s) => s.taskId === task.id);
  const activeTeachers = allUsers.filter((u) => u.role === 'member' && u.status === 'active');

  const handleDeleteSub = (subId: string, userName: string) => {
    showAlert({
      title: 'ยืนยันการลบข้อมูลการส่งงาน?',
      text: `คุณต้องการลบข้อมูลการส่งงานของ "${userName}" หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      onConfirm: () => {
        onDeleteSubmission(subId);
        showToast('ลบรายการส่งงานเรียบร้อย', undefined, 'info');
      },
    });
  };

  const handleDownloadFile = (file: SubmittedFile) => {
    const downloadUrl = GoogleDriveService.getDownloadUrl(file);
    if (downloadUrl && downloadUrl !== '#') {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.name;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Dummy download content for: ${file.name}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div
      id="admin-tracking-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="admin-tracking-card"
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - หัวข้องานที่มอบหมายแสดงขนาดใหญ่ชัดเจน */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-900 text-white border-b border-purple-600/30">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0 mt-0.5">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
                    ติดตามรายชื่อส่งงาน
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400 text-slate-950 shadow-xs">
                    ส่งแล้ว {taskSubmissions.length} / {activeTeachers.length} คน
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/25 text-purple-200 border border-white/10">
                    ครบกำหนด: {task.dueDate}
                  </span>
                </div>

                {/* หัวข้องานที่มอบหมาย ขนาดใหญ่ เด่นชัดเจน */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-snug drop-shadow-xs break-words">
                  {task.title}
                </h2>

                {task.description && (
                  <p className="text-xs text-purple-200/90 line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-purple-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer shrink-0"
              title="ปิดหน้าต่าง"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content Body: 6.2 ปรับให้มันอยู่บรรทัดเดียว แสดงแค่ :ชื่อเรื่อง,ไอคอนตา,ไอคอนดาวน์โหลด,ไอคอนลบ */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2 flex-1 bg-slate-50/50">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
            <span>รายชื่อครู</span>
            <span>ชื่อเรื่อง & การจัดการ</span>
          </div>

          {activeTeachers.map((teacher) => {
            const submission = taskSubmissions.find((s) => s.userId === teacher.id);
            const hasSubmitted = Boolean(submission);

            return (
              <div
                key={teacher.id}
                className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  hasSubmitted
                    ? 'bg-white border-slate-200/90 shadow-2xs hover:border-purple-300'
                    : 'bg-rose-50/60 border-rose-200/80 text-rose-700'
                }`}
              >
                {/* Teacher Info */}
                <div className="flex items-center gap-2.5 min-w-[160px] sm:min-w-[200px] max-w-[240px] shrink-0">
                  <img
                    src={
                      teacher.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                        teacher.username
                      )}`
                    }
                    alt="Avatar"
                    className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{teacher.fullName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{teacher.department || 'ครูผู้สอน'}</p>
                  </div>
                </div>

                {/* 6.2 อยู่บรรทัดเดียว: ชื่อเรื่อง, ไอคอนตา, ไอคอนดาวน์โหลด, ไอคอนลบ */}
                {hasSubmitted && submission ? (
                  <div className="flex items-center justify-between gap-2.5 flex-1 min-w-0">
                    {/* ชื่อเรื่อง */}
                    <div className="min-w-0 flex-1">
                      <span
                        className="font-semibold text-slate-700 truncate block hover:text-purple-700 transition-colors"
                        title={submission.title || (submission.files[0]?.name ?? 'ไม่มีชื่อเรื่อง')}
                      >
                        {submission.title || (submission.files[0]?.name ?? 'ไฟล์ส่งงาน')}
                      </span>
                    </div>

                    {/* ไอคอนตา, ไอคอนดาวน์โหลด, ไอคอนลบ */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* ไอคอนตา (Eye) */}
                      {submission.files.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => onPreviewFile(submission.files[0])}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title={`ดูตัวอย่างไฟล์: ${submission.files[0].name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="p-1.5 rounded-lg text-slate-300 opacity-40 cursor-not-allowed"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {/* ไอคอนดาวน์โหลด (Download) */}
                      {submission.files.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(submission.files[0])}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title={`ดาวน์โหลด: ${submission.files[0].name}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="p-1.5 rounded-lg text-slate-300 opacity-40 cursor-not-allowed"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}

                      {/* ไอคอนลบ (Trash2) */}
                      <button
                        type="button"
                        onClick={() => handleDeleteSub(submission.id, teacher.fullName)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="ลบรายการส่งนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end flex-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      ยังไม่ส่ง
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
