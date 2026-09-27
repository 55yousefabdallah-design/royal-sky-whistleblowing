import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint, Employee } from '../../types';
import { DEPARTMENTS } from '../../data/mockData';
import { FileAttachmentViewer } from '../common/FileAttachmentViewer';
import { calculateResolutionDuration, evaluateSLA, computeAverageResolutionHours } from '../../utils/duration';
import { ResolutionDurationReport } from '../admin/ResolutionDurationReport';
import { 
  BarChart3, 
  Eye, 
  Download, 
  FileText, 
  Printer, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Layers, 
  Lock,
  Building,
  User,
  Calendar,
  X,
  FileSpreadsheet,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const AuditPortal: React.FC = () => {
  const { language, setCurrentPortal, complaints, employees, currentUser, setCurrentUser } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'oversight' | 'duration_report'>('oversight');
  const [auditCodeInput, setAuditCodeInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'assigned' | 'in_progress' | 'resolved'>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const [selectedAuditComplaint, setSelectedAuditComplaint] = useState<Complaint | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const isAuditorAuthenticated = currentUser?.role === 'audit';

  const handleAuditLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const auditor = employees.find(
      e => e.role === 'audit' && e.code.trim().toLowerCase() === auditCodeInput.trim().toLowerCase()
    );

    if (auditor) {
      setCurrentUser({
        role: 'audit',
        id: auditor.id,
        name: auditor.name,
        code: auditor.code,
        department: auditor.department,
      });
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.assignedToEmployeeName && c.assignedToEmployeeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'in_progress'
        ? c.status === 'assigned' || c.status === 'in_progress'
        : c.status === statusFilter;

    const matchesDept = departmentFilter === 'all' ? true : c.category === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const handleExportCSV = () => {
    const headers = isAr
      ? 'رقم البلاغ,الموضوع,الإدارة,درجة الأهمية,الحالة الحالية,الموظف المعني,تاريخ التقديم,تاريخ الحل,المدة المستغرقة,مؤشر سرعة الاستجابة SLA,ملاحظات وإجراءات الحل\n'
      : 'Ticket ID,Title,Department,Urgency,Current Status,Assigned Officer,Submitted Date,Resolved Date,Resolution Duration,SLA Performance,Resolution Notes\n';

    const rows = filteredComplaints.map(c => {
      const dur = calculateResolutionDuration(c.submittedAt, c.resolvedAt, isAr);
      const sla = evaluateSLA(c.submittedAt, c.resolvedAt, isAr);
      return `"${c.id}","${c.title.replace(/"/g, '""')}","${c.category}","${c.urgency}","${c.status}","${c.assignedToEmployeeName || (isAr ? 'غير مسند' : 'Unassigned')}","${new Date(c.submittedAt).toLocaleString()}","${c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : '-'}","${dur.formatted}","${sla.status}","${(c.resolutionNotes || '').replace(/"/g, '""')}"`;
    }).join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `royal_sky_audit_oversight_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStageIndicator = (complaint: Complaint) => {
    if (complaint.status === 'new') {
      return {
        step: 1,
        title: isAr ? 'المرحلة 1: استلام البلاغ في الصندوق' : 'Stage 1: Report Ingested',
        desc: isAr ? 'في انتظار فحص وتوجيه إدارة الامتثال' : 'Pending dispatch by Compliance Admin',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    }
    if (complaint.status === 'assigned' || complaint.status === 'in_progress') {
      return {
        step: 2,
        title: isAr ? `المرحلة 2: قيد التحقيق مع [${complaint.assignedToEmployeeName}]` : `Stage 2: Investigation with [${complaint.assignedToEmployeeName}]`,
        desc: isAr ? 'جاري فحص المستندات والتحقيق الميداني' : 'Evidence collection & investigation',
        color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      };
    }
    return {
      step: 3,
      title: isAr ? 'المرحلة 3: تم الحل والتوثيق الرقابي' : 'Stage 3: Resolved & Documented',
      desc: isAr ? `أغلق بواسطة ${complaint.resolvedByEmployeeName}` : `Closed by ${complaint.resolvedByEmployeeName}`,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    };
  };

  if (!isAuditorAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {isAr ? 'تسجيل دخول بوابة التدقيق (Audit)' : 'Audit Portal Login'}
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            {isAr
              ? 'بوابة المراجعة والتدقيق للاطلاع الرقابي الشامل وتحميل التقارير (صلاحيات قراءة فقط دون تعديل)'
              : 'Oversight dashboard for auditing complaint lifecycles and exporting reports (Read-only)'}
          </p>

          <form onSubmit={handleAuditLogin} className="space-y-4">
            <div>
              <input
                type="text"
                required
                value={auditCodeInput}
                onChange={e => {
                  setAuditCodeInput(e.target.value);
                  setLoginError(false);
                }}
                placeholder={isAr ? 'أدخل كود المدقق (مثال: AUD-200)' : 'Auditor Code (e.g. AUD-200)'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none text-center font-mono"
                id="input-audit-code"
              />
              {loginError && (
                <p className="text-xs text-rose-400 mt-1.5">
                  {isAr ? 'كود الدخول غير صحيح، يرجى مراجعة إدارة الامتثال.' : 'Invalid auditor code, please contact the compliance office.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition-colors shadow"
              id="btn-audit-login-submit"
            >
              {isAr ? 'دخول لوحة التدقيق' : 'Access Audit Oversight'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => setCurrentPortal('home')}
              className="text-xs text-slate-400 hover:text-white mt-1"
            >
              {isAr ? '← العودة للبوابات الرئيسية' : '← Back to Portals'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Banner with Strict Read-Only Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <button
            onClick={() => setCurrentPortal('home')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors mb-2"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white">
              {isAr ? 'بوابة المراجعة والتدقيق والرقابة العامة' : 'Internal Audit & Oversight Portal'}
            </h1>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? 'صلاحيات اطلاع وقراءة فقط (Read-Only)' : 'Strict Read-Only Oversight'}</span>
            </div>
          </div>
        </div>

        {/* Action Downloads */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
            id="btn-print-audit-report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'طباعة تقرير التدقيق' : 'Printable Dossier'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
            id="btn-download-audit-csv"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل البيانات (Excel / CSV)' : 'Download CSV Report'}</span>
          </button>
        </div>
      </div>

      {/* Notice Banner ("وده بيشوف بس الحالات بتاعت الشكوي وكل شكوي واقفه فين و التقارير ويقدر يحملهم لاكن ميضيفش حاجه") */}
      <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4 mb-6 text-xs text-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <span>
            {isAr
              ? 'تنبيه تدقيق: في هذه البوابة يمكنك تتبع أين تقف كل شكوى بالتفصيل وفحص مراحل التحقيق والاطلاع على الإجراءات المتخذة وتقارير مدد الإنجاز، دون إمكانية تعديل أو إضافة أي بيانات.'
              : 'Audit Compliance Mode: You have complete oversight to track where each ticket stands, view employee resolutions, and download audit sheets. Modification permissions are locked.'}
          </span>
        </div>
        <span className="font-mono text-purple-300 font-bold bg-purple-900/50 px-2.5 py-1 rounded-lg">
          {currentUser?.name}
        </span>
      </div>

      {/* Audit Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('oversight')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'oversight'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
          id="tab-audit-oversight"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? 'سجل الرقابة وتتبع الشكاوى' : 'Complaints & Pipeline Oversight'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-950 text-purple-200">
            {complaints.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('duration_report')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'duration_report'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
          id="tab-audit-duration"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{isAr ? 'تقرير المدة المستغرقة للحل (SLA)' : 'Resolution Duration & SLA Report'}</span>
        </button>
      </div>

      {activeTab === 'duration_report' ? (
        <div className="mb-8">
          <ResolutionDurationReport
            complaints={complaints}
            employees={employees}
            isAr={isAr}
            onInspectComplaint={complaint => setSelectedAuditComplaint(complaint)}
          />
        </div>
      ) : (
        <>

      {/* Search and Filters */}
      <div className="bg-[#101830] border border-slate-800 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم التذكرة أو الموضوع أو الموظف المسند...' : 'Search ticket, subject, or assigned staff...'}
            className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-lg pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            id="input-audit-search"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="new">{isAr ? 'جديدة (بانتظار الإسناد)' : 'New'}</option>
            <option value="in_progress">{isAr ? 'قيد التحقيق والمعالجة' : 'Under Investigation'}</option>
            <option value="resolved">{isAr ? 'تم الحل والإغلاق' : 'Resolved'}</option>
          </select>

          <select
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 outline-none"
          >
            <option value="all">{isAr ? 'جميع الإدارات' : 'All Departments'}</option>
            {DEPARTMENTS.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Pipeline & Complaints Table ("كل شكوي واقفه فين") */}
      <div className="bg-[#101830] border border-slate-800 rounded-2xl overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white">
            {isAr ? `سجل تدقيق الشكاوى ومراحلها (${filteredComplaints.length})` : `Audit Register & Lifecycle Stages (${filteredComplaints.length})`}
          </span>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'اضغط على أي شكوى للاطلاع على ملف التحقيق الكامل' : 'Click any ticket for full audit dossier'}
          </span>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-xs">{isAr ? 'لا توجد شكاوى مطابقة لمعايير البحث' : 'No records found'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredComplaints.map(item => {
              const stage = getStageIndicator(item);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAuditComplaint(item)}
                  className="p-5 hover:bg-slate-900/40 cursor-pointer transition-colors"
                  id={`audit-row-${item.id}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {item.id}
                        </span>

                        <span className="text-xs text-slate-400">{item.category}</span>

                        <span className="text-xs text-slate-500">
                          {new Date(item.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>

                      {/* STAGE TRACKER: "كل شكوي واقفه فين" */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${stage.color} mb-2`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{stage.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({stage.desc})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                        <div>
                          {isAr ? 'الموظف المسؤول الحالي:' : 'Assigned Officer:'}{' '}
                          <strong className="text-slate-200">
                            {item.assignedToEmployeeName || (isAr ? 'غير مسند بعد' : 'Unassigned')}
                          </strong>
                        </div>

                        {item.resolvedAt && (
                          <div className="text-emerald-400 font-medium">
                            {isAr ? 'تاريخ الإغلاق:' : 'Resolved:'}{' '}
                            {new Date(item.resolvedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right View Details Pill */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-purple-400 font-semibold flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isAr ? 'فحص السجل الرقابي' : 'View Audit File'}</span>
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* AUDIT COMPLAINT DETAIL MODAL */}
      {selectedAuditComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400">{selectedAuditComplaint.id}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  {isAr ? 'ملف رقابي - للقراءة فقط' : 'Audit Inspection File - Read Only'}
                </span>
              </div>
              <button onClick={() => setSelectedAuditComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-base font-bold text-white mb-2">{selectedAuditComplaint.title}</h2>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 mb-4 leading-relaxed whitespace-pre-wrap">
              {selectedAuditComplaint.description}
            </div>

            {/* VISITOR ATTACHMENTS */}
            {selectedAuditComplaint.attachments && selectedAuditComplaint.attachments.length > 0 && (
              <div className="mb-4">
                <FileAttachmentViewer
                  attachments={selectedAuditComplaint.attachments}
                  title={isAr ? 'مستندات وأدلة مقدم البلاغ' : 'Complainant Evidence Attachments'}
                  isAr={isAr}
                  accentColor="amber"
                />
              </div>
            )}

            {/* VISITOR OBJECTION / FEEDBACK */}
            {selectedAuditComplaint.visitorFeedback && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-rose-400 mb-1">
                  <RotateCcw className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{isAr ? 'اعتراض ورد من مقدم الشكوى (أعيد فتحها للمراجعة):' : 'Complainant Rebuttal / Objection:'}</span>
                </div>
                <p className="text-rose-100 leading-relaxed bg-slate-950/80 p-2.5 rounded-lg border border-rose-500/20 whitespace-pre-wrap mb-1">
                  "{selectedAuditComplaint.visitorFeedback}"
                </p>
                {selectedAuditComplaint.visitorFeedbackAt && (
                  <span className="text-[10px] text-slate-500 block">
                    {isAr ? 'بتاريخ:' : 'Date:'} {new Date(selectedAuditComplaint.visitorFeedbackAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                )}
              </div>
            )}

            {/* Current Stage Details */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-xs mb-4">
              <span className="text-slate-400 block mb-1 font-bold">{isAr ? 'الموقع الحالي للشكوى ومسؤول التحقيق:' : 'Current Station & Officer:'}</span>
              <p className="text-amber-400 font-semibold">
                {selectedAuditComplaint.assignedToEmployeeName || (isAr ? 'في انتظار توجيه مدير الامتثال' : 'Pending dispatch')}
              </p>
            </div>

            {/* If Resolved: View Resolution */}
            {selectedAuditComplaint.resolutionNotes && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-xs mb-5">
                <span className="font-bold text-emerald-400 block mb-1">
                  {isAr ? 'الحل الموثق من الموظف المسؤول:' : 'Documented Resolution by Staff:'}
                </span>
                <p className="text-emerald-100 leading-relaxed mb-3 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-500/20 whitespace-pre-wrap">
                  {selectedAuditComplaint.resolutionNotes}
                </p>

                {/* RESOLUTION ATTACHMENTS */}
                {selectedAuditComplaint.resolutionAttachments && selectedAuditComplaint.resolutionAttachments.length > 0 && (
                  <div className="mb-3 pt-2 border-t border-emerald-500/20">
                    <FileAttachmentViewer
                      attachments={selectedAuditComplaint.resolutionAttachments}
                      title={isAr ? 'مستندات وتقارير الحل المرفقة من الموظف' : 'Staff Resolution Attachments'}
                      isAr={isAr}
                      accentColor="emerald"
                    />
                  </div>
                )}

                <div className="text-[10px] text-slate-400 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2">
                  <span>{isAr ? 'الموظف المنفذ:' : 'Resolved by:'} <strong className="text-emerald-300">{selectedAuditComplaint.resolvedByEmployeeName}</strong></span>
                  {selectedAuditComplaint.resolvedAt && (
                    <span className="flex items-center gap-2">
                      <span>{isAr ? 'تاريخ الحل:' : 'Resolved Date:'} {new Date(selectedAuditComplaint.resolvedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {calculateResolutionDuration(selectedAuditComplaint.submittedAt, selectedAuditComplaint.resolvedAt, isAr).formatted}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Audit Timeline */}
            <div className="mb-5">
              <span className="text-xs font-bold text-slate-300 block mb-2 uppercase tracking-wider">
                {isAr ? 'مسار وسجل التدقيق الزمني الكامل:' : 'Full Audit Trail Timeline:'}
              </span>
              <div className="space-y-2">
                {selectedAuditComplaint.timeline.map((ev, idx) => (
                  <div key={ev.id || idx} className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span>{ev.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(ev.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mb-1">{ev.description}</p>
                    <span className="text-purple-400 text-[10px] font-medium">{ev.actorName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedAuditComplaint(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE DOSSIER MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">ROYAL SKY GROUP</h2>
                <p className="text-xs font-bold text-slate-600">WHISTLEBLOWING & COMPLIANCE INTERNAL AUDIT DOSSIER</p>
                <p className="text-xs text-slate-500 mt-1">تقرير التدقيق والمراجعة الداخلي المعتمد للشكاوى والبلاغات</p>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold">تاريخ التقرير: {new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</p>
                <p className="text-slate-500">المدقق: {currentUser?.name}</p>
              </div>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-4 gap-4 mb-6 text-center text-xs">
              <div className="p-3 bg-slate-100 rounded-lg">
                <span className="block text-slate-500">إجمالي البلاغات</span>
                <span className="text-lg font-bold">{complaints.length}</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <span className="block text-slate-500">جديدة بانتظار الإسناد</span>
                <span className="text-lg font-bold">{complaints.filter(c => c.status === 'new').length}</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <span className="block text-slate-500">قيد التحقيق</span>
                <span className="text-lg font-bold">{complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length}</span>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <span className="block text-slate-500">تم حلها بنجاح</span>
                <span className="text-lg font-bold text-emerald-700">{complaints.filter(c => c.status === 'resolved').length}</span>
              </div>
            </div>

            {/* List */}
            <table className="w-full text-xs text-right mb-6 border-collapse">
              <thead>
                <tr className="border-b border-slate-300 font-bold bg-slate-100">
                  <th className="p-2">رقم التذكرة</th>
                  <th className="p-2">الموضوع</th>
                  <th className="p-2">الإدارة</th>
                  <th className="p-2">الحالة</th>
                  <th className="p-2">الموظف المعني</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(c => (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="p-2 font-mono font-bold">{c.id}</td>
                    <td className="p-2 font-semibold">{c.title}</td>
                    <td className="p-2 text-slate-600">{c.category}</td>
                    <td className="p-2">
                      {c.status === 'resolved' ? 'تم الحل' : c.status === 'new' ? 'جديدة' : 'قيد التحقيق'}
                    </td>
                    <td className="p-2 font-semibold">{c.assignedToEmployeeName || 'غير مسند'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Print & Close actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-300">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-700"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة التقرير (Print)' : 'Print Document'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
