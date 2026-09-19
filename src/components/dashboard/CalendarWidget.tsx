import React, { useState } from 'react';
import { Task, Notice, Submission } from '../../types';
import {
  THAI_MONTHS,
  THAI_DAYS_SHORT,
  formatDateDMY,
  parseDMY
} from '../../utils/date';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

interface CalendarWidgetProps {
  tasks: Task[];
  notices: Notice[];
  submissions: Submission[];
  currentUserId?: string;
  isAdmin: boolean;
  onSelectDate: (dmy: string) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  tasks,
  notices,
  submissions,
  currentUserId,
  isAdmin,
  onSelectDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div
      id="calendar-overview-widget"
      className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
    >
      {/* Calendar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {THAI_MONTHS[month]} {year + 543}
            </h3>
            <p className="text-xs text-slate-400">ปฏิทินงานวิชาการ (dd/mm/yyyy)</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer"
          >
            วันนี้
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Indicators Legend */}
      <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
          <span>🔴 ครบกำหนดวันนี้ / รอดำเนินการ</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
          <span>🟢 ส่งแล้ว / เสร็จสิ้น</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
          <span>🟡 ประกาศทั่วไป / แจ้งข่าว</span>
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="p-3 sm:p-4">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {THAI_DAYS_SHORT.map((day, idx) => (
            <div
              key={day}
              className={`text-center text-xs font-bold py-1 ${
                idx === 0 || idx === 6 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-20 sm:h-24 bg-transparent rounded-xl" />;
            }

            const currentCellDate = new Date(year, month, day);
            const dmyString = formatDateDMY(currentCellDate);
            const isTodayCell = isCurrentMonth && day === today.getDate();

            // Find tasks matching due date or start date
            const dayTasks = tasks.filter((t) => {
              if (t.dueDate === dmyString) return true;
              if (t.isRange && t.startDate === dmyString) return true;
              return false;
            });

            // Find notices matching this date
            const dayNotices = notices.filter((n) => n.date === dmyString);

            const hasItems = dayTasks.length > 0 || dayNotices.length > 0;

            return (
              <div
                key={`day-${day}`}
                id={`calendar-cell-${day}`}
                onClick={() => onSelectDate(dmyString)}
                className={`group relative h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isTodayCell
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-600/20'
                    : hasItems
                    ? 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-xs'
                    : 'border-slate-100 bg-white/60 hover:bg-slate-50'
                }`}
              >
                {/* Date Number Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold leading-none ${
                      isTodayCell
                        ? 'w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center'
                        : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                  {hasItems && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {dayTasks.length + dayNotices.length}
                    </span>
                  )}
                </div>

                {/* Badges / Task Titles */}
                <div className="space-y-1 overflow-hidden mt-1 flex-1">
                  {/* Tasks */}
                  {dayTasks.slice(0, 2).map((task) => {
                    const isDueToday = isTodayCell && task.dueDate === dmyString;
                    const mySub = currentUserId
                      ? submissions.find((s) => s.taskId === task.id && s.userId === currentUserId)
                      : undefined;
                    const isSubmitted = Boolean(mySub);

                    // Indicator color
                    // Red = Due today / Pending submission
                    // Green = Submitted / Completed
                    let badgeClass = 'bg-rose-100 text-rose-800 border-rose-200';
                    let dotColor = 'bg-rose-500';

                    if (isSubmitted) {
                      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      dotColor = 'bg-emerald-500';
                    } else if (isAdmin) {
                      // For admin: check if all teachers submitted
                      const taskSubs = submissions.filter((s) => s.taskId === task.id);
                      if (taskSubs.length > 0) {
                        badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        dotColor = 'bg-emerald-500';
                      }
                    }

                    return (
                      <div
                        key={task.id}
                        title={`ภาระงาน: ${task.title} (${task.dueDate})`}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate flex items-center gap-1 leading-tight ${badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`}></span>
                        <span className="truncate">{task.title}</span>
                      </div>
                    );
                  })}

                  {/* Notices */}
                  {dayNotices.slice(0, 1).map((notice) => (
                    <div
                      key={notice.id}
                      title={`ประกาศ: ${notice.title}`}
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 truncate flex items-center gap-1 leading-tight"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span className="truncate">{notice.title}</span>
                    </div>
                  ))}

                  {dayTasks.length + dayNotices.length > 2 && (
                    <span className="text-[9px] text-purple-600 font-bold block truncate">
                      +{dayTasks.length + dayNotices.length - 2} รายการ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
