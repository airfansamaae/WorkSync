import React from 'react';
import { Task, Notice, Submission, User } from '../../types';
import { formatThaiDate } from '../../utils/date';
import {
  Calendar,
  X,
  FileCheck2,
  AlertCircle,
  Megaphone,
  CheckCircle2,
  Clock,
  Send,
  UserX
} from 'lucide-react';

interface DateDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // dd/mm/yyyy
  tasks: Task[];
  notices: Notice[];
  submissions: Submission[];
  allUsers: User[];
  currentUserId?: string;
  isAdmin: boolean;
  onOpenSubmissionForTask: (taskId: string) => void;
  onOpenAdminTracking: (taskId: string) => void;
}

export const DateDetailModal: React.FC<DateDetailModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  tasks,
  notices,
  submissions,
  allUsers,
  currentUserId,
  isAdmin,
  onOpenSubmissionForTask,
  onOpenAdminTracking,
}) => {
  if (!isOpen || !selectedDate) return null;

  // Filter tasks due on this date (or within date range if range)
  const matchedTasks = tasks.filter((t) => {
    if (t.dueDate === selectedDate) return true;
    if (t.isRange && t.startDate && t.dueDate) {
      return t.startDate === selectedDate || t.dueDate === selectedDate;
    }
    return false;
  });

  // Filter notices for this date
  const matchedNotices = notices.filter((n) => n.date === selectedDate);

  const activeTeachers = allUsers.filter((u) => u.role === 'member' && u.status === 'active');

  return (
    <div
      id="date-detail-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="date-detail-modal-card"
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">รายละเอียดภาระงาน & ประกาศ</h3>
              <p className="text-xs text-purple-200">
                ประจำวันที่ {formatThaiDate(selectedDate)} ({selectedDate})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section 1: Tasks */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-purple-600" />
              <span>ภาระงานที่ครบกำหนด ({matchedTasks.length})</span>
            </h4>

            {matchedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                ไม่มีภาระงานวิชาการที่ครบกำหนดในวันนี้
              </p>
            ) : (
              <div className="space-y-3">
                {matchedTasks.map((task) => {
                  const mySub = currentUserId
                    ? submissions.find((s) => s.taskId === task.id && s.userId === currentUserId)
                    : undefined;
                  const isCompleted = Boolean(mySub);

                  const taskSubs = submissions.filter((s) => s.taskId === task.id);
                  const nonSubmitters = activeTeachers.filter(
                    (teacher) => !taskSubs.some((sub) => sub.userId === teacher.id)
                  );

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                ส่งแล้ว
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                                <AlertCircle className="w-3.5 h-3.5" />
                                รอดำเนินการส่ง
                              </span>
                            )}
                            <span className="text-xs text-slate-500">
                              กำหนดส่ง: {task.dueDate}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-800">{task.title}</h5>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {task.description}
                          </p>
                        </div>
                      </div>

                      {/* Admin View: Submissions progress */}
                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-700 font-medium">
                              ส่งแล้ว {taskSubs.length}/{activeTeachers.length} คน
                            </span>
                            {nonSubmitters.length > 0 && (
                              <span className="text-rose-600 font-medium flex items-center gap-1">
                                <UserX className="w-3.5 h-3.5" />
                                ยังไม่ส่ง {nonSubmitters.length} คน
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              onClose();
                              onOpenAdminTracking(task.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors cursor-pointer text-xs"
                          >
                            ดูรายชื่อผู้ส่ง & ไฟล์
                          </button>
                        </div>
                      )}

                      {/* Member View: Quick submit button */}
                      {!isAdmin && (
                        <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            onClick={() => {
                              onClose();
                              onOpenSubmissionForTask(task.id);
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white btn-glow'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isCompleted ? 'ดูหรือแก้ไขงานที่ส่ง' : 'ส่งงานทันที'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Notices / General Announcements */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <span>ประกาศทั่วไปประจำวัน ({matchedNotices.length})</span>
            </h4>

            {matchedNotices.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl">
                ไม่มีประกาศทั่วไปในวันนี้
              </p>
            ) : (
              <div className="space-y-3">
                {matchedNotices.map((notice) => (
                  <div
                    key={notice.id}
                    className="p-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-900">
                        {notice.category || 'ประกาศทั่วไป'}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {notice.date}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-800">{notice.title}</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notice.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
