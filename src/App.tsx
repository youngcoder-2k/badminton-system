import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ToastContainer } from './components/common/ToastContainer';

// Views
import { DashboardView } from './views/DashboardView';
import { ClassesView } from './views/ClassesView';
import { ClassDetailView } from './views/ClassDetailView';
import { StudentsView } from './views/StudentsView';
import { StudentDetailView } from './views/StudentDetailView';
import { CoachesView } from './views/CoachesView';
import { ScheduleView } from './views/ScheduleView';
import { AttendanceView } from './views/AttendanceView';
import { PaymentsView } from './views/PaymentsView';
import { SettingsView } from './views/SettingsView';
import { FacilitiesView } from './views/FacilitiesView';
import { ShiftsView } from './views/ShiftsView';
import { ChatView } from './views/ChatView';

const MainContent: React.FC = () => {
  const {
    activeTab,
    selectedId,
    navigate,
    currentUser,
    classDetailSource,
    setClassesFacilityId,
    setClassesDate
  } = useApp();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'classes':
        if (selectedId) {
          return (
            <ClassDetailView
              classId={selectedId}
              onBack={() => {
                if (classDetailSource === 'schedule') {
                  navigate('schedule');
                } else {
                  if (selectedId.startsWith('CLS_')) {
                    const parts = selectedId.split('_');
                    if (parts.length >= 4) {
                      setClassesFacilityId(parts[1]);
                      setClassesDate(parts.slice(3).join('_'));
                    }
                  }
                  navigate('classes', null);
                }
              }}
            />
          );
        }
        return <ClassesView />;
      case 'students':
        if (selectedId) {
          return (
            <StudentDetailView
              studentId={selectedId}
              onBack={() => navigate('students', null)}
            />
          );
        }
        return <StudentsView />;
      case 'coaches':
        return <CoachesView />;
      case 'facilities':
        if (currentUser.role !== 'ADMIN') {
          return <DashboardView />;
        }
        return <FacilitiesView />;
      case 'shifts':
        if (currentUser.role !== 'ADMIN') {
          return <DashboardView />;
        }
        return <ShiftsView />;
      case 'schedule':
        return <ScheduleView />;
      case 'attendance':
        return <AttendanceView />;
      case 'payments':
        return <PaymentsView />;
      case 'chat':
        return <ChatView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased text-[#0F172A] font-sans">
      {/* App Shell with Sidebar & Main Area */}
      <div className="flex flex-1 min-h-screen w-full">
        {/* Left Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Desktop & Tablet Navbar */}
          <Navbar onOpenSearch={() => setIsSearchOpen(true)} />

          {/* Page View Container with responsive spacing across Mobile, Tablet, Laptop, and PC */}
          <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 pt-16 sm:pt-18 lg:pt-6 pb-24 lg:pb-8 max-w-full overflow-x-hidden">
            {renderView()}
          </main>
        </div>
      </div>

      {/* Mobile Top and Bottom Navigation Bars */}
      <MobileNav onOpenSearch={() => setIsSearchOpen(true)} />

      {/* Global Modals & Notifications */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <ToastContainer />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              ⚠️
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Đã xảy ra lỗi tải giao diện</h2>
              <p className="text-xs text-slate-500 mt-1">
                {this.state.error?.message || 'Có lỗi không mong muốn trong khi tải trang.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-900/10"
            >
              Tải lại ứng dụng
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
