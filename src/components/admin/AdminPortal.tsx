import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint, Employee } from '../../types';
import { DEPARTMENTS, downloadEmployeeTemplateCSV } from '../../data/mockData';
import { BulkEmployeeImportModal } from './BulkEmployeeImportModal';
import { FileAttachmentViewer } from '../common/FileAttachmentViewer';
import { calculateResolutionDuration, evaluateSLA, computeAverageResolutionHours } from '../../utils/duration';
import { 
  Lock, 
  Users, 
  FileText, 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowRight, 
  ArrowLeft, 
  Send, 
  UserCheck, 
  Edit3, 
  Trash2, 
  Download, 
  Eye, 
  X, 
  Sparkles, 
  Upload, 
  ChevronRight,
  ShieldAlert,
  Building,
  Check,
  Calendar,
  Layers,
  FileSpreadsheet,
  RotateCcw,
  Copy,
  ShieldCheck,
  Inbox
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const { 
    language, 
    setCurrentPortal, 
    complaints, 
    employees, 
    adminAssignComplaint, 
    addEmployee, 
    updateEmployee, 
    deleteEmployee,
    wipeData,
    currentUser, 
    setCurrentUser 
  } = useApp();

  const isAr = language === 'ar';

  // Active tab in Admin
  const [activeTab, setActiveTab] = useState<'dashboard' | 'complaints' | 'employees' | 'duration_report'>('dashboard');

  // Login state for admin
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Complaints filter state
  const [complaintSearch, setComplaintSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'assigned' | 'in_progress' | 'resolved'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Employee filter state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeRoleFilter, setEmployeeRoleFilter] = useState<'all' | 'employee' | 'admin' | 'audit'>('all');

  // Modal states
  const [assignModalComplaint, setAssignModalComplaint] = useState<Complaint | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');

  const [viewComplaintDetail, setViewComplaintDetail] = useState<Complaint | null>(null);

  // Employee Add/Edit modal
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [empDepartment, setEmpDepartment] = useState(DEPARTMENTS[0]);
  const [empRole, setEmpRole] = useState<'employee' | 'admin' | 'audit'>('employee');
  const [empEmail, setEmpEmail] = useState('');

  // Bulk import modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSuccessNotification, setBulkSuccessNotification] = useState<string | null>(null);

  // Wipe Data confirmation modal
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeSuccessNotification, setWipeSuccessNotification] = useState(false);

  // Copy code feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isAdminAuthenticated = currentUser?.role === 'admin';

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminUser = employees.find(
      e => e.role === 'admin' && e.code.trim().toLowerCase() === adminCodeInput.trim().toLowerCase()
    );
    if (adminUser) {
      setCurrentUser({
        role: 'admin',
        id: adminUser.id,
        name: adminUser.name,
        code: adminUser.code,
        department: adminUser.department,
      });
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // Metrics calculations
  const totalComplaints = complaints.length;
  const newComplaints = complaints.filter(c => c.status === 'new').length;
  const inProgressComplaints = complaints.filter(c => c.status === 'assigned' || c.status === 'in_progress').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

  const resolvedList = complaints.filter(c => c.status === 'resolved' || c.status === 'closed');
  const avgMetrics = computeAverageResolutionHours(resolvedList);
  const avgHours = avgMetrics.avgHours;
  const avgDurationFormatted = avgHours === 0
    ? (isAr ? 'لا توجد بيانات بعد' : 'No data yet')
    : avgHours < 24
    ? `${avgHours} ${isAr ? 'ساعة' : 'hours'}`
    : `${(avgHours / 24).toFixed(1)} ${isAr ? 'يوم' : 'days'}`;

  const handleExportDurationCSV = () => {
    const headers = isAr
      ? 'رقم البلاغ,الموضوع,الإدارة,الموظف المسؤول,تاريخ التقديم,تاريخ الحل,المدة المستغرقة,مؤشر سرعة الاستجابة SLA\n'
      : 'Ticket ID,Title,Department,Assigned Staff,Submitted Date,Resolved Date,Resolution Duration,SLA Performance\n';
    
    const rows = complaints.map(c => {
      const dur = calculateResolutionDuration(c.submittedAt, c.resolvedAt, isAr);
      const sla = evaluateSLA(c.submittedAt, c.resolvedAt, isAr);
      return `"${c.id}","${c.title.replace(/"/g, '""')}","${c.category}","${c.assignedToEmployeeName || '-'}","${new Date(c.submittedAt).toLocaleString()}","${c.resolvedAt ? new Date(c.resolvedAt).toLocaleString() : '-'}","${dur.formatted}","${sla.status}"`;
    }).join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `royal_sky_resolution_duration_sla_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.title.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(complaintSearch.toLowerCase()) ||
      (c.assignedToEmployeeName && c.assignedToEmployeeName.toLowerCase().includes(complaintSearch.toLowerCase())) ||
      (c.anonymousAlias && c.anonymousAlias.toLowerCase().includes(complaintSearch.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'in_progress'
        ? c.status === 'assigned' || c.status === 'in_progress'
        : c.status === statusFilter;

    const matchesDept = departmentFilter === 'all' ? true : c.category === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.code.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.department.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.email && emp.email.toLowerCase().includes(employeeSearch.toLowerCase()));

    const matchesRole = employeeRoleFilter === 'all' ? true : emp.role === employeeRoleFilter;

    return matchesSearch && matchesRole;
  });

  const handleOpenAssignModal = (complaint: Complaint) => {
    setAssignModalComplaint(complaint);
    const deptMatch = employees.find(e => e.department === complaint.category && e.role === 'employee');
    setSelectedEmployeeId(deptMatch ? deptMatch.id : employees.find(e => e.role === 'employee')?.id || employees[0]?.id || '');
    setAssignmentNote('');
  };

  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalComplaint || !selectedEmployeeId) return;
    adminAssignComplaint(assignModalComplaint.id, selectedEmployeeId, assignmentNote);
    setAssignModalComplaint(null);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empCode.trim()) return;

    if (editingEmployee) {
      updateEmployee({
        ...editingEmployee,
        name: empName.trim(),
        code: empCode.trim(),
        department: empDepartment,
        role: empRole,
        email: empEmail.trim(),
      });
      setEditingEmployee(null);
    } else {
      addEmployee({
        name: empName.trim(),
        code: empCode.trim(),
        department: empDepartment,
        role: empRole,
        email: empEmail.trim(),
      });
    }

    setIsAddEmployeeModalOpen(false);
    setEmpName('');
    setEmpCode('');
    setEmpEmail('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleConfirmWipe = () => {
    wipeData();
    setIsWipeModalOpen(false);
    setWipeSuccessNotification(true);
    setTimeout(() => setWipeSuccessNotification(false), 3000);
  };

  const handleExportCSV = () => {
    const headers = 'رقم الشكوى,العنوان,التصنيف,الأهمية,الحالة,الموظف المعين,تاريخ التقديم,الحل المتخذ\n';
    const rows = complaints.map(c => 
      `"${c.id}","${c.title.replace(/"/g, '""')}","${c.category}","${c.urgency}","${c.status}","${c.assignedToEmployeeName || 'غير مسند'}","${c.submittedAt}","${(c.resolutionNotes || '').replace(/"/g, '""')}"`
    ).join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `royal_sky_complaints_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {isAr ? 'تسجيل دخول لوحة الإدارة' : 'Admin Portal Login'}
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            {isAr
              ? 'يرجى إدخال الكود السري الخاص بمدير الامتثال والحوكمة للوصول إلى لوحة التحكم'
              : 'Enter Administrator access code to proceed'}
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <input
                type="text"
                required
                value={adminCodeInput}
                onChange={e => {
                  setAdminCodeInput(e.target.value);
                  setLoginError(false);
                }}
                placeholder={isAr ? 'أدخل كود الأدمن (مثال: ADM-100)' : 'Admin Code (e.g. ADM-100)'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none text-center font-mono"
                id="input-admin-code"
              />
              {loginError && (
                <p className="text-xs text-rose-400 mt-1.5">
                  {isAr ? 'كود الدخول غير صحيح. يرجى إدخال الكود المعتمد لمدير النظام.' : 'Invalid passcode. Please enter the authorized administrator code.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
              id="btn-admin-login-submit"
            >
              {isAr ? 'دخول لوحة الإدارة' : 'Enter Admin Portal'}
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
      {/* Top Banner Alert when data is wiped */}
      {wipeSuccessNotification && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تم مسح وتصفير كافة بيانات الشكاوى والتحويلات بنجاح!' : 'All complaints and records cleared successfully!'}</span>
          </div>
          <button onClick={() => setWipeSuccessNotification(false)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner Alert when bulk import succeeds */}
      {bulkSuccessNotification && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            <span>{bulkSuccessNotification}</span>
          </div>
          <button onClick={() => setBulkSuccessNotification(null)} className="text-amber-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar with Admin details & Wipe Database button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <button
            onClick={() => setCurrentPortal('home')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors mb-1"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {isAr ? 'لوحة تحكم مدير الامتثال والحوكمة' : 'Compliance & Governance Administration'}
            </h1>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
              {isAr ? 'أدمن النظام' : 'Super Admin'}
            </span>
          </div>
        </div>

        {/* Global Database Reset & Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Wipe All Data Button */}
          <button
            onClick={() => setIsWipeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
            id="btn-open-wipe-modal"
            title={isAr ? 'مسح وتصفير كافة الشكاوى والبيانات' : 'Wipe all database'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? 'مسح الداتا' : 'Wipe Data'}</span>
          </button>

          {/* Action Tabs */}
          <div className="flex items-center gap-1 bg-[#101830] border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              id="tab-admin-dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{isAr ? 'الداشبورد' : 'Dashboard'}</span>
            </button>

            <button
              onClick={() => setActiveTab('complaints')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'complaints' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              id="tab-admin-complaints"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isAr ? 'الشكاوى والتوجيه' : 'Complaints'}</span>
              {newComplaints > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full font-bold">
                  {newComplaints}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'employees' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              id="tab-admin-employees"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{isAr ? 'داتا الموظفين' : 'Employees'}</span>
              <span className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {employees.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('duration_report')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'duration_report' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
              id="tab-admin-duration-report"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{isAr ? 'تقرير زمن الحل (SLA)' : 'Resolution SLA Report'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#101830] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'إجمالي البلاغات المسجلة' : 'Total Reports'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{totalComplaints}</span>
                <span className="text-xs text-slate-500">{isAr ? 'تذكرة مشفرة' : 'tickets'}</span>
              </div>
            </div>

            <div className="bg-[#101830] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'بانتظار الفحص والتوجيه' : 'New / Unassigned'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{newComplaints}</span>
                <span className="text-xs text-rose-400 font-medium">
                  {newComplaints > 0 ? (isAr ? 'تحتاج إسناد لموظف' : 'needs action') : (isAr ? 'لا توجد معلقات' : 'all dispatched')}
                </span>
              </div>
            </div>

            <div className="bg-[#101830] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'قيد التحقيق الميداني' : 'In Progress'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{inProgressComplaints}</span>
                <span className="text-xs text-slate-500">{isAr ? 'مع الكوادر' : 'with officers'}</span>
              </div>
            </div>

            <div className="bg-[#101830] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'تم الحل والإغلاق' : 'Resolved Cases'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{resolvedComplaints}</span>
                <span className="text-xs text-emerald-400 font-semibold">{resolutionRate}% {isAr ? 'معدل الحل' : 'rate'}</span>
              </div>
            </div>
          </div>

          {/* If No Complaints: Luxury Enterprise Empty State */}
          {totalComplaints === 0 ? (
            <div className="bg-gradient-to-b from-[#101830] to-[#0c1326] border border-slate-800 rounded-3xl p-12 text-center shadow-xl">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/5">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {isAr ? 'نظام الامتثال المؤسسي جاهز وخالي من أي بلاغات معلقة' : 'Compliance Whistleblowing System Ready & Clean'}
              </h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto mb-6 leading-relaxed">
                {isAr
                  ? 'تم تصفير البيانات بنجاح. صندوق استقبال البلاغات محمي ومشفر بالكامل، ويمكنك استقبال الشكاوى من بوابة الزائر أو استيراد داتا الموظفين لتوزيع البلاغات عليهم.'
                  : 'Zero active complaints in database. The system is active and ready to ingest anonymous reports, dispatch to staff, and generate audit trails.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setCurrentPortal('visitor')}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>{isAr ? 'تقديم بلاغ سري جديد' : 'Submit Anonymous Ticket'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('employees')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'إدارة واستيراد داتا الموظفين' : 'Manage & Import Employees'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Department breakdown */}
              <div className="lg:col-span-2 bg-[#101830] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'توزيع الشكاوى حسب الإدارات' : 'Complaints by Department'}</span>
                </h3>
                <div className="space-y-3">
                  {DEPARTMENTS.slice(0, 5).map(dept => {
                    const count = complaints.filter(c => c.category === dept).length;
                    const pct = totalComplaints > 0 ? Math.round((count / totalComplaints) * 100) : 0;
                    return (
                      <div key={dept}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-300 font-medium">{dept}</span>
                          <span className="text-slate-400 font-mono font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status summary */}
              <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'حالة دورة المعالجة' : 'Lifecycle Status'}</span>
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-rose-400 font-semibold">{isAr ? 'جديدة (بانتظار التوجيه)' : 'New Tickets'}</span>
                    <span className="font-mono font-bold text-white">{newComplaints}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-sky-400 font-semibold">{isAr ? 'قيد التحقيق والمعالجة' : 'Under Investigation'}</span>
                    <span className="font-mono font-bold text-white">{inProgressComplaints}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-emerald-400 font-semibold">{isAr ? 'تم الحل المعتمد' : 'Resolved'}</span>
                    <span className="font-mono font-bold text-white">{resolvedComplaints}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPLAINTS & DISPATCH */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-[#101830] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-2.5" />
              <input
                type="text"
                value={complaintSearch}
                onChange={e => setComplaintSearch(e.target.value)}
                placeholder={isAr ? 'بحث برقم التذكرة أو الموضوع أو اسم الموظف...' : 'Search by ticket ID, subject, staff...'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                id="input-admin-search-complaints"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'الكل' : 'All'} ({totalComplaints})
              </button>
              <button
                onClick={() => setStatusFilter('new')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                  statusFilter === 'new' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-rose-400 hover:text-white'
                }`}
              >
                <span>{isAr ? 'جديدة' : 'New'}</span>
                <span className="text-[10px] px-1 rounded-full bg-rose-950 font-bold">{newComplaints}</span>
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'in_progress' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-900 text-sky-400 hover:text-white'
                }`}
              >
                {isAr ? 'قيد التحقيق' : 'In Progress'} ({inProgressComplaints})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === 'resolved' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-emerald-400 hover:text-white'
                }`}
              >
                {isAr ? 'تم الحل' : 'Resolved'} ({resolvedComplaints})
              </button>

              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-1.5 outline-none"
              >
                <option value="all">{isAr ? 'جميع الإدارات' : 'All Departments'}</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Complaints Table / List */}
          <div className="bg-[#101830] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                {isAr ? `سجل الشكاوى والبلاغات (${filteredComplaints.length})` : `Complaints Dossier (${filteredComplaints.length})`}
              </span>
              {complaints.length > 0 && (
                <button
                  onClick={handleExportCSV}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تصدير CSV' : 'Export CSV'}</span>
                </button>
              )}
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">
                  {isAr ? 'لا توجد شكاوى مسجلة حالياً' : 'No complaints found'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {isAr ? 'يمكنك تقديم بلاغات سرية جديدة من بوابة الزائر' : 'Submit complaints through the visitor portal'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {filteredComplaints.map(item => (
                  <div key={item.id} className="p-5 hover:bg-slate-900/40 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Left Info */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {item.id}
                          </span>
                          
                          {item.status === 'new' && (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                              {isAr ? 'جديدة - بانتظار التوجيه' : 'New - Needs Assignment'}
                            </span>
                          )}

                          {item.status === 'assigned' && (
                            <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                              {isAr ? 'تم الإسناد للموظف' : 'Assigned to Staff'}
                            </span>
                          )}

                          {item.status === 'resolved' && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              {isAr ? 'تم الحل والإغلاق' : 'Resolved'}
                            </span>
                          )}

                          <span className="text-[11px] text-slate-400">
                            {item.category}
                          </span>

                          <span className="text-[11px] text-slate-500">
                            {new Date(item.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <div>
                            {isAr ? 'الموظف المسؤول:' : 'Assigned Staff:'}{' '}
                            <strong className="text-amber-400">
                              {item.assignedToEmployeeName || (isAr ? 'غير مسند بعد' : 'Unassigned')}
                            </strong>
                          </div>

                          {item.resolvedByEmployeeName && (
                            <div className="text-emerald-400">
                              {isAr ? 'تم تقديم الحل بواسطة:' : 'Solution provided by:'}{' '}
                              <strong>{item.resolvedByEmployeeName}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Action Buttons */}
                      <div className="flex items-center gap-2 self-start lg:self-center flex-shrink-0">
                        <button
                          onClick={() => handleOpenAssignModal(item)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow ${
                            item.status === 'new'
                              ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700'
                          }`}
                          id={`btn-assign-${item.id}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{item.assignedToEmployeeId ? (isAr ? 'إعادة الإسناد' : 'Reassign') : (isAr ? 'إسناد لموظف' : 'Assign Staff')}</span>
                        </button>

                        <button
                          onClick={() => setViewComplaintDetail(item)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                          id={`btn-view-${item.id}`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isAr ? 'التفاصيل والحل' : 'View Details'}</span>
                        </button>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: EMPLOYEE MANAGEMENT WITH TEMPLATE DOWNLOAD & BULK IMPORT */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#101830] border border-slate-800 rounded-2xl p-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-extrabold text-white">
                  {isAr ? 'إدارة قاعدة بيانات الموظفين والكوادر' : 'Staff & Personnel Directory'}
                </h2>
              </div>
              <p className="text-xs text-slate-400 max-w-xl">
                {isAr
                  ? 'يمكنك إضافة موظفين فرادى، أو تحميل نموذج Excel/CSV الجاهز وتعبئته ثم رفعه واستيراده بضغطة زر واحدة.'
                  : 'Manage personnel credentials, download Excel template, and bulk import staff with automatic role assignment.'}
              </p>
            </div>

            {/* Actions: Download Template, Bulk Import, Add Single */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* DOWNLOAD TEMPLATE BUTTON (طلب المستخدم الصريح) */}
              <button
                onClick={downloadEmployeeTemplateCSV}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow hover:scale-[1.02]"
                id="btn-download-employee-template-header"
                title={isAr ? 'تحميل قالب CSV لتعبئة الموظفين' : 'Download CSV Template for Employees'}
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'تحميل نموذج الموظفين (Template)' : 'Download Template'}</span>
              </button>

              {/* BULK UPLOAD BUTTON */}
              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                id="btn-open-bulk-import-header"
              >
                <Upload className="w-4 h-4 text-amber-400" />
                <span>{isAr ? 'رفع الموظفين (استيراد الملف)' : 'Upload Filled Template'}</span>
              </button>

              {/* ADD SINGLE EMPLOYEE BUTTON */}
              <button
                onClick={() => {
                  setEditingEmployee(null);
                  setEmpName('');
                  setEmpCode(`EMP-${Math.floor(100 + Math.random() * 900)}`);
                  setEmpDepartment(DEPARTMENTS[0]);
                  setEmpRole('employee');
                  setEmpEmail('');
                  setIsAddEmployeeModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                id="btn-add-new-employee-header"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? 'إضافة موظف فردي' : 'Add Employee'}</span>
              </button>
            </div>
          </div>

          {/* Quick Staff Stats Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#101830] border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">{isAr ? 'إجمالي الكوادر' : 'Total Personnel'}</span>
                <span className="text-xl font-bold text-white">{employees.length}</span>
              </div>
              <Users className="w-5 h-5 text-slate-500" />
            </div>

            <div className="bg-[#101830] border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">{isAr ? 'موظفو المعالجة' : 'Case Officers'}</span>
                <span className="text-xl font-bold text-sky-400">
                  {employees.filter(e => e.role === 'employee').length}
                </span>
              </div>
              <UserCheck className="w-5 h-5 text-sky-400" />
            </div>

            <div className="bg-[#101830] border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">{isAr ? 'مديرو الامتثال' : 'Admins'}</span>
                <span className="text-xl font-bold text-amber-400">
                  {employees.filter(e => e.role === 'admin').length}
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>

            <div className="bg-[#101830] border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">{isAr ? 'مدققو الحسابات' : 'Auditors'}</span>
                <span className="text-xl font-bold text-purple-400">
                  {employees.filter(e => e.role === 'audit').length}
                </span>
              </div>
              <Eye className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Search & Filter Employees */}
          <div className="bg-[#101830] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-2.5" />
              <input
                type="text"
                value={employeeSearch}
                onChange={e => setEmployeeSearch(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، الكود، أو الإدارة...' : 'Search staff by name, code, dept...'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={employeeRoleFilter}
                onChange={e => setEmployeeRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 outline-none w-full sm:w-auto"
              >
                <option value="all">{isAr ? 'جميع الأدوار والصلاحيات' : 'All Roles'}</option>
                <option value="employee">{isAr ? 'موظف مختص (Employee)' : 'Employees'}</option>
                <option value="admin">{isAr ? 'مدير نظام (Admin)' : 'Admins'}</option>
                <option value="audit">{isAr ? 'مدقق حسابات (Audit)' : 'Auditors'}</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-[#101830] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{isAr ? 'الاسم' : 'Name'}</th>
                    <th className="py-3 px-4">{isAr ? 'الكود الوظيفي (Passcode)' : 'Employee Code'}</th>
                    <th className="py-3 px-4">{isAr ? 'الإدارة / القسم' : 'Department'}</th>
                    <th className="py-3 px-4">{isAr ? 'الدور والصلاحية' : 'Role'}</th>
                    <th className="py-3 px-4">{isAr ? 'الشكاوى المسندة' : 'Assigned Cases'}</th>
                    <th className="py-3 px-4 text-center">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredEmployees.map(emp => {
                    const assignedCases = complaints.filter(c => c.assignedToEmployeeId === emp.id).length;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-amber-400 font-bold text-xs">
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <span>{emp.name}</span>
                              {emp.email && <span className="block text-[10px] text-slate-400 font-normal">{emp.email}</span>}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400">
                            <span>{emp.code}</span>
                            <button
                              onClick={() => handleCopyCode(emp.code)}
                              className="text-slate-500 hover:text-white p-1 rounded transition-colors"
                              title={isAr ? 'نسخ الكود' : 'Copy code'}
                            >
                              {copiedCode === emp.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {emp.department}
                        </td>

                        <td className="py-3.5 px-4">
                          {emp.role === 'admin' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold text-[10px]">
                              {isAr ? 'مدير نظام (Admin)' : 'Admin'}
                            </span>
                          )}
                          {emp.role === 'employee' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold text-[10px]">
                              {isAr ? 'موظف مختص (Employee)' : 'Employee'}
                            </span>
                          )}
                          {emp.role === 'audit' && (
                            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold text-[10px]">
                              {isAr ? 'مدقق حسابات (Audit)' : 'Auditor'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-200">
                          <span className={assignedCases > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                            {assignedCases} {isAr ? 'شكوى' : 'cases'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setEmpName(emp.name);
                                setEmpCode(emp.code);
                                setEmpDepartment(emp.department);
                                setEmpRole(emp.role);
                                setEmpEmail(emp.email || '');
                                setIsAddEmployeeModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 transition-colors"
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {emp.role !== 'admin' && (
                              <button
                                onClick={() => {
                                  if (confirm(isAr ? `هل أنت متأكد من حذف الموظف [${emp.name}]؟` : `Delete employee ${emp.name}?`)) {
                                    deleteEmployee(emp.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                                title={isAr ? 'حذف' : 'Delete'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESOLUTION DURATION & SLA REPORT */}
      {activeTab === 'duration_report' && (
        <div className="space-y-6">
          {/* SLA Performance Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'متوسط زمن معالجة الشكاوى' : 'Average Resolution Time'}
                </span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-extrabold text-white mb-1">{avgDurationFormatted}</div>
              <span className="text-[11px] text-slate-500">
                {isAr ? 'محسوب على كافة الشكاوى المنجزة' : 'Across all closed complaints'}
              </span>
            </div>

            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'الحالات المحلولة بسرعة فائقة (≤24س)' : 'Rapid Resolutions (≤24h)'}
                </span>
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mb-1">
                {resolvedList.filter(c => {
                  if (!c.resolvedAt) return false;
                  const diffHours = (new Date(c.resolvedAt).getTime() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60);
                  return diffHours <= 24;
                }).length}
              </div>
              <span className="text-[11px] text-slate-500">
                {isAr ? 'استجابة ومعالجة فورية ممتازة' : 'Excellent fast turnarounds'}
              </span>
            </div>

            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'شكاوى أعيد فتحها باعتراض' : 'Reopened Complaints'}
                </span>
                <RotateCcw className="w-5 h-5 text-rose-400" />
              </div>
              <div className="text-2xl font-extrabold text-rose-400 mb-1">
                {complaints.filter(c => c.status === 'reopened' || (c.reopenedCount && c.reopenedCount > 0)).length}
              </div>
              <span className="text-[11px] text-slate-500">
                {isAr ? 'ردود واعتراضات من أصحاب الشكوى' : 'Complainant rebuttals'}
              </span>
            </div>

            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr ? 'نسبة الامتثال للمهلة القياسية' : 'SLA Compliance Rate'}
                </span>
                <ShieldCheck className="w-5 h-5 text-sky-400" />
              </div>
              <div className="text-2xl font-extrabold text-sky-400 mb-1">
                {resolvedList.length > 0 
                  ? `${Math.round((resolvedList.filter(c => {
                      if (!c.resolvedAt) return false;
                      const diffHours = (new Date(c.resolvedAt).getTime() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60);
                      return diffHours <= 72;
                    }).length / resolvedList.length) * 100)}%` 
                  : '100%'}
              </div>
              <span className="text-[11px] text-slate-500">
                {isAr ? 'تم الحل خلال المهلة (≤ 72 ساعة)' : 'Resolved within standard target'}
              </span>
            </div>
          </div>

          {/* Table of Resolution Durations */}
          <div className="bg-[#101830] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {isAr ? 'سجل تقرير المدة المستغرقة لحل البلاغات' : 'Complaint Resolution Duration Log'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr 
                    ? 'رصد زمني دقيق لكل بلاغ من لحظة الإرسال وحتى تسجيل الحل الرسمي، مع مؤشر قياس سرعة الاستجابة' 
                    : 'Time tracking from ticket submission to official resolution with SLA performance rating'}
                </p>
              </div>

              <button
                onClick={handleExportDurationCSV}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all self-start sm:self-center"
                id="btn-export-duration-csv"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تصدير تقرير المدة المستغرقة (CSV)' : 'Export SLA Duration Report (CSV)'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 pr-2 font-semibold">{isAr ? 'رقم البلاغ' : 'Ticket ID'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'الموضوع والإدارة' : 'Title & Dept'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'الموظف المسؤول' : 'Assigned Staff'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'تاريخ التقديم' : 'Submitted At'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'تاريخ الحل' : 'Resolved At'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'المدة المستغرقة' : 'Duration'}</th>
                    <th className="pb-3 font-semibold">{isAr ? 'مؤشر SLA' : 'SLA Status'}</th>
                    <th className="pb-3 pl-2 font-semibold text-center">{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {complaints.map(c => {
                    const duration = calculateResolutionDuration(c.submittedAt, c.resolvedAt, isAr);
                    const sla = evaluateSLA(c.submittedAt, c.resolvedAt, isAr);
                    return (
                      <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 pr-2 font-mono font-bold text-amber-400">{c.id}</td>
                        <td className="py-3.5">
                          <p className="font-bold text-white max-w-[220px] truncate">{c.title}</p>
                          <span className="text-[10px] text-slate-400">{c.category}</span>
                        </td>
                        <td className="py-3.5 text-slate-300">
                          {c.assignedToEmployeeName || (isAr ? 'غير مسند' : 'Unassigned')}
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {new Date(c.submittedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                        </td>
                        <td className="py-3.5 text-slate-400">
                          {c.resolvedAt ? new Date(c.resolvedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US') : (
                            <span className="text-amber-400 italic">{isAr ? 'قيد المعالجة' : 'In Progress'}</span>
                          )}
                        </td>
                        <td className="py-3.5">
                          <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                            c.resolvedAt ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {duration.formatted}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sla.color}`}>
                            {sla.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-center">
                          <button
                            onClick={() => setViewComplaintDetail(c)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px]"
                          >
                            {isAr ? 'عرض' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <BulkEmployeeImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={count => {
          setBulkSuccessNotification(
            isAr
              ? `تم استيراد ${count} موظفاً بنجاح إلى قاعدة بيانات الشركة!`
              : `Successfully imported ${count} employees into the directory!`
          );
        }}
      />

      {/* WIPE DATA CONFIRMATION MODAL */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white text-center mb-2">
              {isAr ? 'تأكيد مسح وتصفير كافة البيانات' : 'Confirm Complete Data Wipe'}
            </h3>

            <p className="text-xs text-slate-300 text-center leading-relaxed mb-6">
              {isAr
                ? 'سيتم مسح كافة سجلات الشكاوى وتاريخ التحويلات بالكامل، مع الإبقاء على حساب مدير الامتثال (ADM-100) لإتاحة الدخول والاستيراد النظيف.'
                : 'All complaints and transfer logs will be permanently wiped, keeping the Master Compliance Admin for clean access.'}
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsWipeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {isAr ? 'تراجع وإلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmWipe}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
                id="btn-confirm-wipe-data"
              >
                {isAr ? 'نعم، امسح كل البيانات' : 'Yes, Wipe Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN COMPLAINT MODAL */}
      {assignModalComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-amber-400" />
                {isAr ? 'إسناد الشكوى إلى موظف مختص' : 'Assign Complaint to Staff'}
              </h2>
              <button
                onClick={() => setAssignModalComplaint(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 mb-4 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-amber-400">{assignModalComplaint.id}</span>
                <span className="text-slate-400">• {assignModalComplaint.category}</span>
              </div>
              <p className="font-bold text-white mb-1">{assignModalComplaint.title}</p>
              <p className="text-slate-400 line-clamp-2">{assignModalComplaint.description}</p>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isAr ? 'اختر الموظف المسؤول عن التحقيق والحل *' : 'Select Designated Staff *'}
                </label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none"
                  id="select-employee-assign"
                >
                  <option value="">{isAr ? '-- اختر موظفاً --' : '-- Select Employee --'}</option>
                  {employees
                    .filter(e => e.role === 'employee')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.department} ({emp.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isAr ? 'توجيهات أو ملاحظات إدارية للموظف (اختياري)' : 'Admin Directive Note (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={assignmentNote}
                  onChange={e => setAssignmentNote(e.target.value)}
                  placeholder={isAr ? 'يرجى مراجعة فواتير التوريد والتحقق من صحة تواريخ الاعتماد...' : 'Please audit the invoices and verify timestamps...'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignModalComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                  id="btn-confirm-assign-submit"
                >
                  {isAr ? 'تأكيد الإسناد' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW COMPLAINT DETAILS & RESOLUTION MODAL */}
      {viewComplaintDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400">{viewComplaintDetail.id}</span>
                <span className="text-xs text-slate-400">• {viewComplaintDetail.category}</span>
              </div>
              <button
                onClick={() => setViewComplaintDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-base font-bold text-white mb-2">{viewComplaintDetail.title}</h2>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 mb-4 leading-relaxed whitespace-pre-wrap">
              {viewComplaintDetail.description}
            </div>

            {/* VISITOR ATTACHMENTS */}
            {viewComplaintDetail.attachments && viewComplaintDetail.attachments.length > 0 && (
              <div className="mb-5">
                <FileAttachmentViewer
                  attachments={viewComplaintDetail.attachments}
                  title={isAr ? 'مستندات وأدلة مرفقة من صاحب الشكوى' : 'Complainant Evidence Attachments'}
                  isAr={isAr}
                  accentColor="amber"
                />
              </div>
            )}

            {/* VISITOR OBJECTION / REOPEN ALERT */}
            {viewComplaintDetail.visitorFeedback && (
              <div className="mb-5 bg-rose-500/10 border-2 border-rose-500/30 rounded-2xl p-4 shadow-lg shadow-rose-950/20">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs mb-1.5">
                  <RotateCcw className="w-4 h-4" />
                  <span>{isAr ? 'اعتراض ورد من صاحب الشكوى (أعيد فتحها للمراجعة)' : 'Visitor Objection & Reopen Feedback'}</span>
                </div>
                <p className="text-xs text-rose-100 bg-slate-950/80 p-3 rounded-xl border border-rose-500/20 leading-relaxed mb-2 whitespace-pre-wrap">
                  "{viewComplaintDetail.visitorFeedback}"
                </p>
                {viewComplaintDetail.visitorFeedbackAt && (
                  <span className="text-[10px] text-slate-500 block">
                    {isAr ? 'تاريخ الاعتراض:' : 'Feedback Date:'} {new Date(viewComplaintDetail.visitorFeedbackAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                )}
              </div>
            )}

            {/* If Resolved: Show Resolution & Documents */}
            {viewComplaintDetail.resolutionNotes ? (
              <div className="mb-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'إجراء وحل الموظف المسؤول:' : 'Staff Resolution & Action:'}</span>
                </div>
                <p className="text-xs text-emerald-100 whitespace-pre-wrap leading-relaxed mb-3 bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                  {viewComplaintDetail.resolutionNotes}
                </p>

                {/* RESOLUTION ATTACHMENTS BY STAFF */}
                {viewComplaintDetail.resolutionAttachments && viewComplaintDetail.resolutionAttachments.length > 0 && (
                  <div className="mb-3 pt-3 border-t border-emerald-500/20">
                    <FileAttachmentViewer
                      attachments={viewComplaintDetail.resolutionAttachments}
                      title={isAr ? 'مستندات وتقارير الحل المرفقة من الموظف' : 'Staff Resolution Attachments'}
                      isAr={isAr}
                      accentColor="emerald"
                    />
                  </div>
                )}

                <div className="text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-500/20 pt-2">
                  <span>
                    {isAr ? 'بواسطة الموظف:' : 'Resolved by:'} <strong className="text-emerald-300">{viewComplaintDetail.resolvedByEmployeeName}</strong>
                  </span>
                  {viewComplaintDetail.resolvedAt && (
                    <span className="flex items-center gap-2">
                      <span>{isAr ? 'بتاريخ:' : 'Date:'} {new Date(viewComplaintDetail.resolvedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                      <span className="bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
                        {calculateResolutionDuration(viewComplaintDetail.submittedAt, viewComplaintDetail.resolvedAt, isAr).formatted}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between">
                <span>{isAr ? 'لم يقم الموظف بإغلاق الشكوى أو تقديم حل بعد.' : 'No resolution submitted yet.'}</span>
                <button
                  onClick={() => {
                    setViewComplaintDetail(null);
                    handleOpenAssignModal(viewComplaintDetail);
                  }}
                  className="text-amber-400 hover:underline font-semibold"
                >
                  {isAr ? 'توجيه أو إسناد الموظف' : 'Assign / Reassign Staff'}
                </button>
              </div>
            )}

            {/* Timeline */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {isAr ? 'المسار الزمني وسجل التدقيق:' : 'Audit Trail Timeline:'}
              </h3>
              <div className="space-y-2 text-xs">
                {viewComplaintDetail.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <div className="flex justify-between font-bold text-white mb-1">
                      <span>{event.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(event.timestamp).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setViewComplaintDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                {editingEmployee
                  ? (isAr ? 'تعديل بيانات الموظف' : 'Edit Employee')
                  : (isAr ? 'إضافة موظف جديد' : 'Add New Employee')}
              </h2>
              <button
                onClick={() => setIsAddEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'اسم الموظف *' : 'Employee Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder={isAr ? 'مثال: م. أحمد عبد الله' : 'e.g. Ahmed Abdallah'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none"
                  id="input-employee-name"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'الكود الوظيفي (Passcode للدخول) *' : 'Employee Code (Login Passcode) *'}
                </label>
                <input
                  type="text"
                  required
                  value={empCode}
                  onChange={e => setEmpCode(e.target.value)}
                  placeholder={isAr ? 'مثال: EMP-105' : 'e.g. EMP-105'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
                  id="input-employee-code"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'الإدارة / القسم *' : 'Department *'}
                </label>
                <select
                  value={empDepartment}
                  onChange={e => setEmpDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none"
                  id="select-employee-dept"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'الدور الوظيفي والصلاحية *' : 'Role & Permission *'}
                </label>
                <select
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none"
                  id="select-employee-role"
                >
                  <option value="employee">{isAr ? 'موظف مختص (Employee - استلام وحل الشكاوى)' : 'Employee (Resolve & Transfer)'}</option>
                  <option value="admin">{isAr ? 'مدير نظام (Admin - كامل الصلاحيات والإسناد)' : 'Admin (Full Management)'}</option>
                  <option value="audit">{isAr ? 'مدقق حسابات (Audit - اطلاع وتدقيق فقط)' : 'Auditor (Read-Only Oversight)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {isAr ? 'البريد الإلكتروني (اختياري)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={empEmail}
                  onChange={e => setEmpEmail(e.target.value)}
                  placeholder="employee@royalsky.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                  id="btn-save-employee"
                >
                  {isAr ? 'حفظ البيانات' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
