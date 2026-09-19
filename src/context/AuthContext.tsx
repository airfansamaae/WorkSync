import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { StorageService } from '../services/storage';
import { SecurityService } from '../services/security';
import { useAlert } from './AlertContext';
import {
  googleSignIn,
  logoutGoogle,
  initAuth,
  getAccessToken
} from '../services/firebaseAuth';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  googleUser: FirebaseUser | null;
  isGoogleConnected: boolean;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<boolean>;
  signup: (fullName: string, username: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => void;
  updateCurrentUser: (updates: Partial<User>) => void;
  updateProfile: (updates: Partial<User>) => void;
  refreshUsers: () => void;
  allUsers: User[];
}

// Keep session in sessionStorage so every new tab/fresh link open starts at login page,
// while active in-tab session survives normal refreshes until 15min idle or logout.
const AUTH_SESSION_KEY = 'ACADEMIC_CURRENT_USER_SESSION';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { showAlert, showToast } = useAlert();

  const reloadUsers = () => {
    setAllUsers(StorageService.getUsers());
  };

  useEffect(() => {
    reloadUsers();

    // Remove legacy localStorage session so fresh visits always require login
    try {
      localStorage.removeItem(AUTH_SESSION_KEY);
      
      // Check session in sessionStorage (active tab session only)
      const savedSession = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const freshUser = StorageService.getUserById(parsed.id);
        if (freshUser && freshUser.status === 'active') {
          setCurrentUser(freshUser);
        } else {
          sessionStorage.removeItem(AUTH_SESSION_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }

    // Initialize Firebase Auth listener
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsGoogleConnected(Boolean(token));
      },
      () => {
        setGoogleUser(null);
        setIsGoogleConnected(false);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const login = async (username: string, password?: string): Promise<boolean> => {
    const trimmedUser = SecurityService.cleanText(username);
    const trimmedPass = password?.trim() || '';

    // Security: Check Rate Limit (Anti-Brute Force Protection)
    const rateLimit = SecurityService.checkLoginRateLimit(trimmedUser);
    if (rateLimit.isLocked) {
      showAlert({
        title: 'ระบบรักษาความปลอดภัย: บัญชีถูกระงับชั่วคราว',
        text: `มีการป้อนรหัสผ่านผิดเกินกำหนด เพื่อความปลอดภัยของระบบ กรุณารออีก ${rateLimit.remainingMinutes} นาทีก่อนลองใหม่อีกครั้ง`,
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#EF4444',
      });
      return false;
    }

    // Bypass check: Master Admin ID: Admin | Password: 456789
    if (trimmedUser.toLowerCase() === 'admin' && trimmedPass === '456789') {
      let adminUser = StorageService.getUserByUsername('Admin');
      if (!adminUser) {
        adminUser = StorageService.createUser({
          username: 'Admin',
          fullName: 'ผู้ดูแลระบบฝ่ายวิชาการ (Master Admin)',
          role: 'admin',
          status: 'active',
          password: '456789',
          department: 'ฝ่ายบริหารงานวิชาการ',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
      }
      SecurityService.resetAttempts(trimmedUser);
      setCurrentUser(adminUser);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(adminUser));
      showToast('เข้าสู่ระบบสำเร็จ', 'ยินดีต้อนรับผู้ดูแลระบบ (Admin)', 'success');
      return true;
    }

    // Normal User Lookup (first check local, if not found try pulling from Google Sheets)
    let user = StorageService.getUserByUsername(trimmedUser);
    if (!user) {
      await StorageService.pullFromGoogleSheets().catch(() => {});
      reloadUsers();
      user = StorageService.getUserByUsername(trimmedUser);
    }

    if (!user) {
      const attempt = SecurityService.recordFailedAttempt(trimmedUser);
      showAlert({
        title: 'ไม่พบบัญชีผู้ใช้งาน',
        text: attempt.isLockedNow
          ? `ป้อนรหัสผิดเกิน 5 ครั้ง ระบบระงับการเข้าสู่ระบบ 15 นาทีเพื่อความปลอดภัย`
          : `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${attempt.remainingAttempts} ครั้ง)`,
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#EF4444',
      });
      return false;
    }

    // Check Password
    if (user.password && user.password !== trimmedPass) {
      const attempt = SecurityService.recordFailedAttempt(trimmedUser);
      showAlert({
        title: 'รหัสผ่านไม่ถูกต้อง',
        text: attempt.isLockedNow
          ? `ป้อนรหัสผ่านผิดเกิน 5 ครั้ง ระบบระงับการเข้าสู่ระบบ 15 นาทีเพื่อความปลอดภัย`
          : `โปรดตรวจสอบรหัสผ่านของท่านอีกครั้ง (เหลือโอกาสลองอีก ${attempt.remainingAttempts} ครั้ง)`,
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#EF4444',
      });
      return false;
    }

    // Check Approval Status
    if (user.status === 'pending') {
      showAlert({
        title: 'อยู่ระหว่างรอการอนุมัติ',
        text: 'บัญชีของท่านได้รับการลงทะเบียนแล้ว แต่ยังรอผู้ดูแลระบบ (Admin) อนุมัติการเข้าใช้งาน โปรดติดต่อฝ่ายวิชาการ',
        icon: 'warning',
        confirmButtonText: 'รับทราบ',
        confirmButtonColor: '#F59E0B',
      });
      return false;
    }

    if (user.status === 'rejected') {
      showAlert({
        title: 'บัญชีไม่ได้รับการอนุมัติ',
        text: 'บัญชีของท่านถูกระงับหรือไม่ได้รับอนุญาตให้เข้าสู่ระบบ โปรดติดต่อฝ่ายวิชาการ',
        icon: 'error',
        confirmButtonText: 'ตกลง',
        confirmButtonColor: '#EF4444',
      });
      return false;
    }

    // Successful login: reset failed attempts
    SecurityService.resetAttempts(trimmedUser);
    setCurrentUser(user);
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    showToast('เข้าสู่ระบบสำเร็จ', `ยินดีต้อนรับคุณ ${user.fullName}`, 'success');
    return true;
  };

  const signup = async (fullName: string, username: string, password: string): Promise<boolean> => {
    const trimmedName = SecurityService.cleanText(fullName);
    const trimmedUser = SecurityService.cleanText(username);
    const trimmedPass = password.trim();

    if (!trimmedName || !trimmedUser || !trimmedPass) {
      showAlert({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกชื่อ-นามสกุล, ชื่อผู้ใช้ (User ID) และรหัสผ่านให้ครบทุกช่อง',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
      });
      return false;
    }

    // Security: Validate Password Requirements
    const passCheck = SecurityService.validatePassword(trimmedPass);
    if (!passCheck.isValid) {
      showAlert({
        title: 'รหัสผ่านไม่ปลอดภัยเพียงพอ',
        text: passCheck.message || 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร',
        icon: 'warning',
        confirmButtonText: 'แก้ไข',
      });
      return false;
    }

    // Check duplicate username
    const existing = StorageService.getUserByUsername(trimmedUser);
    if (existing) {
      showAlert({
        title: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว',
        text: 'กรุณาเลือกชื่อผู้ใช้ (User ID) อื่นสำหรับเข้าใช้งาน',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
      });
      return false;
    }

    // Create user with 'pending' status
    StorageService.createUser({
      username: trimmedUser,
      fullName: trimmedName,
      email: trimmedUser.includes('@') ? trimmedUser : undefined,
      password: trimmedPass,
      role: 'member',
      status: 'pending',
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(trimmedUser)}`,
    });

    reloadUsers();
    StorageService.syncAllNow().catch(() => {});

    // Show clear web alert upon registration as mandated
    showAlert({
      title: 'ลงทะเบียนสำเร็จ!',
      text: 'กรุณารอผู้ดูแลระบบ (Admin) อนุมัติการใช้งานก่อนเข้าสู่ระบบ ทางระบบจะแจ้งผลให้ท่านทราบ',
      icon: 'success',
      confirmButtonText: 'รับทราบ',
      confirmButtonColor: '#10B981',
    });

    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    try {
      const result = await googleSignIn();
      if (!result) return false;

      const { user } = result;
      setGoogleUser(user);
      setIsGoogleConnected(true);

      // Match or create matching local user
      let matchedUser = StorageService.getUsers().find(
        (u) => u.email === user.email || u.fullName === user.displayName
      );

      if (!matchedUser) {
        // Auto register as teacher member or associate with current
        matchedUser = StorageService.createUser({
          username: user.email?.split('@')[0] || `user_${Date.now()}`,
          fullName: user.displayName || 'อาจารย์ผู้สอน',
          role: 'member',
          status: 'active',
          email: user.email || undefined,
          avatarUrl: user.photoURL || undefined,
        });
      }

      setCurrentUser(matchedUser);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(matchedUser));
      reloadUsers();

      showToast(
        'เชื่อมต่อ Google Workspace สำเร็จ',
        `พร้อมใช้งาน Google Drive & Google Sheets แล้ว (${user.displayName})`,
        'success'
      );
      return true;
    } catch (e: any) {
      console.error('Google sign in error:', e);
      showAlert({
        title: 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ',
        text: e.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
      });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    logoutGoogle().catch(() => {});
    setGoogleUser(null);
    setIsGoogleConnected(false);
    showToast('ออกจากระบบเรียบร้อย', 'แล้วพบกันใหม่ครับ', 'info');
  };

  const updateCurrentUser = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = StorageService.updateUser(currentUser.id, updates);
    if (updated) {
      setCurrentUser(updated);
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
      reloadUsers();
      showToast('บันทึกข้อมูลเรียบร้อย', 'ข้อมูลโปรไฟล์ของท่านได้รับการปรับปรุงแล้ว', 'success');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        googleUser,
        isGoogleConnected,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        updateCurrentUser,
        updateProfile: updateCurrentUser,
        refreshUsers: reloadUsers,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
