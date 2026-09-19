import React from 'react';
import { SubmittedFile } from '../../types';
import { GoogleDriveService, TARGET_DRIVE_FOLDER_ID } from '../../services/googleDriveService';
import {
  X,
  Download,
  FileText,
  ExternalLink,
  HardDrive,
  Eye,
  CheckCircle2
} from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: SubmittedFile | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  if (!isOpen || !file) return null;

  const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

  // Extract Drive File ID if present
  let cleanDriveId: string | null = null;
  if (file.driveFileId && !file.driveFileId.startsWith('1Ipsa_')) {
    cleanDriveId = file.driveFileId;
  } else if (file.url && file.url.includes('drive.google.com/file/d/')) {
    const match = file.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      cleanDriveId = match[1];
    }
  }

  const drivePreviewUrl = cleanDriveId
    ? `https://drive.google.com/file/d/${cleanDriveId}/preview`
    : file.url;

  const driveViewUrl = cleanDriveId
    ? `https://drive.google.com/file/d/${cleanDriveId}/view?usp=sharing`
    : (file.url.startsWith('http') ? file.url : undefined);

  const downloadUrl = GoogleDriveService.getDownloadUrl(file);

  const handleDownload = () => {
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
      // Local fallback blob download
      const blob = new Blob([`เนื้อหาเอกสารวิชาการ: ${file.name}`], {
        type: file.type || 'text/plain;charset=utf-8',
      });
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
      id="file-preview-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="file-preview-card"
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold truncate leading-tight">
                  {file.name}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <HardDrive className="w-3 h-3" />
                  Google Drive (1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ขนาด: {(file.size / 1024).toFixed(1)} KB • วันที่อัปโหลด:{' '}
                {new Date(file.uploadedAt).toLocaleString('th-TH')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {driveViewUrl && (
              <a
                href={driveViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs transition-colors"
                title="เปิดดูใน Google Drive แท็บใหม่"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>เปิดใน Drive</span>
              </a>
            )}

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              title="ดึงไฟล์และดาวน์โหลดจาก Google Drive ทันที"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลดจาก Drive</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 p-3 sm:p-5 overflow-y-auto flex items-center justify-center min-h-[460px]">
          {/* If real Google Drive File ID is present, render embedded preview */}
          {cleanDriveId ? (
            <div className="w-full h-full min-h-[480px] flex flex-col bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden">
              <iframe
                src={`https://drive.google.com/file/d/${cleanDriveId}/preview`}
                className="w-full h-full min-h-[480px] border-0"
                title={file.name}
                allow="autoplay"
              />
            </div>
          ) : isImage ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg border border-white"
            />
          ) : isPdf ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">{file.name}</h4>
              <p className="text-xs text-slate-500 mb-4 max-w-md">
                เอกสารวิชาการ PDF บันทึกและซิงค์ใน Google Drive โฟลเดอร์: {TARGET_DRIVE_FOLDER_ID}
              </p>
              <div className="flex flex-wrap gap-2.5 justify-center">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>ดึงไฟล์ดาวน์โหลดจาก Google Drive</span>
                </button>
                {file.url && file.url.startsWith('http') && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>เปิดเอกสารเต็มจอ</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-200">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800 mb-1">{file.name}</h4>
              <p className="text-xs text-slate-500 mb-4 max-w-md">
                ไฟล์เอกสารสำนักงาน (Word, Excel, PowerPoint หรือ ZIP) ใน Google Drive ID: {TARGET_DRIVE_FOLDER_ID}
              </p>
              <button
                onClick={handleDownload}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>ดึงไฟล์และดาวน์โหลดทันที</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>เชื่อมโยงระบบจัดเก็บ Google Drive โฟลเดอร์: {TARGET_DRIVE_FOLDER_ID}</span>
          </div>
          <span className="text-slate-400">รองรับการเปิดดูและดาวน์โหลดไฟล์โดยตรง</span>
        </div>
      </div>
    </div>
  );
};
