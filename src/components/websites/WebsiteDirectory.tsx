import React, { useState } from 'react';
import { RecommendedWebsite } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { processImageFile } from '../../utils/image';
import {
  Globe,
  Plus,
  Info,
  ExternalLink,
  Edit,
  Trash2,
  GripVertical,
  X,
  UploadCloud,
  Image as ImageIcon,
  Check
} from 'lucide-react';

interface WebsiteDirectoryProps {
  websites: RecommendedWebsite[];
  onAddWebsite: (site: Omit<RecommendedWebsite, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateWebsite: (id: string, site: Partial<RecommendedWebsite>) => void;
  onDeleteWebsite: (id: string) => void;
  onReorderWebsites: (reordered: RecommendedWebsite[]) => void;
}

export const WebsiteDirectory: React.FC<WebsiteDirectoryProps> = ({
  websites,
  onAddWebsite,
  onUpdateWebsite,
  onDeleteWebsite,
  onReorderWebsites,
}) => {
  const { currentUser } = useAuth();
  const { showAlert, showToast } = useAlert();
  const isAdmin = currentUser?.role === 'admin';

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<RecommendedWebsite | null>(null);
  const [selectedInfoSite, setSelectedInfoSite] = useState<RecommendedWebsite | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // Drag and drop state for reordering
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const sortedWebsites = [...websites].sort((a, b) => a.order - b.order);

  const openAddModal = () => {
    setEditingSite(null);
    setFormTitle('');
    setFormDescription('');
    // 4. ตรงเพิ่มลิงก์ URL ตรงที่กรอกไม่ต้องแสดง https:// ให้ว่างเลย
    setFormUrl('');
    setFormLogoUrl('');
    setIsFormOpen(true);
  };

  const openEditModal = (site: RecommendedWebsite) => {
    setEditingSite(site);
    setFormTitle(site.title);
    setFormDescription(site.description);
    setFormUrl(site.url);
    setFormLogoUrl(site.logoUrl);
    setIsFormOpen(true);
  };

  const handleLogoFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WebP)', undefined, 'error');
      return;
    }
    try {
      setIsUploadingLogo(true);
      const base64 = await processImageFile(file, 256, 256);
      setFormLogoUrl(base64);
      showToast('อัปโหลดโลโก้สำเร็จ', undefined, 'success');
    } catch {
      showToast('ไม่สามารถประมวลผลไฟล์ภาพได้', undefined, 'error');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formUrl.trim()) return;

    let cleanUrl = formUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    if (editingSite) {
      onUpdateWebsite(editingSite.id, {
        title: formTitle.trim(),
        description: formDescription.trim(),
        url: cleanUrl,
        logoUrl: formLogoUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
        category: '',
      });
      showToast('อัปเดตข้อมูลเว็บไซต์สำเร็จ', undefined, 'success');
    } else {
      onAddWebsite({
        title: formTitle.trim(),
        description: formDescription.trim(),
        url: cleanUrl,
        logoUrl: formLogoUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
        category: '',
      });
      showToast('เพิ่มเว็บไซต์แนะนำสำเร็จ', undefined, 'success');
    }

    setIsFormOpen(false);
  };

  const handleDelete = (id: string, title: string) => {
    showAlert({
      title: 'ยืนยันการลบเว็บไซต์แนะนำ?',
      text: `คุณต้องการลบ "${title}" ออกจากรายการหรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบเว็บไซต์',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      onConfirm: () => {
        onDeleteWebsite(id);
        showToast('ลบเว็บไซต์เรียบร้อยแล้ว', undefined, 'info');
      },
    });
  };

  // Drag and Drop reordering handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isAdmin) return;
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    if (!isAdmin || !draggedItemId || draggedItemId === targetId) return;
    e.preventDefault();

    const items = [...sortedWebsites];
    const sourceIndex = items.findIndex((i) => i.id === draggedItemId);
    const targetIndex = items.findIndex((i) => i.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Move source to target position
    const [movedItem] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, movedItem);

    // Update order numbers
    const updated = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    onReorderWebsites(updated);
    setDraggedItemId(null);
    showToast('ปรับลำดับเว็บไซต์เรียบร้อย', undefined, 'info');
  };

  return (
    <div id="recommended-websites-page" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">เว็บไซต์แนะนำ (Recommended Websites)</h2>
            <p className="text-xs text-slate-400">
              {isAdmin
                ? 'ระบบสารสนเทศเพื่อการศึกษา (ลากสลับตำแหน่งเพื่อจัดลำดับไอคอนได้)'
                : 'คลิกไอคอนเพื่อเปิดเว็บไซต์ และคลิกไอคอน (!) เพื่อดูคำอธิบาย'}
            </p>
          </div>
        </div>

        {/* Admin Add Website Button */}
        {isAdmin && (
          <button
            id="btn-admin-add-website"
            type="button"
            onClick={openAddModal}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 btn-glow shrink-0"
            title="เพิ่มเว็บไซต์แนะนำ (+)"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Grid Layout: 5-6 web logos per row on desktop (Responsive: 2 cols mobile, 3-4 cols tablet, 5-6 cols desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedWebsites.map((site) => (
          <div
            key={site.id}
            id={`website-card-${site.id}`}
            draggable={isAdmin}
            onDragStart={(e) => handleDragStart(e, site.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, site.id)}
            className={`group relative bg-white rounded-2xl border border-slate-200/80 hover:border-purple-300 shadow-xs hover:shadow-md transition-all p-4 flex flex-col items-center justify-between text-center card-hover cursor-pointer ${
              draggedItemId === site.id ? 'opacity-40 border-purple-500 border-dashed' : ''
            }`}
          >
            {/* Top Bar on card: Info icon (!) & Admin Drag Handle */}
            <div className="w-full flex items-center justify-between mb-2">
              {isAdmin ? (
                <div
                  title="ลากเพื่อจัดลำดับตำแหน่ง"
                  className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-600"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div></div>
              )}

              {/* Info icon ("!") triggers description modal */}
              <button
                type="button"
                id={`btn-info-${site.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInfoSite(site);
                }}
                className="p-1 rounded-full text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                title="ดูรายละเอียดและคำแนะนำ (!)"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Clickable Area: Opens external URL in new tab */}
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center w-full py-1 group-hover:scale-105 transition-transform"
            >
              <div className="w-16 h-16 rounded-2xl p-2 bg-slate-50 border border-slate-100 flex items-center justify-center mb-2.5 overflow-hidden shadow-2xs group-hover:shadow-xs">
                <img
                  src={site.logoUrl}
                  alt={site.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to globe icon
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              <h3 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">
                {site.title}
              </h3>

              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-0.5">
                <span>เปิดลิงก์</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>

            {/* Admin Controls: Edit, Delete */}
            {isAdmin && (
              <div className="w-full pt-2 mt-2 border-t border-slate-100 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(site);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                  title="แก้ไขข้อมูลเว็บไซต์"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(site.id, site.title);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="ลบเว็บไซต์"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Description Info Modal triggered by "!" icon */}
      {selectedInfoSite && (
        <div
          id="website-info-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedInfoSite(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl p-3 bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center">
                <img
                  src={selectedInfoSite.logoUrl}
                  alt={selectedInfoSite.title}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="pt-2">
                <h3 className="text-base font-bold text-slate-900">
                  {selectedInfoSite.title}
                </h3>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl text-left border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  คำแนะนำ & รายละเอียด:
                </p>
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {selectedInfoSite.description || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับเว็บไซต์นี้'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInfoSite(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  ปิด
                </button>
                <a
                  href={selectedInfoSite.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSelectedInfoSite(null)}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <span>เข้าสู่เว็บไซต์</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Website Modal */}
      {isFormOpen && (
        <div
          id="website-form-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">
                {editingSite ? 'แก้ไขเว็บไซต์แนะนำ' : 'เพิ่มเว็บไซต์แนะนำใหม่'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  ชื่อเว็บไซต์ (Title) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สพฐ. (OBEC) หรือ ระบบ SGS"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  ลิงก์ URL *
                </label>
                <input
                  type="text"
                  required
                  placeholder=""
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  โลโก้ / รูปภาพไอคอนเว็บไซต์ (Website Logo Upload)
                </label>
                <div className="flex items-center gap-4 p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {formLogoUrl ? (
                      <img
                        src={formLogoUrl}
                        alt="Logo Preview"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <Globe className="w-8 h-8 text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor="website-logo-upload-input"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer border border-purple-200 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isUploadingLogo ? 'กำลังประมวลผล...' : 'เลือกไฟล์ภาพโลโก้'}</span>
                    </label>
                    <input
                      id="website-logo-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoFileUpload(file);
                      }}
                      className="hidden"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      รองรับ PNG, JPG, SVG, WebP (ระบบย่อขนาดและเก็บข้อมูลอัตโนมัติ)
                    </p>
                    {formLogoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormLogoUrl('')}
                        className="text-[11px] text-rose-500 hover:text-rose-700 font-medium mt-0.5 cursor-pointer block"
                      >
                        ลบภาพโลโก้
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  คำอธิบาย & ข้อมูลประกอบ (Description สำหรับไอคอน !)
                </label>
                <textarea
                  rows={3}
                  placeholder="ระบุวัตถุประสงค์ คำแนะนำในการล็อกอิน หรือข้อมูลการใช้งาน..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow cursor-pointer transition-all"
                >
                  บันทึกเว็บไซต์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
