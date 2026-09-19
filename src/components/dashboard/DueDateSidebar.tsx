import React, { useState } from 'react';
import { Task, Submission, User } from '../../types';
import { isWithinDays, getDaysRemaining } from '../../utils/date';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Users,
  ChevronRight,
  Send,
  UserX,
  X
} from 'lucide-react';

interface DueDateSidebarProps {
  tasks: Task[];
  submissions: Submission[];
  allUsers: User[];
  currentUserId?: string;
  isAdmin: boolean;
  onOpenSubmissionForTask: (taskId: string) => void;
  onOpenAdminTracking: (taskId: string) => void;
}

export const DueDateSidebar: React.FC<DueDateSidebarProps> = ({
  tasks,
  submissions,
  allUsers,
  currentUserId,
  isAdmin,
  onOpenSubmissionForTask,
  onOpenAdminTracking,
}) => {
  const [selectedTaskForPendingModal, setSelectedTaskForPendingModal] = useState<Task | null>(null);

  const activeTeachers = allUsers.filter((u) => u.role === 'member' && u.status === 'active');

  // Filter tasks due within 30 days
  const tasksDueIn30Days = tasks.filter((task) => {
    // Check 30 days condition
    if (!isWithinDays(task.dueDate, 30)) return false;

    if (isAdmin) {
      // Auto-remove when ALL members have completed
      const taskSubs = submissions.filter((s) => s.taskId === task.id);
      const isAllCompleted = activeTeachers.length > 0 && taskSubs.length >= activeTeachers.length;
      return !isAllCompleted;
    } else {
      // For member: Auto-remove upon completion
      const mySub = currentUserId
        ? submissions.find((s) => s.taskId === task.id && s.userId === currentUserId)
        : undefined;
      return !mySub;
    }
  });

  return (
    <>
      <div
        id="due-date-sidebar-widget"
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isAdmin ? 'ติดตามกำหนดส่ง (30 วัน)' : 'งานที่ต้องส่ง (30 วัน)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAdmin
                  ? 'จะซ่อนเมื่อครูทุกคนส่งครบ'
                  : 'จะซ่อนอัตโนมัติเมื่อส่งแล้ว'}
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
            {tasksDueIn30Days.length} รายการ
          </span>
        </div>

        {/* Task List */}
        <div className="p-3 space-y-2.5 overflow-y-auto max-h-[480px]">
          {tasksDueIn30Days.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">ไม่มีภาระงานค้างส่ง!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAdmin
                  ? 'ครูทุกท่านได้ส่งงานครบถ้วนแล้ว หรือยังไม่มีภาระงานใหม่'
                  : 'คุณได้ส่งงานที่ครบกำหนดภายใน 30 วันทั้งหมดเรียบร้อยแล้ว'}
              </p>
            </div>
          ) : (
            tasksDueIn30Days.map((task) => {
              const remaining = getDaysRemaining(task.dueDate);
              const taskSubs = submissions.filter((s) => s.taskId === task.id);
              const pendingTeachers = activeTeachers.filter(
                (t) => !taskSubs.some((s) => s.userId === t.id)
              );

              return (
                <div
                  key={task.id}
                  id={`due-task-item-${task.id}`}
                  onClick={() => {
                    if (isAdmin) {
                      setSelectedTaskForPendingModal(task);
                    } else {
                      onOpenSubmissionForTask(task.id);
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group card-hover ${
                    remaining.isOverdue
                      ? 'border-rose-200 bg-rose-50/40 hover:bg-rose-50'
                      : remaining.days === 0
                      ? 'border-amber-200 bg-amber-50/40 hover:bg-amber-50'
                      : 'border-slate-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            remaining.isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : remaining.days <= 3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {remaining.isOverdue ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{remaining.text}</span>
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {task.dueDate}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800 leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors">
                        {task.title}
                      </h4>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-transform shrink-0 mt-1" />
                  </div>

                  {/* Admin summary preview: Pending members count with Red highlight */}
                  {isAdmin && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        ส่งแล้ว {taskSubs.length}/{activeTeachers.length}
                      </span>
                      {pendingTeachers.length > 0 && (
                        <span className="text-rose-600 font-bold bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <UserX className="w-3 h-3" />
                          ค้างส่ง {pendingTeachers.length} คน
                        </span>
                      )}
                    </div>
                  )}

                  {/* Member action helper */}
                  {!isAdmin && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-600 font-medium">
                      <span>คลิกเพื่อเปิดแบบฟอร์มส่งงาน</span>
                      <Send className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Admin: Clickable Task Item Modal showing pending members with Red highlight */}
      {selectedTaskForPendingModal && (
        <div
          id="admin-pending-members-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedTaskForPendingModal(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">ติดตามสถานะการส่งงาน</h3>
                <p className="text-xs text-purple-200 truncate max-w-md">
                  {selectedTaskForPendingModal.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedTaskForPendingModal(null)}
                className="p-1.5 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              <div className="text-xs text-slate-500 mb-2 flex items-center justify-between">
                <span>รายชื่อครูผู้สอนทั้งหมด ({activeTeachers.length} ท่าน)</span>
                <span className="text-rose-600 font-semibold">
                  * ไฮไลท์สีแดง = ยังไม่ส่งงาน
                </span>
              </div>

              {activeTeachers.map((teacher) => {
                const sub = submissions.find(
                  (s) => s.taskId === selectedTaskForPendingModal.id && s.userId === teacher.id
                );
                const hasSubmitted = Boolean(sub);

                return (
                  <div
                    key={teacher.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      hasSubmitted
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-rose-300 bg-rose-50/80 shadow-xs' // Red highlight for non-submitters
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={
                          teacher.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                            teacher.username
                          )}`
                        }
                        alt="Avatar"
                        className="w-9 h-9 rounded-full object-cover shrink-0 border"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            hasSubmitted ? 'text-slate-800' : 'text-rose-900 font-extrabold'
                          }`}
                        >
                          {teacher.fullName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {teacher.department || teacher.username}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {hasSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>ส่งแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white shadow-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>ยังไม่ส่ง (ค้างส่ง)</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const taskId = selectedTaskForPendingModal.id;
                  setSelectedTaskForPendingModal(null);
                  onOpenAdminTracking(taskId);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs btn-glow cursor-pointer transition-all"
              >
                เปิดหน้ารายละเอียด & ตรวจไฟล์
              </button>

              <button
                type="button"
                onClick={() => setSelectedTaskForPendingModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
