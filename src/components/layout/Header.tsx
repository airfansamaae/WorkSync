import React from 'react';
import { ActiveTab, SchoolSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Settings,
  LogOut,
  Calendar,
  Sparkles,
  HardDrive,
  RefreshCw
} from 'lucide-react';

interface HeaderProps {
  activeTab?: ActiveTab;
  settings: SchoolSettings;
  isSyncing?: boolean;
  onSync?: () => void;
  onOpenSettings: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  isSyncing,
  onSync,
  onOpenSettings,
  onToggleMobileMenu,
}) => {
  const { currentUser, isGoogleConnected, googleUser, loginWithGoogle, logout } = useAuth();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-4 py-2 flex items-center justify-between transition-all"
    >
      {/* Left: Mobile Toggle & Compact School/Term Tag */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          id="btn-mobile-menu"
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-none">
            {settings.schoolName}
          </span>
          <span className="text-slate-300">•</span>
          <span className="flex items-center gap-1 text-purple-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            ภาคเรียนที่ {settings.semester}/{settings.academicYear}
          </span>
        </div>
      </div>

      {/* Right: Workspace badge + Avatar & Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Instant Cloud Sync Button */}
        {onSync && (
          <button
            id="header-btn-cloud-sync"
            type="button"
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50/80 hover:bg-purple-100 text-purple-700 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 shadow-2xs"
            title="คลิกเพื่อเชื่อมโยงและซิงค์ข้อมูลทั้งหมดเข้า Google Sheets ทันที"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-purple-600' : 'text-purple-600'}`} />
            <span className="hidden sm:inline">{isSyncing ? 'กำลังซิงค์...' : 'ซิงค์ Google Sheets'}</span>
            <span className="sm:hidden">{isSyncing ? 'ซิงค์...' : 'ซิงค์'}</span>
          </button>
        )}

        {/* Google Workspace Connection Pill */}
        {isGoogleConnected ? (
          <div
            title={`เชื่อมต่อ Google Workspace แล้ว: ${googleUser?.email || ''}`}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Drive & Sheets พร้อมใช้งาน</span>
          </div>
        ) : (
          <button
            id="header-btn-connect-google"
            type="button"
            onClick={() => loginWithGoogle()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-medium transition-all cursor-pointer"
            title="คลิกเพื่อเชื่อมต่อ Google Drive & Sheets"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden md:inline">เชื่อมต่อ Google Drive & Sheets</span>
            <span className="md:hidden">ต่อ Google</span>
          </button>
        )}

        {/* Small Profile Avatar with Settings & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <button
            id="header-avatar-btn"
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group"
            title="เปิดหน้าตั้งค่า"
          >
            <img
              src={
                currentUser?.avatarUrl ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                  currentUser?.username || 'user'
                )}`
              }
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-purple-200 group-hover:border-purple-400 shadow-xs"
            />
          </button>

          {/* Quick Settings Icon Button */}
          <button
            id="header-btn-quick-settings"
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
            title="ตั้งค่าระบบ"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quick Logout Icon Button */}
          <button
            id="header-btn-quick-logout"
            type="button"
            onClick={logout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
