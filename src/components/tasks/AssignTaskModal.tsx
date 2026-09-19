import React, { useState } from 'react';
import { Task, Notice } from '../../types';
import {
  THAI_MONTHS,
  THAI_DAYS_SHORT,
  formatDateDMY,
} from '../../utils/date';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Megaphone
} from 'lucide-react';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (taskData: any) => void;
  onSaveTask?: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onSaveNotice?: (noticeData: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>) => void;
  tasks?: Task[];
  initialTab?: 'task' | 'notice';
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveTask,
  onSaveNotice,
  initialTab = 'task',
}) => {
  const [activeTab, setActiveTab] = useState<'task' | 'notice'>(initialTab);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  // Notice form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDescription, setNoticeDescription] = useState('');

  // Date selection state
  const [selectedStart, setSelectedStart] = useState<Date>(new Date());
  const [selectedEnd, setSelectedEnd] = useState<Date>(new Date());
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  // Calendar pop-up state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerMonth, setPickerMonth] = useState<Date>(new Date());

  if (!isOpen) return null;

  // Open calendar pop-up: Reset view to current day (วันปัจจุบัน)
  const handleOpenCalendar = () => {
    const today = new Date();
    setPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setShowDatePicker(true);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setSelectedStart(today);
    setSelectedEnd(today);
    setPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setIsSelectingEnd(false);
  };

  const handleDateClick = (clickedDate: Date) => {
    if (!isSelectingEnd) {
      setSelectedStart(clickedDate);
      setSelectedEnd(clickedDate);
      setIsSelectingEnd(true);
    } else {
      if (clickedDate.getTime() === selectedStart.getTime()) {
        setSelectedStart(clickedDate);
        setSelectedEnd(clickedDate);
      } else if (clickedDate.getTime() < selectedStart.getTime()) {
        setSelectedStart(clickedDate);
        setSelectedEnd(selectedStart);
      } else {
        setSelectedEnd(clickedDate);
      }
      setIsSelectingEnd(false);
    }
  };

  // Helper calendar matrix
  const pYear = pickerMonth.getFullYear();
  const pMonth = pickerMonth.getMonth();
  const firstDayIndex = new Date(pYear, pMonth, 1).getDay();
  const daysInMonth = new Date(pYear, pMonth + 1, 0).getDate();

  const matrix: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    matrix.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    matrix.push(d);
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isInRange = (d: Date) => {
    const time = d.getTime();
    const start = new Date(selectedStart.getFullYear(), selectedStart.getMonth(), selectedStart.getDate()).getTime();
    const end = new Date(selectedEnd.getFullYear(), selectedEnd.getMonth(), selectedEnd.getDate()).getTime();
    return time >= Math.min(start, end) && time <= Math.max(start, end);
  };

  const startFormatted = formatDateDMY(selectedStart);
  const endFormatted = formatDateDMY(selectedEnd);
  const dateDisplay = startFormatted === endFormatted ? startFormatted : `${startFormatted} - ${endFormatted}`;

  const handleSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const isRange = startFormatted !== endFormatted;
    const taskPayload: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: 'other',
      status: 'active',
      startDate: startFormatted,
      dueDate: endFormatted,
      isRange,
      dateRange: [startFormatted, endFormatted] as [string, string],
      targetRole: 'all' as const,
      createdBy: 'Admin',
    };

    if (onSaveTask) {
      onSaveTask(taskPayload);
    } else if (onSave) {
      onSave(taskPayload);
    }

    // Reset and close
    setTaskTitle('');
    setTaskDescription('');
    onClose();
  };

  const handleSubmitNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim()) return;

    if (onSaveNotice) {
      onSaveNotice({
        title: noticeTitle.trim(),
        description: noticeDescription.trim(),
        category: 'ข่าวสารวิชาการ',
        date: startFormatted,
        createdBy: 'Admin',
      });
    }

    // Reset and close
    setNoticeTitle('');
    setNoticeDescription('');
    onClose();
  };

  return (
    <div
      id="assign-task-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="assign-task-card"
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with 2 Tabs: มอบหมาย vs ประกาศทั่วไป */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-purple-800 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-inner shrink-0">
              {activeTab === 'task' ? (
                <ClipboardList className="w-5 h-5" />
              ) : (
                <Megaphone className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {activeTab === 'task' ? 'มอบหมายภาระงานวิชาการ' : 'สร้างประกาศทั่วไป'}
              </h3>
              <p className="text-[11px] text-purple-200">
                {activeTab === 'task'
                  ? 'สร้างงานและกำหนดช่วงเวลาส่งมอบ'
                  : 'แสดงบนแบนเนอร์ 15 วันและจุดบนปฏิทิน'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector Buttons */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'task'
                ? 'bg-white text-purple-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>1. มอบหมาย (Assign Task)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notice')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'notice'
                ? 'bg-white text-amber-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>2. ประกาศทั่วไป (General Notice)</span>
          </button>
        </div>

        {/* TAB 1: มอบหมายภาระงาน */}
        {activeTab === 'task' && (
          <form onSubmit={handleSubmitTask} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* 1. Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                หัวข้องานวิชาการ (Title) *
              </label>
              <input
                id="input-task-title"
                type="text"
                required
                placeholder="เช่น ส่งแผนการจัดการเรียนรู้ ภาคเรียนที่ 1/2569"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* 2. Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                รายละเอียด & คำชี้แจง (Description)
              </label>
              <textarea
                id="input-task-desc"
                rows={2}
                placeholder="ระบุข้อกำหนด ไฟล์ที่ต้องการ หรือแนวทางในการจัดส่งงาน..."
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* 3. Due Date with Calendar Icon - ตัวสุดท้าย */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                กำหนดส่งมอบ (Due Date)
              </label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div
                    onClick={handleOpenCalendar}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span>{dateDisplay}</span>
                    <span className="text-[11px] text-purple-600 font-medium">
                      {startFormatted === endFormatted ? 'วันเดียว' : 'ช่วงเวลา'}
                    </span>
                  </div>

                  {/* Calendar Icon Button: Trailing / ตัวสุดท้าย */}
                  <button
                    type="button"
                    onClick={handleOpenCalendar}
                    className="p-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                    title="เปิดปฏิทินเลือกวัน (แสดงวันปัจจุบัน)"
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Date Picker Pop-up */}
                {showDatePicker && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 z-40 bg-white rounded-2xl shadow-xl border border-purple-100 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {THAI_MONTHS[pMonth]} {pYear + 543}
                        </span>
                        <span className="text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-semibold">
                          วันปัจจุบัน: {formatDateDMY(new Date())}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSelectToday}
                          className="px-2 py-1 rounded text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                        >
                          วันนี้
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickerMonth(new Date(pYear, pMonth - 1, 1))}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickerMonth(new Date(pYear, pMonth + 1, 1))}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day Grid */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                      {THAI_DAYS_SHORT.map((d) => (
                        <span key={d} className="text-[10px] font-bold text-slate-400 py-0.5">
                          {d}
                        </span>
                      ))}

                      {matrix.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-cal-${idx}`} className="h-7" />;
                        }

                        const dObj = new Date(pYear, pMonth, day);
                        const isStart = isSameDay(selectedStart, dObj);
                        const isEnd = isSameDay(selectedEnd, dObj);
                        const inRange = isInRange(dObj);
                        const isToday = isSameDay(new Date(), dObj);

                        return (
                          <button
                            key={`cal-day-${day}`}
                            type="button"
                            onClick={() => handleDateClick(dObj)}
                            className={`h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                              isStart || isEnd
                                ? 'bg-purple-600 text-white shadow-xs'
                                : inRange
                                ? 'bg-purple-100 text-purple-900'
                                : isToday
                                ? 'border border-purple-400 text-purple-700 font-bold bg-purple-50/50'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {startFormatted === endFormatted
                          ? `เลือก: ${startFormatted}`
                          : `ช่วง: ${startFormatted} ถึง ${endFormatted}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        ตกลง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                id="btn-submit-assign-task"
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold btn-glow cursor-pointer transition-all shadow-md active:scale-95"
              >
                บันทึกและมอบหมายงาน
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ประกาศทั่วไป */}
        {activeTab === 'notice' && (
          <form onSubmit={handleSubmitNotice} className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* 1. Notice Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                หัวข้อประกาศ (Notice Title) *
              </label>
              <input
                id="input-notice-title"
                type="text"
                required
                placeholder="เช่น แจ้งกำหนดการประชุมยกระดับผลสัมฤทธิ์ทางการเรียน"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* 2. Notice Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                ข้อความประกาศ (Description)
              </label>
              <textarea
                id="input-notice-desc"
                rows={2}
                placeholder="ระบุข้อความประกาศ รายละเอียด หรือสถานที่..."
                value={noticeDescription}
                onChange={(e) => setNoticeDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* 3. Date selection with Calendar Icon - ตัวสุดท้าย */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                วันที่ประกาศ / วันที่กิจกรรม
              </label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div
                    onClick={handleOpenCalendar}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-xs sm:text-sm font-semibold text-slate-800 cursor-pointer flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span>{startFormatted}</span>
                    <span className="text-[11px] text-amber-600 font-medium">วันปัจจุบัน/กำหนด</span>
                  </div>

                  {/* Calendar Icon Button: Trailing / ตัวสุดท้าย */}
                  <button
                    type="button"
                    onClick={handleOpenCalendar}
                    className="p-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
                    title="เปิดปฏิทินเลือกวัน (แสดงวันปัจจุบัน)"
                  >
                    <CalendarIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Notice Date Picker Pop-up */}
                {showDatePicker && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 z-40 bg-white rounded-2xl shadow-xl border border-amber-100 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">
                          {THAI_MONTHS[pMonth]} {pYear + 543}
                        </span>
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-semibold">
                          วันปัจจุบัน: {formatDateDMY(new Date())}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleSelectToday}
                          className="px-2 py-1 rounded text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                        >
                          วันนี้
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickerMonth(new Date(pYear, pMonth - 1, 1))}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickerMonth(new Date(pYear, pMonth + 1, 1))}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-3">
                      {THAI_DAYS_SHORT.map((d) => (
                        <span key={d} className="text-[10px] font-bold text-slate-400 py-0.5">
                          {d}
                        </span>
                      ))}

                      {matrix.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-ncal-${idx}`} className="h-7" />;
                        }

                        const dObj = new Date(pYear, pMonth, day);
                        const isStart = isSameDay(selectedStart, dObj);
                        const isToday = isSameDay(new Date(), dObj);

                        return (
                          <button
                            key={`ncal-day-${day}`}
                            type="button"
                            onClick={() => {
                              setSelectedStart(dObj);
                              setSelectedEnd(dObj);
                              setShowDatePicker(false);
                            }}
                            className={`h-7 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isStart
                                ? 'bg-amber-600 text-white shadow-xs'
                                : isToday
                                ? 'border border-amber-400 text-amber-700 font-bold bg-amber-50/50'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
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
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold btn-glow cursor-pointer transition-all shadow-md active:scale-95"
              >
                บันทึกและเผยแพร่ประกาศ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
