import React, { useState } from 'react';
import { AcademicDocument, DocumentCategory, SubmittedFile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { formatThaiDate } from '../../utils/date';
import { GoogleDriveService, TARGET_DRIVE_FOLDER_ID } from '../../services/googleDriveService';
import {
  FolderArchive,
  FileText,
  FileCheck,
  Plus,
  Search,
  Eye,
  Download,
  Trash2,
  Edit,
  X,
  UploadCloud,
  BookOpen,
  Info,
  Calendar,
  UserCheck,
  HardDrive,
  Loader2
} from 'lucide-react';

interface DocumentCenterProps {
  documents: AcademicDocument[];
  onAddDocument: (doc: Omit<AcademicDocument, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateDocument: (id: string, doc: Partial<AcademicDocument>) => void;
  onDeleteDocument: (id: string) => void;
  onPreviewFile: (file: SubmittedFile) => void;
}

export const DocumentCenter: React.FC<DocumentCenterProps> = ({
  documents,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onPreviewFile,
}) => {
  const { currentUser } = useAuth();
  const { showAlert, showToast } = useAlert();
  const isAdmin = currentUser?.role === 'admin';

  const [activeCategory, setActiveCategory] = useState<DocumentCategory>('sample');
  const [searchQuery, setSearchQuery] = useState('');

  // Add/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<AcademicDocument | null>(null);

  // Detail Info Modal state (ไอคอน "!" เพื่อดูคำอธิบายหรือรายละเอียดต่างๆ)
  const [selectedDocDetail, setSelectedDocDetail] = useState<AcademicDocument | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<DocumentCategory>('sample');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formFile, setFormFile] = useState<SubmittedFile | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = doc.category === activeCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.orderNumber && doc.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.file?.name && doc.file.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const openAddModal = () => {
    setEditingDoc(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory(activeCategory);
    setFormOrderNumber('');
    setFormFile(null);
    setIsModalOpen(true);
  };

  const openEditModal = (doc: AcademicDocument) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormDescription(doc.description);
    setFormCategory(doc.category);
    setFormOrderNumber(doc.orderNumber || '');
    setFormFile(doc.file);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    try {
      // 1. ให้ทุกที่อัปโหลดในเว็ปไซต์ จะไปอยู่ใน Google Drive ID : 1IpsaGJhJqtuYHTLiHmT2kqOe7CBq4as-
      const driveFile = await GoogleDriveService.uploadFileToDrive(file, {
        uploadedBy: currentUser?.fullName || 'Admin',
        category: formCategory === 'official_order' ? 'หนังสือคำสั่ง' : 'เอกสารตัวอย่าง',
      });

      setFormFile(driveFile);

      // 3.1 เมื่ออัปโหลดไฟล์ ชื่อเอกสารก็จะขึ้นอัตโนมัติตามชื่อไฟล์ที่อัปโหลดแต่ยังคงสามารถแก้ไขชื่อเอกสารได้
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setFormTitle(fileNameWithoutExt);
      showToast('บันทึกลง Google Drive สำเร็จ', `จัดเก็บในโฟลเดอร์ ${TARGET_DRIVE_FOLDER_ID}`, 'success');
    } catch (err: any) {
      showToast('เกิดข้อผิดพลาดในการอัปโหลด', err.message, 'error');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const filePayload = formFile || {
      id: `file-default-${Date.now()}`,
      name: `${formTitle.trim()}.pdf`,
      size: 1024 * 350,
      type: 'application/pdf',
      url: '#',
      uploadedAt: new Date().toISOString(),
    };

    if (editingDoc) {
      onUpdateDocument(editingDoc.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        orderNumber: formOrderNumber.trim() || undefined,
        file: filePayload,
      });
      showToast('อัปเดตเอกสารสำเร็จ', undefined, 'success');
    } else {
      onAddDocument({
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        orderNumber: formOrderNumber.trim() || undefined,
        file: filePayload,
        uploadedBy: currentUser?.fullName || 'Admin',
      });
      showToast('เพิ่มเอกสารใหม่สำเร็จ', undefined, 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (docId: string, title: string) => {
    showAlert({
      title: 'ยืนยันการลบเอกสาร?',
      text: `คุณต้องการลบเอกสาร "${title}" หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      onConfirm: () => {
        onDeleteDocument(docId);
        showToast('ลบเอกสารเรียบร้อยแล้ว', undefined, 'info');
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

  return (
    <div id="document-center-page" className="space-y-5">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
              ศูนย์เอกสารวิชาการ (Document Center)
            </h2>
            <p className="text-xs text-slate-400 truncate">
              คลังเอกสารตัวอย่าง แบบฟอร์มราชการ และคำสั่งโรงเรียน
            </p>
          </div>
        </div>

        {/* 3.1 ตรงอัปโหลดเอกสารใหม่ เปลี่ยนเป็นไอคอน "+" */}
        {isAdmin && (
          <button
            id="btn-admin-add-doc"
            type="button"
            onClick={openAddModal}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 btn-glow shrink-0"
            title="อัปโหลดเอกสารใหม่ (+)"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Categories Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-200/70 rounded-2xl w-fit">
          <button
            id="tab-doc-sample"
            type="button"
            onClick={() => setActiveCategory('sample')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'sample'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. เอกสารตัวอย่าง (Sample Documents)</span>
          </button>

          <button
            id="tab-doc-official"
            type="button"
            onClick={() => setActiveCategory('official_order')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'official_order'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>2. หนังสือคำสั่ง (Official Orders)</span>
          </button>
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อไฟล์ หรือคำสั่ง..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
          />
        </div>
      </div>

      {/* 3.2 ตรงแสดงชื่อไฟล์ ให้แสดงเป็นรายการขนาดเล็กเพื่อไม่ให้เปลืองพื้นที่
          แสดงแค่: ชื่อไฟล์, ไอคอนตา, ไอคอนดาวน์โหลด, ไอคอนแก้ไข, ไอคอนลบ
          และมีไอคอน "!" เพื่อดูคำอธิบายหรือรายละเอียดต่างๆ */}
      <div className="space-y-2">
        {filteredDocs.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-10 h-10 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-700">ไม่มีเอกสารในหมวดหมู่นี้</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdmin
                ? 'คลิกปุ่ม "+" เพื่อเริ่มอัปโหลดเอกสารวิชาการ'
                : 'ยังไม่มีเอกสารที่เผยแพร่ในหมวดหมู่นี้'}
            </p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            // 3.2 ในรายการต้องแสดงชื่อเอกสารเป็นหลัก ไม่ใช่ชื่อไฟล์
            const displayName = doc.title;

            return (
              <div
                key={doc.id}
                id={`doc-row-${doc.id}`}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-purple-300 transition-all px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                {/* Left: Icon & Document Title (แสดงชื่อเอกสารเป็นหลัก) */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1 flex items-center gap-2">
                    <span className="font-semibold text-slate-800 truncate" title={displayName}>
                      {displayName}
                    </span>
                    {doc.orderNumber && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0 hidden sm:inline-block">
                        {doc.orderNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions (ไอคอน !, ตา, ดาวน์โหลด, แก้ไข, ลบ) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* ไอคอน "!" เพื่อดูคำอธิบายหรือรายละเอียดต่างๆ */}
                  <button
                    type="button"
                    onClick={() => setSelectedDocDetail(doc)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                    title="ดูคำอธิบายและรายละเอียด (!)"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  {/* ไอคอนตา - ดูตัวอย่าง */}
                  <button
                    type="button"
                    onClick={() => onPreviewFile(doc.file)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                    title="ดูตัวอย่างเอกสาร"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* ไอคอนดาวน์โหลด */}
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(doc.file)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="ดาวน์โหลดเอกสาร"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Admin Actions: แก้ไข & ลบ */}
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="แก้ไขเอกสาร"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="ลบเอกสาร"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info Modal: ดูคำอธิบายหรือรายละเอียดต่างๆ จากไอคอน "!" */}
      {selectedDocDetail && (
        <div
          id="doc-detail-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedDocDetail(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-300" />
                <h3 className="text-sm sm:text-base font-bold">รายละเอียดเอกสารวิชาการ</h3>
              </div>
              <button
                onClick={() => setSelectedDocDetail(null)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                  ชื่อเอกสาร
                </span>
                <p className="font-bold text-sm text-slate-800">{selectedDocDetail.title}</p>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                  ชื่อไฟล์จัดเก็บ
                </span>
                <p className="text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-mono text-[11px] truncate">
                  {selectedDocDetail.file?.name || selectedDocDetail.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                    หมวดหมู่
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                    {selectedDocDetail.category === 'official_order' ? 'หนังสือคำสั่ง' : 'เอกสารตัวอย่าง'}
                  </span>
                </div>

                {selectedDocDetail.orderNumber && (
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                      เลขที่คำสั่ง
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                      {selectedDocDetail.orderNumber}
                    </span>
                  </div>
                )}
              </div>

              {selectedDocDetail.description && (
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">
                    คำอธิบาย / รายละเอียด
                  </span>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {selectedDocDetail.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>บันทึกโดย: {selectedDocDetail.uploadedBy || 'Admin'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{formatThaiDate(selectedDocDetail.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Document Modal */}
      {isModalOpen && (
        <div
          id="doc-form-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingDoc ? 'แก้ไขข้อมูลเอกสาร' : 'อัปโหลดเอกสารวิชาการใหม่'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveDocument} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  ชื่อเอกสาร *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น แผนการจัดการเรียนรู้บูรณาการตัวอย่าง"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    หมวดหมู่
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as DocumentCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-purple-600"
                  >
                    <option value="sample">เอกสารตัวอย่าง (Sample)</option>
                    <option value="official_order">หนังสือคำสั่ง (Official Order)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    เลขที่คำสั่ง (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น 123/2569"
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-purple-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  คำอธิบายเอกสาร
                </label>
                <textarea
                  rows={2}
                  placeholder="ระบุวัตถุประสงค์ หรือแนวทางการนำไปใช้งาน..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              {/* File Attachment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    ไฟล์เอกสาร (PDF, Word, Excel)
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    <HardDrive className="w-3 h-3 text-purple-600" />
                    จัดเก็บใน Drive: {TARGET_DRIVE_FOLDER_ID.substring(0, 10)}...
                  </span>
                </div>
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center bg-slate-50 relative hover:border-purple-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={isUploadingFile}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center pointer-events-none">
                    {isUploadingFile ? (
                      <Loader2 className="w-6 h-6 text-purple-600 mb-1 animate-spin" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-purple-600 mb-1" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">
                      {isUploadingFile
                        ? 'กำลังอัปโหลดไปยัง Google Drive...'
                        : formFile
                        ? formFile.name
                        : 'คลิกเพื่อเลือกไฟล์เอกสาร'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formFile ? `${(formFile.size / 1024).toFixed(1)} KB • เชื่อมโยง Google Drive สำเร็จ` : 'ไฟล์จะถูกจัดเก็บเข้าสู่ Google Drive อัตโนมัติ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow cursor-pointer transition-all"
                >
                  บันทึกเอกสาร
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
