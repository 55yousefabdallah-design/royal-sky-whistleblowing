import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileText, 
  Lock, 
  UserCheck, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft,
  Eye
} from 'lucide-react';

export const HomePortalCards: React.FC = () => {
  const { language, setCurrentPortal, complaints, transferRequests, employees } = useApp();
  const isAr = language === 'ar';

  // Metrics to show useful subtle badge counters on cards
  const newComplaintsCount = complaints.filter(c => c.status === 'new').length;
  const pendingTransfersCount = transferRequests.filter(t => t.status === 'pending').length;
  const activeAssignedCount = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const totalEmployeesCount = employees.length;

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">

        {/* Security & Confidentiality Pill Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-300 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="tracking-wide">
              {isAr ? 'سري • آمن ومشفر • مجهول الهوية بالكامل' : 'Confidential • Secure • Anonymous'}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            {isAr ? (
              <>
                بلّغ عن أي مخالفة <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">بأمان وسرية تامة</span>
              </>
            ) : (
              <>
                Report a Concern <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Safely and Confidentially</span>
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
            {isAr
              ? 'توفر مجموعة رويال سكاي قناة مشفرة وآمنة وسرية للإبلاغ عن أي مخالفات مالية أو إدارية أو سلوك غير مهني. يمكنك تقديم بلاغك وتتبعه بهوية وهمية دون الحاجة للكشف عن شخصيتك نهائياً.'
              : 'Royal Sky Group provides a secure, confidential channel to report violations, misconduct, or unethical behavior. You may choose to remain completely anonymous.'}
          </p>
        </div>

        {/* 4 Portals Grid - Exactly matching the 4 icons in the screenshot and prompt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">

          {/* 1. Submit / Track Complaint (الزائر) */}
          <div
            id="portal-card-visitor"
            onClick={() => setCurrentPortal('visitor')}
            className="group relative bg-[#101830]/90 hover:bg-[#152042] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <FileText className="w-8 h-8" />
            </div>

            <div className="mb-2">
              <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 mb-1">
                {isAr ? '100% مجهول الهوية' : '100% Anonymous'}
              </span>
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {isAr ? 'تقديم / متابعة شكوى' : 'Submit / Track Complaint'}
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-grow">
              {isAr
                ? 'قدم شكوى جديدة برقم تذكرة مشفر أو تابع شكواك السابقة بالاسم والكود الوهميين وشاهد الحلول المقدمة.'
                : 'Submit a new complaint or track an existing one anonymously with your chosen alias and secret code.'}
            </p>

            <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
              <span>{isAr ? 'دخول بوابة الزائر' : 'Enter Portal'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 2. Administration (الادمن) */}
          <div
            id="portal-card-admin"
            onClick={() => setCurrentPortal('admin')}
            className="group relative bg-[#101830]/90 hover:bg-[#152042] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <Lock className="w-8 h-8" />
            </div>

            <div className="mb-2">
              {newComplaintsCount > 0 && (
                <span className="inline-block text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 mb-1 animate-pulse">
                  {isAr ? `${newComplaintsCount} شكاوى جديدة` : `${newComplaintsCount} New Pending`}
                </span>
              )}
              {newComplaintsCount === 0 && (
                <span className="inline-block text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 mb-1">
                  {isAr ? `${totalEmployeesCount} موظف مسجل` : `${totalEmployeesCount} Staff Members`}
                </span>
              )}
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {isAr ? 'لوحة الإدارة' : 'Administration'}
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-grow">
              {isAr
                ? 'إدارة بيانات الموظفين وأدوارهم، استقبال الشكاوى وتوجيهها للموظف المختص، ومتابعة الحلول والداشبورد.'
                : 'Manage staff & roles, review incoming reports, dispatch tickets to employees, and monitor live dashboard analytics.'}
            </p>

            <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
              <span>{isAr ? 'دخول لوحة الإدارة' : 'Enter Portal'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 3. Employee (الموظف) */}
          <div
            id="portal-card-employee"
            onClick={() => setCurrentPortal('employee')}
            className="group relative bg-[#101830]/90 hover:bg-[#152042] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <UserCheck className="w-8 h-8" />
            </div>

            <div className="mb-2">
              {pendingTransfersCount > 0 ? (
                <span className="inline-block text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mb-1">
                  {isAr ? `${pendingTransfersCount} طلب تحويل معلق` : `${pendingTransfersCount} Transfer Request`}
                </span>
              ) : (
                <span className="inline-block text-[11px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 mb-1">
                  {isAr ? `${activeAssignedCount} شكوى تحت المعالجة` : `${activeAssignedCount} Active Cases`}
                </span>
              )}
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {isAr ? 'بوابة الموظف' : 'Employee'}
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-grow">
              {isAr
                ? 'استعراض الشكاوى المحالة إليك، حلها وإرفاق الملاحظات والملفات، تحويل المهام للزملاء، وتغيير كودك الشخصي.'
                : 'View assigned complaints, submit resolutions with files, transfer tickets to colleagues, and manage your passcode.'}
            </p>

            <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
              <span>{isAr ? 'دخول بوابة الموظف' : 'Enter Portal'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </div>
          </div>

          {/* 4. Audit (الاوديت) */}
          <div
            id="portal-card-audit"
            onClick={() => setCurrentPortal('audit')}
            className="group relative bg-[#101830]/90 hover:bg-[#152042] border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
              <BarChart3 className="w-8 h-8" />
            </div>

            <div className="mb-2">
              <span className="inline-block text-[11px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 mb-1 flex items-center gap-1 justify-center">
                <Eye className="w-3 h-3 text-amber-400" />
                {isAr ? 'صلاحيات قراءة وتدقيق فقط' : 'Read-Only Oversight'}
              </span>
              <h2 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {isAr ? 'بوابة التدقيق' : 'Audit'}
              </h2>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6 flex-grow">
              {isAr
                ? 'متابعة شاملة لجميع مراحل ودورات الشكاوى وسير العمل، فحص مؤشرات الأداء، وتحميل التقارير الرقابية الرسمية.'
                : 'Read-only oversight dashboard, tracking complaint lifecycle, investigating audit trails, and exporting compliance reports.'}
            </p>

            <div className="w-full pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-400 group-hover:gap-2.5 transition-all">
              <span>{isAr ? 'دخول لوحة التدقيق' : 'Enter Portal'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </div>
          </div>

        </div>

      </div>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 mt-12">
        <p>© 2026 Royal Sky Group. All reports are strictly confidential, protected by end-to-end encryption.</p>
      </footer>
    </div>
  );
};
