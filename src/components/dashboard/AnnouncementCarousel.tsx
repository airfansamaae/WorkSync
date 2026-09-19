import React, { useState, useEffect, useRef } from 'react';
import { Notice, Task } from '../../types';
import { isNoticeActive, formatThaiDate, formatThaiFullDateWithDay, getDaysRemaining } from '../../utils/date';
import {
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Send,
  Calendar,
  Clock,
  Sparkles,
  Info,
  Pause
} from 'lucide-react';

interface AnnouncementCarouselProps {
  notices: Notice[];
  tasks: Task[];
  onOpenSubmissionForTask: (taskId: string) => void;
}

export const AnnouncementCarousel: React.FC<AnnouncementCarouselProps> = ({
  notices,
  tasks,
  onOpenSubmissionForTask,
}) => {
  // Filter notices strictly according to requirement:
  // - If linked to a task or is a submission notice:
  //   Show ONLY if within 15 days ahead (0 <= remaining days <= 15).
  //   If overdue (remaining days < 0), it disappears automatically.
  // - If general announcement:
  //   Show within 15 days of creation (isNoticeActive) and not expired.
  const activeNotices = notices.filter((n) => {
    // Check if notice is linked to an active task
    const linkedTask = n.linkedTaskId
      ? tasks.find((t) => t.id === n.linkedTaskId)
      : tasks.find((t) => n.title.includes(t.title) || (t.title.includes('แผน') && n.title.includes('แผน')));

    if (linkedTask) {
      const rem = getDaysRemaining(linkedTask.dueDate);
      return rem.days >= 0 && rem.days <= 15;
    }

    // Check if notice itself has a due/event date
    if (n.date) {
      const rem = getDaysRemaining(n.date);
      if (rem.days < 0 || rem.days > 15) {
        return false;
      }
    }

    // General notice: auto-expire 15 days after creation date
    return isNoticeActive(n.createdAt, n.expiresAt);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto slide every 13 seconds (13000ms) as mandated.
  // When user presses/holds on the announcement banner, pause sliding completely.
  useEffect(() => {
    if (activeNotices.length <= 1 || isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeNotices.length);
    }, 13000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeNotices.length, isPaused]);

  if (activeNotices.length === 0) {
    return (
      <div
        id="announcement-empty-card"
        className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5"
      >
        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-700">ไม่มีประกาศใหม่ในขณะนี้</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            ระบบจะแสดงประกาศและงานที่ต้องส่งล่วงหน้า 15 วัน และจะซ่อนอัตโนมัติเมื่อครบกำหนด
          </p>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, activeNotices.length - 1);
  const currentNotice = activeNotices[safeIndex];

  // Check if this notice is linked to an active task
  const linkedTask = currentNotice.linkedTaskId
    ? tasks.find((t) => t.id === currentNotice.linkedTaskId)
    : tasks.find((t) => currentNotice.title.includes(t.title) || (t.title.includes('แผน') && currentNotice.title.includes('แผน')));

  const isSubmissionNotice = Boolean(
    linkedTask ||
    currentNotice.linkedTaskId ||
    currentNotice.title.includes('ส่ง') ||
    currentNotice.description.includes('ส่งงาน')
  );

  // Date information
  const targetDate = linkedTask?.dueDate || currentNotice.date || currentNotice.createdAt;
  const dueInfo = isSubmissionNotice && targetDate ? getDaysRemaining(targetDate) : null;
  const formattedFullDate = formatThaiFullDateWithDay(targetDate);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? activeNotices.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeNotices.length);
  };

  // Handlers for pressing/holding to pause
  const handleHoldStart = () => {
    setIsPaused(true);
  };

  const handleHoldEnd = () => {
    setIsPaused(false);
  };

  return (
    <div
      id="announcement-banner-container"
      onMouseDown={handleHoldStart}
      onMouseUp={handleHoldEnd}
      onMouseLeave={handleHoldEnd}
      onTouchStart={handleHoldStart}
      onTouchEnd={handleHoldEnd}
      onTouchCancel={handleHoldEnd}
      title="กดค้างเพื่อหยุดการเลื่อนอัตโนมัติ (13 วินาที/สไลด์)"
      className={`relative overflow-hidden rounded-2xl text-white shadow-md transition-all duration-300 p-5 sm:p-6 min-h-[150px] flex flex-col justify-between select-none ${
        isSubmissionNotice
          ? 'bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 border border-red-300/40 shadow-rose-950/20'
          : 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 border border-amber-300/40 shadow-amber-950/20'
      } ${isPaused ? 'ring-3 ring-white/50 scale-[0.998]' : ''}`}
    >
      {/* Background Subtle Shapes with Modern Lighting */}
      <div
        className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
          isSubmissionNotice ? 'bg-orange-300/25' : 'bg-yellow-200/25'
        }`}
      />
      <div
        className={`absolute -bottom-10 left-1/3 w-60 h-60 rounded-full blur-2xl pointer-events-none ${
          isSubmissionNotice ? 'bg-rose-400/20' : 'bg-amber-400/20'
        }`}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Side: Badge, Clear Prominent Title, Date Box & Description */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Top Info Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isSubmissionNotice ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white text-red-700 shadow-2xs">
                <Send className="w-3.5 h-3.5 fill-current" />
                แจ้งเตือน: กำหนดส่งงานวิชาการ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950/70 text-amber-300 shadow-2xs backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                ข่าวสาร: ประกาศฝ่ายวิชาการ
              </span>
            )}

            {currentNotice.category && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/15 text-white/95 backdrop-blur-xs">
                {currentNotice.category}
              </span>
            )}

            <span className="flex items-center gap-1 text-xs text-white/85">
              <Clock className="w-3.5 h-3.5" />
              {formatThaiDate(currentNotice.createdAt)}
            </span>

            {/* Pause indicator pill */}
            {isPaused && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-slate-800 shadow-xs animate-pulse">
                <Pause className="w-3 h-3 text-purple-600" />
                หยุดเลื่อนชั่วคราว (กดค้างอยู่)
              </span>
            )}
          </div>

          {/* Title - ชัดเจน เด่นชัด ขนาดพอเหมาะ สมดุลทุกประเภท */}
          <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-snug drop-shadow-xs">
            {currentNotice.title}
          </h3>

          {/* Description */}
          {currentNotice.description && (
            <p className="text-xs sm:text-sm text-white/95 leading-relaxed max-w-3xl line-clamp-2">
              {currentNotice.description}
            </p>
          )}

          {/* Detailed Full Thai Date Box - แสดง วัน วันที่ เดือน ปี พ.ศ. ชัดเจนเหมือนกันทั้ง 2 แบบ */}
          <div className="pt-0.5">
            <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/20 text-white shadow-2xs">
              <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-semibold text-amber-200">
                  {isSubmissionNotice ? 'กำหนดส่ง:' : 'วันที่ประกาศ/กิจกรรม:'}
                </span>
                <span className="font-bold text-white tracking-wide">
                  {formattedFullDate}
                </span>
                {isSubmissionNotice && dueInfo && (
                  <span className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-red-700 shadow-2xs">
                    {dueInfo.text}
                  </span>
                )}
                {!isSubmissionNotice && (
                  <span className="ml-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/20 text-white shadow-2xs">
                    แสดงล่วงหน้า 15 วัน
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Action CTA & Slider Controls */}
        <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3.5 shrink-0 self-stretch md:self-auto">
          {/* Action Button or Info Badge */}
          {linkedTask ? (
            <button
              id="announcement-cta-submit"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSubmissionForTask(linkedTask.id);
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 font-bold text-xs sm:text-sm btn-glow flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>ส่งงาน (Submit)</span>
            </button>
          ) : (
            <div className="px-3.5 py-2 rounded-xl bg-white/20 backdrop-blur-xs text-white text-xs font-semibold flex items-center gap-1.5 border border-white/25">
              <Info className="w-3.5 h-3.5 text-amber-200" />
              <span>ประกาศวิชาการ</span>
            </div>
          )}

          {/* Slider Navigation Arrows & Indicators */}
          {activeNotices.length > 1 && (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1 mr-1">
                {activeNotices.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === safeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  id="announcement-btn-prev"
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  title="ประกาศก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  id="announcement-btn-next"
                  type="button"
                  onClick={handleNext}
                  className="p-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  title="ประกาศถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
