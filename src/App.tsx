import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HomePortalCards } from './components/HomePortalCards';
import { VisitorPortal } from './components/visitor/VisitorPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { EmployeePortal } from './components/employee/EmployeePortal';
import { AuditPortal } from './components/audit/AuditPortal';

const MainContent: React.FC = () => {
  const { currentPortal } = useApp();

  return (
    <main className="w-full flex-1">
      {currentPortal === 'home' && <HomePortalCards />}
      {currentPortal === 'visitor' && <VisitorPortal />}
      {currentPortal === 'admin' && <AdminPortal />}
      {currentPortal === 'employee' && <EmployeePortal />}
      {currentPortal === 'audit' && <AuditPortal />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#0b1329] text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
}

