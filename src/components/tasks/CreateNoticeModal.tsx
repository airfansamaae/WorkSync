import React, { useState } from 'react';
import { Notice, Task } from '../../types';
import { THAI_MONTHS, THAI_DAYS_SHORT, formatDateDMY } from '../../utils/date';
import {
  Megaphone,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSave: (notice: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>) => void;
}

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('การประชุมวิชาการ');
  const [linkedTaskId, setLinkedTaskId] = useState('');

  // Date picker state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [pickerMonth, setPickerMonth] = useState(new Date());

  if (!isOpen) return null;

  const pYear = pickerMonth.getFullYear();
  const pMonth = pickerMonth.getMonth();
  const firstDay = new Date(pYear, pMonth, 1).getDay();
  const daysCount = new Date(pYear, pMonth + 1, 0).getDate();

  const matrix: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) matrix.push(null);
  for (let d = 1; d <= daysCount; d++) matrix.push(d);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim(),
      category,
      date: formatDateDMY(selectedDate),
      createdBy: 'Admin',
      linkedTaskId: linkedTaskId || undefined,
    });

    onClose();
  };

  return (
    <div
      id="create-notice-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="create-notice-card"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">สร้างประกาศทั่วไป (General Notice)</h3>
              <p className="text-xs text-amber-100">
                แสดงบนแบนเนอร์ 15 วัน และปรากฏเป็นจุดสีเหลืองในปฏิทิน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              หัวข้อประกาศ (Title) *
            </label>
            <input
              id="input-notice-title"
              type="text"
              required
              placeholder="เช่น แจ้งกำหนดการประชุมยกระดับผลสัมฤทธิ์ทางการเรียน"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                หมวดหมู่ประกาศ
              </label>
              <select
                id="select-notice-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="การประชุมวิชาการ">การประชุมวิชาการ</option>
                <option value="นิเทศการศึกษา">นิเทศการศึกษา</option>
                <option value="ส่งงานวิชาการ">ส่งงานวิชาการ</option>
                <option value="อบรมพัฒนาวิชาชีพ">อบรมพัฒนาวิชาชีพ</option>
                <option value="ข่าวประชาสัมพันธ์ทั่วไป">ข่าวประชาสัมพันธ์ทั่วไป</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                เชื่อมโยงกับภาระงาน (ถ้ามี)
              </label>
              <select
                id="select-notice-task"
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- ไม่เชื่อมโยง --</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              รายละเอียดประกาศ (Description)
            </label>
            <textarea
              id="input-notice-desc"
              rows={3}
              placeholder="ระบุเนื้อหา สถานที่ เวลา หรือรายละเอียดที่ต้องการชี้แจง..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm transition-all"
            />
          </div>

          {/* Date Picker Pop-up */}
          <div className="border border-amber-200/70 rounded-2xl p-3.5 bg-amber-50/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                <span>วันที่แสดงในปฏิทิน (dd/mm/yyyy)</span>
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full">
                {formatDateDMY(selectedDate)}
              </span>
            </div>

            {/* Month Nav */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                {THAI_MONTHS[pMonth]} {pYear + 543}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPickerMonth(new Date(pYear, pMonth - 1, 1))}
                  className="p-1 rounded text-slate-500 hover:bg-white cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPickerMonth(new Date(pYear, pMonth + 1, 1))}
                  className="p-1 rounded text-slate-500 hover:bg-white cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Matrix */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {THAI_DAYS_SHORT.map((d) => (
                <span key={d} className="text-[10px] font-bold text-slate-400 py-0.5">
                  {d}
                </span>
              ))}

              {matrix.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-notice-${idx}`} className="h-7" />;
                }

                const dObj = new Date(pYear, pMonth, day);
                const isSelected =
                  dObj.getDate() === selectedDate.getDate() &&
                  dObj.getMonth() === selectedDate.getMonth() &&
                  dObj.getFullYear() === selectedDate.getFullYear();

                return (
                  <button
                    key={`notice-day-${day}`}
                    type="button"
                    onClick={() => setSelectedDate(dObj)}
                    className={`h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              id="btn-submit-create-notice"
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              สร้างประกาศ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
