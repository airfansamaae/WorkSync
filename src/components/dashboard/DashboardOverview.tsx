import React, { useState } from 'react';
import { Task, Notice, Submission, User, SchoolSettings, SubmittedFile } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AnnouncementCarousel } from './AnnouncementCarousel';
import { CalendarWidget } from './CalendarWidget';
import { DueDateSidebar } from './DueDateSidebar';
import { DateDetailModal } from './DateDetailModal';

interface DashboardOverviewProps {
  tasks: Task[];
  notices: Notice[];
  submissions: Submission[];
  allUsers: User[];
  settings?: SchoolSettings;
  onOpenAssignModal?: () => void;
  onOpenNoticeModal?: () => void;
  onOpenSubmissionModal: (taskId: string) => void;
  onOpenAdminTracking: (taskId: string) => void;
  onPreviewFile?: (file: SubmittedFile) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  tasks,
  notices,
  submissions,
  allUsers,
  onOpenSubmissionModal,
  onOpenAdminTracking,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Selected date modal state
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);

  return (
    <div id="dashboard-overview" className="space-y-6">
      {/* 1. Announcement Banner Carousel */}
      <AnnouncementCarousel
        notices={notices}
        tasks={tasks}
        onOpenSubmissionForTask={onOpenSubmissionModal}
      />

      {/* Main Dashboard Split: Left Calendar + Right Due Date Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols on large screen): Calendar Widget */}
        <div className="lg:col-span-2">
          <CalendarWidget
            tasks={tasks}
            notices={notices}
            submissions={submissions}
            currentUserId={currentUser?.id}
            isAdmin={isAdmin}
            onSelectDate={(dmy) => setSelectedDateModal(dmy)}
          />
        </div>

        {/* Right (1 col on large screen): Due Date 30 Days Sidebar */}
        <div className="lg:col-span-1">
          <DueDateSidebar
            tasks={tasks}
            submissions={submissions}
            allUsers={allUsers}
            currentUserId={currentUser?.id}
            isAdmin={isAdmin}
            onOpenSubmissionForTask={onOpenSubmissionModal}
            onOpenAdminTracking={onOpenAdminTracking}
          />
        </div>
      </div>

      {/* Date Detail Modal */}
      {selectedDateModal && (
        <DateDetailModal
          isOpen={Boolean(selectedDateModal)}
          onClose={() => setSelectedDateModal(null)}
          selectedDate={selectedDateModal}
          tasks={tasks}
          notices={notices}
          submissions={submissions}
          allUsers={allUsers}
          currentUserId={currentUser?.id}
          isAdmin={isAdmin}
          onOpenSubmissionForTask={onOpenSubmissionModal}
          onOpenAdminTracking={onOpenAdminTracking}
        />
      )}
    </div>
  );
};
