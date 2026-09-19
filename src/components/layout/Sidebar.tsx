import React from 'react';
import { ActiveTab, SchoolSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  FolderArchive,
  Globe,
  Settings,
  LogOut,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: SchoolSettings;
  onOpenSettings: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onOpenSettings,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, logout } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const menuItems: { id: ActiveTab; label: string; subLabel: string; icon: React.ElementType }[] = [
    {
      id: 'dashboard',
      label: 'หน้าหลัก',
      subLabel: 'ภาพรวม & ปฏิทิน',
      icon: LayoutDashboard,
    },
    {
      id: 'tasks',
      label: 'ระบบจัดการงาน',
      subLabel: 'มอบหมาย & ส่งภาระงาน',
      icon: ClipboardList,
    },
    {
      id: 'documents',
      label: 'ศูนย์เอกสาร',
      subLabel: 'เอกสารตัวอย่าง & คำสั่ง',
      icon: FolderArchive,
    },
    {
      id: 'websites',
      label: 'เว็บไซต์แนะนำ',
      subLabel: 'แหล่งเรียนรู้ & เว็บไซต์',
      icon: Globe,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Fixed Sidebar */}
      <aside
        id="app-fixed-sidebar"
        className={`fixed top-0 left-0 bottom-0 z-40 w-72 bg-white/95 backdrop-blur-md border-r border-slate-200/80 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* School / App Branding */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {settings.schoolLogoUrl ? (
              <img
                src={settings.schoolLogoUrl}
                alt="School Logo"
                className="w-10 h-10 rounded-xl object-cover border border-purple-100 shadow-xs shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-800 truncate leading-tight">
                {settings.schoolName}
              </h1>
              <p className="text-[11px] text-purple-600 font-medium truncate mt-0.5">
                {settings.departmentName}
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            เมนูหลัก (Navigation)
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-purple-50/80 text-purple-700 border border-purple-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{item.label}</p>
                    <p
                      className={`text-[11px] truncate leading-tight mt-0.5 ${
                        isActive ? 'text-purple-600/80' : 'text-slate-400'
                      }`}
                    >
                      {item.subLabel}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 transition-transform ${
                    isActive
                      ? 'text-purple-600 translate-x-0.5'
                      : 'text-slate-300 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* User Card & Action Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/60">
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-2.5">
            <div className="flex items-center gap-3">
              <img
                src={
                  currentUser?.avatarUrl ||
                  `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                    currentUser?.username || 'user'
                  )}`
                }
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {currentUser?.fullName || 'ผู้ใช้งาน'}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  {isAdmin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700">
                      <ShieldCheck className="w-3 h-3" />
                      ผู้ดูแลระบบ (Admin)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                      <UserCheck className="w-3 h-3" />
                      ครูผู้สอน (Member)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="sidebar-btn-settings"
              type="button"
              onClick={onOpenSettings}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium cursor-pointer transition-all shadow-xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>ตั้งค่า</span>
            </button>
            <button
              id="sidebar-btn-logout"
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-rose-200/60 bg-rose-50/50 hover:bg-rose-100/70 text-rose-700 text-xs font-medium cursor-pointer transition-all shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>ออก</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
