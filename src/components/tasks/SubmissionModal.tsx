import React, { useState, useEffect } from 'react';
import { Task, Submission, SubmittedFile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { GoogleDriveService, TARGET_DRIVE_FOLDER_ID } from '../../services/googleDriveService';
import {
  UploadCloud,
  X,
  FileText,
  Eye,
  Download,
  Trash2,
  HardDrive,
  CheckCircle2,
  Send,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  existingSubmission?: Submission;
  onSave: (submissionData: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onPreviewFile: (file: SubmittedFile) => void;
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  task,
  existingSubmission,
  onSave,
  onPreviewFile,
}) => {
  const { currentUser, isGoogleConnected } = useAuth();
  const { showAlert, showToast } = useAlert();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<SubmittedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadToDrive, setUploadToDrive] = useState(false);

  useEffect(() => {
    if (existingSubmission) {
      setTitle(existingSubmission.title);
      setDescription(existingSubmission.description || '');
      setFiles(existingSubmission.files || []);
    } else if (task) {
      setTitle(task.title);
      setDescription('');
      setFiles([]);
    }
  }, [existingSubmission, task, isOpen]);

  if (!isOpen || !task || !currentUser) return null;

  const handleFilesChosen = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    const newFiles: SubmittedFile[] = [];

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        // 1. ให้ทุกที่อัปโหลดในเว็ปไซต์ จะไปอยู่ใน Google Drive ID : 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-
        const driveFile = await GoogleDriveService.uploadFileToDrive(file, {
          uploadedBy: currentUser.fullName,
          category: 'ส่งงานมอบหมาย: ' + (task?.title || ''),
        });
        newFiles.push(driveFile);
      }

      setFiles((prev) => [...prev, ...newFiles]);
      showToast('บันทึกลง Google Drive เรียบร้อย', `โฟลเดอร์ ${TARGET_DRIVE_FOLDER_ID} (${newFiles.length} ไฟล์)`, 'success');
    } catch (e: any) {
      showAlert({
        title: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
        text: e.message || 'โปรดลองใหม่อีกครั้ง',
        icon: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesChosen(e.dataTransfer.files);
  };

  const handleDeleteFile = (fileId: string, fileName: string) => {
    showAlert({
      title: 'ยืนยันการลบไฟล์?',
      text: `คุณต้องการลบไฟล์ "${fileName}" ออกจากการส่งงานนี้หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบไฟล์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      onConfirm: () => {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        showToast('ลบไฟล์เรียบร้อย', undefined, 'info');
      },
    });
  };

  const handleDownloadFile = (file: SubmittedFile) => {
    // ดึงไฟล์จาก Google Drive ทันที
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
      showToast('เริ่มดาวน์โหลดไฟล์จาก Google Drive', file.name, 'info');
    } else {
      const blob = new Blob([`Content of academic file: ${file.name}`], { type: 'text/plain' });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showAlert({
        title: 'กรุณาระบุหัวข้องานที่ส่ง',
        icon: 'warning',
      });
      return;
    }

    if (files.length === 0) {
      showAlert({
        title: 'ยังไม่ได้แนบไฟล์งาน',
        text: 'กรุณาอัปโหลดไฟล์งานอย่างน้อย 1 ไฟล์ก่อนส่งมอบ',
        icon: 'warning',
      });
      return;
    }

    onSave({
      taskId: task.id,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userAvatar: currentUser.avatarUrl,
      title: title.trim(),
      description: description.trim(),
      files,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
    });

    onClose();
  };

  return (
    <div
      id="submission-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="submission-card"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {existingSubmission ? 'แก้ไขการส่งภาระงาน' : 'ส่งภาระงานวิชาการ'}
              </h3>
              <p className="text-xs text-purple-200 truncate max-w-md">
                {task.title} (กำหนดส่ง: {task.dueDate})
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Mandatory Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              หัวข้อรายงาน / ชื่องานที่ส่ง (Mandatory Title) *
            </label>
            <input
              id="input-sub-title"
              type="text"
              required
              placeholder="เช่น แผนการจัดการเรียนรู้รายวิชาภาษาไทย ม.2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-sm transition-all"
            />
          </div>

          {/* Optional Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              คำอธิบายเพิ่มเติม / บันทึกแนบ (Optional Description)
            </label>
            <textarea
              id="input-sub-desc"
              rows={2}
              placeholder="ระบุหมายเหตุ เช่น ประกอบด้วยแผน 10 สัปดาห์ และใบงานกิจกรรม 5 ชุด..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-sm transition-all"
            />
          </div>

          {/* Multi-File Upload Drag & Drop Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                อัปโหลดไฟล์งาน (Multi-file Upload) *
              </label>

              {/* Google Drive upload badge */}
              <span className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                <span>บันทึกลง Google Drive (1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-)</span>
              </span>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-purple-600 bg-purple-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-purple-400 bg-slate-50/50'
              }`}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                onChange={(e) => handleFilesChosen(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                disabled={isUploading}
              />
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 shadow-xs">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {isUploading ? 'กำลังอัปโหลดไฟล์สู่ Google Drive...' : 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ทุกไฟล์จะถูกส่งไปยัง Google Drive Folder ID: {TARGET_DRIVE_FOLDER_ID}
                </p>
              </div>
            </div>
          </div>

          {/* Attached Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600">
                ไฟล์ที่แนบแล้ว ({files.length} ไฟล์)
              </span>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB
                          {file.driveFileId && ' • ซิงค์กับ Google Drive แล้ว'}
                        </p>
                      </div>
                    </div>

                    {/* Actions per file: View (Eye), Download, Delete (Own file) */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onPreviewFile(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="ดูตัวอย่างไฟล์ (View)"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="ดาวน์โหลดไฟล์ (Download)"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="ลบไฟล์นี้ (Delete)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              id="btn-submit-task-form"
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow flex items-center gap-2 cursor-pointer transition-all disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{existingSubmission ? 'บันทึกการแก้ไข' : 'ยืนยันการส่งงาน'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
