import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  Task,
  Notice,
  Submission,
  AcademicDocument,
  RecommendedWebsite,
  SchoolSettings,
  User,
  SubmittedFile
} from './types';
import { StorageService } from './services/storage';
import { useAuth } from './context/AuthContext';
import { useAlert } from './context/AlertContext';

// Layout
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Pages
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { TaskManager } from './components/tasks/TaskManager';
import { DocumentCenter } from './components/documents/DocumentCenter';
import { WebsiteDirectory } from './components/websites/WebsiteDirectory';

// Modals
import { AuthModal } from './components/auth/AuthModal';
import { AssignTaskModal } from './components/tasks/AssignTaskModal';
import { CreateNoticeModal } from './components/tasks/CreateNoticeModal';
import { SubmissionModal } from './components/tasks/SubmissionModal';
import { AdminTrackingModal } from './components/tasks/AdminTrackingModal';
import { FilePreviewModal } from './components/tasks/FilePreviewModal';
import { SettingsModal } from './components/settings/SettingsModal';

export default function App() {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { showAlert, showToast } = useAlert();

  // App active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Core App Data States (persisted via StorageService)
  const [settings, setSettings] = useState<SchoolSettings>(StorageService.getSettings());
  const [tasks, setTasks] = useState<Task[]>(StorageService.getTasks());
  const [submissions, setSubmissions] = useState<Submission[]>(StorageService.getSubmissions());
  const [notices, setNotices] = useState<Notice[]>(StorageService.getNotices());
  const [documents, setDocuments] = useState<AcademicDocument[]>(StorageService.getDocuments());
  const [websites, setWebsites] = useState<RecommendedWebsite[]>(StorageService.getWebsites());
  const [allUsers, setAllUsers] = useState<User[]>(StorageService.getUsers());

  // Modal Open States
  const [isAssignTaskModalOpen, setIsAssignTaskModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [submissionTaskId, setSubmissionTaskId] = useState<string | null>(null);
  const [trackingTaskId, setTrackingTaskId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<SubmittedFile | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Cloud Sync state
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshAllData = () => {
    setSettings(StorageService.getSettings());
    setTasks(StorageService.getTasks());
    setSubmissions(StorageService.getSubmissions());
    setNotices(StorageService.getNotices());
    setDocuments(StorageService.getDocuments());
    setWebsites(StorageService.getWebsites());
    setAllUsers(StorageService.getUsers());
  };

  const handleManualSync = async (notify = true) => {
    setIsSyncing(true);
    try {
      const pushRes = await StorageService.syncAllNow();
      const pullRes = await StorageService.pullFromGoogleSheets();
      refreshAllData();

      if (notify) {
        if (pushRes.success || pullRes.success) {
          showToast('ซิงค์ข้อมูลกับ Google Sheets สำเร็จ', 'เชื่อมโยงและบันทึกข้อมูลเข้า Google Sheets เรียบร้อย', 'success');
        } else {
          showToast('แจ้งเตือนการเชื่อมต่อ', pushRes.message || 'โปรดตรวจสอบการวางโค้ดใน Apps Script', 'warning');
        }
      }
    } catch (e: any) {
      if (notify) {
        showToast('การเชื่อมต่อ', e.message || 'ไม่สามารถเชื่อมต่อได้', 'error');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial silent pull from Google Sheets on app load (enables any browser & machine to load latest data)
  useEffect(() => {
    StorageService.pullFromGoogleSheets().then((res) => {
      if (res.updated) {
        refreshAllData();
      }
    }).catch(() => {});
  }, []);

  // Sync user list on user updates
  useEffect(() => {
    setAllUsers(StorageService.getUsers());
  }, [currentUser]);

  // Security: Inactivity auto-logout after 15 minutes (15 * 60 * 1000 = 900,000 ms)
  useEffect(() => {
    if (!isAuthenticated) return;

    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    let timer: NodeJS.Timeout;

    const handleAutoLogout = () => {
      logout();
      showAlert({
        title: 'ระบบตัดการเชื่อมต่ออัตโนมัติ',
        text: 'เนื่องจากไม่มีการเคลื่อนไหวหน้าเว็บไซต์เกิน 15 นาที เพื่อความปลอดภัยของข้อมูลวิชาการ กรุณาเข้าสู่ระบบใหม่อีกครั้ง',
        icon: 'info',
        confirmButtonText: 'เข้าสู่ระบบใหม่',
        confirmButtonColor: '#7C3AED',
      });
    };

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(handleAutoLogout, INACTIVITY_TIMEOUT_MS);
    };

    // User interaction events that reset the activity timer
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true });
    });

    // Start initial timer
    resetTimer();

    return () => {
      clearTimeout(timer);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [isAuthenticated, logout, showAlert]);

  // Handlers for Tasks
  const handleSaveNewTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = StorageService.saveTask(taskData);
    setTasks(StorageService.getTasks());
    showToast('มอบหมายภาระงานสำเร็จ', `สร้างงาน "${created.title}" เรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateTask = (id: string, updates: Partial<Task>) => {
    StorageService.updateTask(id, updates);
    setTasks(StorageService.getTasks());
  };

  const handleDeleteTask = (taskId: string) => {
    StorageService.deleteTask(taskId);
    setTasks(StorageService.getTasks());
    setSubmissions(StorageService.getSubmissions());
  };

  // Handlers for Notices
  const handleSaveNewNotice = (noticeData: Omit<Notice, 'id' | 'createdAt' | 'updatedAt' | 'expiresAt'>) => {
    const created = StorageService.saveNotice(noticeData);
    setNotices(StorageService.getNotices());
    showToast('สร้างประกาศทั่วไปสำเร็จ', `ประกาศ "${created.title}" จะแสดงบนหน้าหลัก 15 วัน`, 'success');
  };

  // Handlers for Submissions
  const handleSaveSubmission = (submissionData: Omit<Submission, 'id' | 'createdAt' | 'updatedAt'>) => {
    StorageService.saveSubmission(submissionData);
    setSubmissions(StorageService.getSubmissions());
    showToast('ส่งภาระงานสำเร็จ', 'ส่งไฟล์เอกสารวิชาการเรียบร้อยแล้ว', 'success');
  };

  const handleDeleteSubmission = (submissionId: string) => {
    StorageService.deleteSubmission(submissionId);
    setSubmissions(StorageService.getSubmissions());
  };

  const handleUpdateSubmissionStatus = (
    submissionId: string,
    status: 'approved' | 'revision',
    remarks?: string
  ) => {
    StorageService.updateSubmissionStatus(submissionId, status, remarks);
    setSubmissions(StorageService.getSubmissions());
    showToast(
      status === 'approved' ? 'อนุมัติการส่งงานเรียบร้อย' : 'ส่งกลับให้แก้ไขเรียบร้อย',
      remarks,
      status === 'approved' ? 'success' : 'info'
    );
  };

  // Handlers for Documents
  const handleAddDocument = (docData: Omit<AcademicDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    StorageService.saveDocument(docData);
    setDocuments(StorageService.getDocuments());
  };

  const handleUpdateDocument = (id: string, updates: Partial<AcademicDocument>) => {
    StorageService.updateDocument(id, updates);
    setDocuments(StorageService.getDocuments());
  };

  const handleDeleteDocument = (id: string) => {
    StorageService.deleteDocument(id);
    setDocuments(StorageService.getDocuments());
  };

  // Handlers for Websites
  const handleAddWebsite = (siteData: Omit<RecommendedWebsite, 'id' | 'order' | 'createdAt' | 'updatedAt'>) => {
    StorageService.saveWebsite(siteData);
    setWebsites(StorageService.getWebsites());
  };

  const handleUpdateWebsite = (id: string, updates: Partial<RecommendedWebsite>) => {
    StorageService.updateWebsite(id, updates);
    setWebsites(StorageService.getWebsites());
  };

  const handleDeleteWebsite = (id: string) => {
    StorageService.deleteWebsite(id);
    setWebsites(StorageService.getWebsites());
  };

  const handleReorderWebsites = (reordered: RecommendedWebsite[]) => {
    StorageService.saveAllWebsites(reordered);
    setWebsites(reordered);
  };

  // Handlers for Settings & Members
  const handleUpdateSettings = (newSettings: Partial<SchoolSettings>) => {
    const updated = StorageService.saveSettings(newSettings);
    setSettings(updated);
  };

  const handleUpdateUserStatus = (userId: string, status: 'active' | 'rejected' | 'pending') => {
    StorageService.updateUserStatus(userId, status);
    setAllUsers(StorageService.getUsers());
  };

  const handleDeleteUser = (userId: string) => {
    StorageService.deleteUser(userId);
    setAllUsers(StorageService.getUsers());
  };

  // Active target task helpers
  const targetSubmissionTask = submissionTaskId ? tasks.find((t) => t.id === submissionTaskId) || null : null;
  const existingSubmissionForTarget =
    targetSubmissionTask && currentUser
      ? submissions.find((s) => s.taskId === targetSubmissionTask.id && s.userId === currentUser.id)
      : undefined;

  const targetTrackingTask = trackingTaskId ? tasks.find((t) => t.id === trackingTaskId) || null : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-['Prompt',sans-serif] flex flex-col">
      {/* Fixed Left Sidebar (Sticky/Fixed, does not scroll with content) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area (offset by sidebar width on lg screens) */}
      <div className="lg:pl-72 flex-1 flex flex-col min-h-screen">
        {/* Sticky Header */}
        <Header
          activeTab={activeTab}
          settings={settings}
          isSyncing={isSyncing}
          onSync={() => handleManualSync(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              tasks={tasks}
              notices={notices}
              submissions={submissions}
              allUsers={allUsers}
              settings={settings}
              onOpenAssignModal={() => setIsAssignTaskModalOpen(true)}
              onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
              onOpenSubmissionModal={(taskId) => setSubmissionTaskId(taskId)}
              onOpenAdminTracking={(taskId) => setTrackingTaskId(taskId)}
              onPreviewFile={(file) => setPreviewFile(file)}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManager
              tasks={tasks}
              submissions={submissions}
              allUsers={allUsers}
              onOpenAssignModal={() => setIsAssignTaskModalOpen(true)}
              onOpenNoticeModal={() => setIsNoticeModalOpen(true)}
              onOpenSubmissionModal={(taskId) => setSubmissionTaskId(taskId)}
              onOpenAdminTracking={(taskId) => setTrackingTaskId(taskId)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onDeleteSubmission={handleDeleteSubmission}
              onPreviewFile={(file) => setPreviewFile(file)}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentCenter
              documents={documents}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
              onPreviewFile={(file) => setPreviewFile(file)}
            />
          )}

          {activeTab === 'websites' && (
            <WebsiteDirectory
              websites={websites}
              onAddWebsite={handleAddWebsite}
              onUpdateWebsite={handleUpdateWebsite}
              onDeleteWebsite={handleDeleteWebsite}
              onReorderWebsites={handleReorderWebsites}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. Auth Modal (always shown when not authenticated, mandatory gatekeeper) */}
      <AuthModal
        isOpen={!isAuthenticated}
      />

      {/* 2. Admin Assign Task / Notice Modal */}
      <AssignTaskModal
        isOpen={isAssignTaskModalOpen}
        onClose={() => setIsAssignTaskModalOpen(false)}
        onSaveTask={handleSaveNewTask}
        onSaveNotice={handleSaveNewNotice}
        tasks={tasks}
      />

      {/* 3. Admin Create Notice Modal */}
      <CreateNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={() => setIsNoticeModalOpen(false)}
        tasks={tasks}
        onSave={handleSaveNewNotice}
      />

      {/* 4. Task Submission Modal */}
      <SubmissionModal
        isOpen={Boolean(submissionTaskId)}
        onClose={() => setSubmissionTaskId(null)}
        task={targetSubmissionTask}
        existingSubmission={existingSubmissionForTarget}
        onSave={handleSaveSubmission}
        onPreviewFile={(file) => setPreviewFile(file)}
      />

      {/* 5. Admin Task Tracking & Sheets Export Modal */}
      <AdminTrackingModal
        isOpen={Boolean(trackingTaskId)}
        onClose={() => setTrackingTaskId(null)}
        task={targetTrackingTask}
        submissions={submissions}
        allUsers={allUsers}
        onDeleteSubmission={handleDeleteSubmission}
        onUpdateSubmissionStatus={handleUpdateSubmissionStatus}
        onPreviewFile={(file) => setPreviewFile(file)}
      />

      {/* 6. File Preview Modal */}
      <FilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />

      {/* 7. Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        allUsers={allUsers}
        onUpdateUserStatus={handleUpdateUserStatus}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
