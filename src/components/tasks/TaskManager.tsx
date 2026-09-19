import React, { useState } from 'react';
import { Task, Submission, SubmittedFile, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { getDaysRemaining, parseDMY } from '../../utils/date';
import {
  Plus,
  ClipboardList,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Send,
  Eye,
  Download,
  Trash2,
  Clock,
  Search,
  Check
} from 'lucide-react';

interface TaskManagerProps {
  tasks: Task[];
  submissions: Submission[];
  allUsers: User[];
  onOpenAssignModal: () => void;
  onOpenNoticeModal: () => void;
  onOpenSubmissionModal: (taskId: string) => void;
  onOpenAdminTracking: (taskId: string) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteSubmission: (submissionId: string) => void;
  onPreviewFile: (file: SubmittedFile) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  submissions,
  allUsers,
  onOpenAssignModal,
  onOpenSubmissionModal,
  onOpenAdminTracking,
  onUpdateTask,
  onDeleteTask,
  onPreviewFile,
}) => {
  const { currentUser } = useAuth();
  const { showAlert, showToast } = useAlert();
  const isAdmin = currentUser?.role === 'admin';

  const [searchQuery, setSearchQuery] = useState('');

  const activeTeachers = allUsers.filter((u) => u.role === 'member' && u.status === 'active');

  // Filter and Sort:
  // แก้ 5: รายการที่ใกล้ขึ้นกำหนดส่งจะอยู่ข้างบน และรายการที่สมาชิกส่งครบแล้วจะขึ้นสีเขียวอยู่ด้านล่าง
  const processedTasks = [...tasks]
    .filter((t) => {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aSubs = submissions.filter((s) => s.taskId === a.id);
      const bSubs = submissions.filter((s) => s.taskId === b.id);

      const aCompleted = Boolean(a.isPaperCompleted || (activeTeachers.length > 0 && aSubs.length >= activeTeachers.length));
      const bCompleted = Boolean(b.isPaperCompleted || (activeTeachers.length > 0 && bSubs.length >= activeTeachers.length));

      // 1. If one is completed and one is not: completed always goes to the bottom!
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;

      // 2. If both have the same completion state, sort by nearest due date ascending (closest deadline first at top)
      const dateA = parseDMY(a.dueDate)?.getTime() || 0;
      const dateB = parseDMY(b.dueDate)?.getTime() || 0;
      return dateA - dateB;
    });

  // Confirm manual paper completion
  const handleTogglePaperCompleted = (task: Task, currentlyCompleted: boolean) => {
    showAlert({
      title: currentlyCompleted ? 'ยกเลิกสถานะส่งครบทุกคน?' : 'ยืนยันว่าสมาชิกส่งครบทุกคนแล้ว?',
      text: currentlyCompleted
        ? `ต้องการยกเลิกการบันทึกส่งครบทุกคนสำหรับภาระงาน "${task.title}" หรือไม่?`
        : `คุณต้องการยืนยันว่าสมาชิกส่งงาน "${task.title}" ครบทุกคนแล้ว (รวมถึงส่งเป็นเอกสาร Paper) หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: currentlyCompleted ? '#EF4444' : '#10B981',
      onConfirm: () => {
        if (onUpdateTask) {
          onUpdateTask(task.id, { isPaperCompleted: !currentlyCompleted });
          showToast(
            !currentlyCompleted
              ? 'บันทึกสถานะส่งครบทุกคนแล้ว (รวม Paper)'
              : 'ยกเลิกสถานะส่งครบเรียบร้อย',
            undefined,
            'success'
          );
        }
      },
    });
  };

  const handleDeleteTaskConfirm = (taskId: string, title: string) => {
    showAlert({
      title: 'ยืนยันการลบภาระงานวิชาการ?',
      text: `คุณต้องการลบ "${title}" และรายการส่งงานทั้งหมดที่เกี่ยวข้องหรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบภาระงาน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#EF4444',
      onConfirm: () => {
        onDeleteTask(taskId);
        showToast('ลบภาระงานเรียบร้อยแล้ว', undefined, 'info');
      },
    });
  };

  const handleDownloadFile = (file: SubmittedFile) => {
    if (file.url && file.url !== '#') {
      const a = document.createElement('a');
      a.href = file.url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div id="task-management-page" className="space-y-4">
      {/* Page Header & Actions */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 truncate">
              ระบบจัดการงานวิชาการ
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              {isAdmin
                ? 'มอบหมายภาระงาน ติดตามผล และตรวจรับรองเอกสาร'
                : 'ดูรายการภาระงานและส่งไฟล์เอกสาร'}
            </p>
          </div>
        </div>

        {/* Right Actions: 1 & 2 แก้ตรงสร้างรายการใหม่(+) เป็นไอคอน (+) กดครั้งเดียวเปิดเลย */}
        {isAdmin && (
          <button
            id="btn-admin-add-task-choice"
            type="button"
            onClick={onOpenAssignModal}
            className="w-10 h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-95 btn-glow shrink-0"
            title="สร้างรายการใหม่ (+)"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Bar (หมวดหมู่งานถูกเอาออกแล้วตามข้อ 3) */}
      <div className="relative bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <Search className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาตามชื่องานวิชาการ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
        />
      </div>

      {/* Tasks List: 4 เอาคำอธิบายออก และปรับให้เล็กขึ้น มินิมัลขึ้น, 5 ใกล้ส่งอยู่บน ส่งครบสีเขียวอยู่ล่าง */}
      <div className="space-y-2.5">
        {processedTasks.length === 0 ? (
          <div className="bg-white p-10 text-center rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-700">ไม่พบรายการภาระงานวิชาการ</h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {isAdmin
                ? 'กดปุ่มไอคอน (+) เพื่อมอบหมายภาระงานหรือสร้างประกาศใหม่'
                : 'ยังไม่มีภาระงานที่ตรงกับการค้นหาในขณะนี้'}
            </p>
          </div>
        ) : (
          processedTasks.map((task) => {
            const remaining = getDaysRemaining(task.dueDate);
            const mySubmission = currentUser
              ? submissions.find((s) => s.taskId === task.id && s.userId === currentUser.id)
              : undefined;
            const isSubmitted = Boolean(mySubmission);

            const taskSubs = submissions.filter((s) => s.taskId === task.id);
            const isAutoCompleted = activeTeachers.length > 0 && taskSubs.length >= activeTeachers.length;
            const isCompleted = Boolean(task.isPaperCompleted || isAutoCompleted);
            const pendingCount = activeTeachers.length - taskSubs.length;

            return (
              <div
                key={task.id}
                id={`task-card-${task.id}`}
                className={`rounded-2xl border transition-all overflow-hidden p-3.5 sm:p-4 shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-400'
                    : 'bg-white border-slate-200/90 hover:border-purple-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left Side: Title & Status Tags (คำอธิบายถูกเอาออกแล้วตามข้อ 4) */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Due Status / Completed Badge */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ส่งครบทุกคนแล้ว {task.isPaperCompleted ? '(รวม Paper)' : ''}</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            remaining.isOverdue
                              ? 'bg-rose-100 text-rose-700'
                              : remaining.days === 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{remaining.text}</span>
                        </span>
                      )}

                      {/* Date display */}
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        {task.isRange && task.startDate ? (
                          <span>ช่วงเวลา: {task.startDate} ถึง {task.dueDate}</span>
                        ) : (
                          <span>กำหนดส่ง: {task.dueDate}</span>
                        )}
                      </span>
                    </div>

                    {/* Task Title (Minimal, no description) */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {task.title}
                    </h3>
                  </div>

                  {/* Right Side Actions & Stats */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        {/* Status text */}
                        <span className="text-xs text-slate-600 font-medium hidden md:inline">
                          ส่งแล้ว <strong>{taskSubs.length}</strong>/{activeTeachers.length} คน
                          {!isCompleted && pendingCount > 0 && (
                            <span className="text-rose-600 ml-1 font-semibold">
                              (ค้าง {pendingCount})
                            </span>
                          )}
                        </span>

                        {/* 5 ปุ่มขีดถูก เพื่อระบุว่าสมาชิกส่งเป็น Paper แล้วจะได้บอกว่าส่งครบทุกคน */}
                        <button
                          type="button"
                          onClick={() => handleTogglePaperCompleted(task, isCompleted)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
                          }`}
                          title={
                            isCompleted
                              ? 'ส่งครบทุกคนแล้ว (คลิกเพื่อยกเลิก)'
                              : 'ทำเครื่องหมายว่าส่งครบทุกคนแล้ว (รวมเอกสาร Paper)'
                          }
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {/* Tracking Modal Button */}
                        <button
                          type="button"
                          onClick={() => onOpenAdminTracking(task.id)}
                          className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
                          title="ติดตามรายชื่อ & ตรวจไฟล์"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">ติดตามรายชื่อ</span>
                        </button>

                        {/* Delete Task Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteTaskConfirm(task.id, task.title)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="ลบภาระงานนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Member Action */}
                    {!isAdmin && (
                      <div className="flex items-center gap-2">
                        {isSubmitted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ส่งงานแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>ยังไม่ส่ง</span>
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenSubmissionModal(task.id)}
                          className={`px-3.5 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                            isSubmitted
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSubmitted ? 'แก้ไขไฟล์' : 'ส่งงาน'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Member: View own submitted files compact row */}
                {!isAdmin && isSubmitted && mySubmission && mySubmission.files.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px]">
                      ไฟล์ที่คุณส่ง ({mySubmission.files.length}):
                    </span>
                    {mySubmission.files.map((f) => (
                      <div
                        key={f.id}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs"
                      >
                        <span className="truncate max-w-[140px] font-medium">{f.name}</span>
                        <button
                          type="button"
                          onClick={() => onPreviewFile(f)}
                          className="text-slate-400 hover:text-purple-600 cursor-pointer"
                          title="ดูตัวอย่าง"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadFile(f)}
                          className="text-slate-400 hover:text-emerald-600 cursor-pointer"
                          title="ดาวน์โหลด"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
