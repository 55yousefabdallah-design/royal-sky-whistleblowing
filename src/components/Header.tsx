import React from 'react';
import { useApp } from '../context/AppContext';
import { Building2, Globe, Shield, ArrowLeft, ArrowRight, LogOut, CheckCircle2 } from 'lucide-react';

export const Header: React.FC = () => {
  const { language, setLanguage, currentPortal, setCurrentPortal, currentUser, logout } = useApp();
  const isAr = language === 'ar';

  return (
    <header className="w-full border-b border-slate-800/80 bg-[#080e21]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div 
          onClick={() => setCurrentPortal('home')}
          className="flex items-center gap-3.5 cursor-pointer group"
          id="brand-logo-button"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wide text-white group-hover:text-amber-400 transition-colors">
                Royal Sky Group
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {isAr ? 'الامتثال' : 'Compliance'}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {isAr ? 'نظام البلاغات والشكاوى السرية' : 'Whistleblowing & Reporting System'}
            </span>
          </div>
        </div>

        {/* Center / Navigation state */}
        {currentPortal !== 'home' && (
          <button
            onClick={() => setCurrentPortal('home')}
            className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-amber-400 bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors"
            id="nav-back-to-portals"
          >
            {isAr ? (
              <>
                <ArrowRight className="w-3.5 h-3.5" />
                العودة إلى البوابات الرئيسية
              </>
            ) : (
              <>
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All Portals
              </>
            )}
          </button>
        )}

        {/* Right Actions: User info & Language Toggle */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1 rounded-lg text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex flex-col text-right">
                <span className="font-semibold text-slate-200">
                  {currentUser.name || currentUser.alias}
                </span>
                <span className="text-[10px] text-amber-400 capitalize">
                  {currentUser.role === 'admin'
                    ? (isAr ? 'مدير النظام' : 'Administrator')
                    : currentUser.role === 'employee'
                    ? (isAr ? 'موظف مختص' : 'Staff Employee')
                    : currentUser.role === 'audit'
                    ? (isAr ? 'مدقق حسابات' : 'Auditor (Read-Only)')
                    : (isAr ? 'مبلّغ سري' : 'Anonymous Reporter')}
                </span>
              </div>
              <button
                onClick={logout}
                title={isAr ? 'تسجيل الخروج' : 'Log Out'}
                className="p-1 hover:text-rose-400 text-slate-400 transition-colors mr-1"
                id="header-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
            id="language-switcher-button"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>{language === 'ar' ? 'English' : 'العربية 🇸🇦'}</span>
          </button>
        </div>

      </div>
    </header>
  );
};
