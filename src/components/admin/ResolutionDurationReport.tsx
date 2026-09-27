import React, { useState } from 'react';
import { Complaint, Employee } from '../../types';
import { calculateResolutionDuration, evaluateSLA, computeAverageResolutionHours } from '../../utils/duration';
import { DEPARTMENTS } from '../../data/mockData';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Building, 
  User, 
  Download, 
  Search, 
  Filter, 
  Eye,
  ArrowUpDown,
  Zap,
  ShieldCheck
} from 'lucide-react';

interface ResolutionDurationReportProps {
  complaints: Complaint[];
  employees: Employee[];
  isAr: boolean;
  onInspectComplaint?: (complaint: Complaint) => void;
}

export const ResolutionDurationReport: React.FC<ResolutionDurationReportProps> = ({
  complaints,
  employees,
  isAr,
  onInspectComplaint
}) => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'duration_asc' | 'duration_desc' | 'date_desc'>('date_desc');

  // Filter resolved complaints
  const resolvedList = complaints.filter(
    c => (c.status === 'resolved' || c.status === 'closed') && c.resolvedAt
  );

  // Overall metrics
  const totalResolved = resolvedList.length;
  const avgHours = computeAverageResolutionHours(resolvedList).avgHours;

  // SLA calculations (threshold: 48h)
  const slaTargetHours = 48;
  const withinSlaCount = resolvedList.filter(c => {
    if (!c.resolvedAt) return false;
    const dur = calculateResolutionDuration(c.submittedAt, c.resolvedAt, isAr);
    return dur.totalHours <= slaTargetHours;
  }).length;

  const slaPercentage = totalResolved > 0 ? Math.round((withinSlaCount / totalResolved) * 100) : 100;

  // Fastest and slowest resolution
  let fastestHours = Infinity;
  let slowestHours = 0;
  resolvedList.forEach(c => {
    if (!c.resolvedAt) return;
    const dur = calculateResolutionDuration(c.submittedAt, c.resolvedAt, isAr);
    if (dur.totalHours < fastestHours) fastestHours = dur.totalHours;
    if (dur.totalHours > slowestHours) slowestHours = dur.totalHours;
  });

  // Department analytics
  const departmentAnalytics = DEPARTMENTS.map(dept => {
    const deptResolved = resolvedList.filter(c => c.category === dept);
    const count = deptResolved.length;
    const avg = computeAverageResolutionHours(deptResolved).avgHours;
    return { dept, count, avg };
  }).filter(d => d.count > 0);

  // Filtered & sorted table data
  const filteredList = resolvedList
    .filter(c => {
      const matchDept = departmentFilter === 'all' || c.category === departmentFilter;
      const matchSearch =
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.resolvedByEmployeeName && c.resolvedByEmployeeName.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchDept && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.resolvedAt || 0).getTime() - new Date(a.resolvedAt || 0).getTime();
      }
      const durA = calculateResolutionDuration(a.submittedAt, a.resolvedAt, isAr).totalHours;
      const durB = calculateResolutionDuration(b.submittedAt, b.resolvedAt, isAr).totalHours;
      if (sortBy === 'duration_asc') return durA - durB;
      return durB - durA;
    });

  const exportCSV = () => {
    const headers = 'رقم الشكوى,الموضوع,الإدارة,درجة الأهمية,الموظف المعني,تاريخ التقديم,تاريخ الحل,المدة الإجمالية (ساعة),المدة منسقة,حالة الالتزام بالـ SLA\n';
    const rows = filteredList.map(c => {
      const dur = calculateResolutionDuration(c.submittedAt, c.resolvedAt, isAr);
      const sla = evaluateSLA(dur.totalHours, isAr);
      return `"${c.id}","${c.title.replace(/"/g, '""')}","${c.category}","${c.urgency}","${c.resolvedByEmployeeName || ''}","${c.submittedAt}","${c.resolvedAt}","${dur.totalHours}","${dur.formatted}","${sla.label}"`;
    }).join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `royal_sky_resolution_duration_sla_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isAr ? 'تقرير المدة المستغرقة لحل الشكاوى ومؤشرات الأداء (SLA)' : 'Complaint Resolution Duration & SLA Analytics'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            {isAr
              ? 'تحليل رقمي دقيق للفترة الزمنية المنقضية من لحظة استلام البلاغ وحتى اعتماده وحله نهائياً مع بيان نسب الالتزام بالمعايير القياسية للإدارات والكوادر.'
              : 'Detailed operational audit calculating the exact elapsed time between ticket intake and final resolution closure.'}
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filteredList.length === 0}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-2 shadow self-start md:self-auto disabled:opacity-50"
          id="btn-export-duration-report"
        >
          <Download className="w-4 h-4" />
          <span>{isAr ? 'تصدير تقرير المدد (Excel/CSV)' : 'Export Duration Report'}</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Average Duration */}
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'متوسط مدة المعالجة والحل' : 'Average Resolution Time'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">
              {avgHours > 0 ? (avgHours >= 24 ? `${(avgHours / 24).toFixed(1)} ${isAr ? 'يوم' : 'days'}` : `${avgHours} ${isAr ? 'ساعة' : 'hrs'}`) : (isAr ? 'لا توجد بيانات' : 'N/A')}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {isAr ? `محسوب على إجمالي ${totalResolved} شكوى محلولة` : `Based on ${totalResolved} resolved cases`}
          </span>
        </div>

        {/* SLA Compliance */}
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'نسبة الالتزام بالهدف (خلال 48 ساعة)' : 'SLA Compliance (< 48h)'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-400">{slaPercentage}%</span>
            <span className="text-xs text-slate-400">({withinSlaCount}/{totalResolved})</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${slaPercentage}%` }} />
          </div>
        </div>

        {/* Fastest Resolution */}
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'أسرع بلاغ تم إنجازه' : 'Fastest Case Closed'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-sky-400">
              {fastestHours < Infinity ? `${fastestHours} ${isAr ? 'ساعة' : 'hrs'}` : '-'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {isAr ? 'استجابة قياسية سريعة' : 'Record turnaround'}
          </span>
        </div>

        {/* Total Resolved */}
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'إجمالي الشكاوى المنجزة' : 'Total Resolved Tickets'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-white">{totalResolved}</span>
            <span className="text-xs text-slate-400">/ {complaints.length}</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {complaints.length > 0 ? `${Math.round((totalResolved / complaints.length) * 100)}% ${isAr ? 'من إجمالي البلاغات' : 'of all tickets'}` : ''}
          </span>
        </div>
      </div>

      {/* Department Breakdown */}
      {departmentAnalytics.length > 0 && (
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'متوسط سرعة الإنجاز حسب الإدارات المعنية' : 'Average Resolution Speed by Department'}</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {departmentAnalytics.map(dept => (
              <div key={dept.dept} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-200">{dept.dept}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {dept.count} {isAr ? 'شكوى' : 'cases'}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">{isAr ? 'المتوسط:' : 'Avg:'}</span>
                  <span className="font-mono font-bold text-amber-400">
                    {dept.avg >= 24 ? `${(dept.avg / 24).toFixed(1)} ${isAr ? 'يوم' : 'd'}` : `${dept.avg} ${isAr ? 'ساعة' : 'h'}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Tickets Table */}
      <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6 space-y-4">
        {/* Table Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:right-3 rtl:left-auto top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث برقم الشكوى أو الموظف أو الموضوع...' : 'Search by ticket ID, employee, title...'}
              className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg pl-9 pr-3 rtl:pr-9 rtl:pl-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg px-3 py-2 outline-none"
            >
              <option value="date_desc">{isAr ? 'الأحدث حلاً' : 'Latest Resolved'}</option>
              <option value="duration_asc">{isAr ? 'الأسرع حلاً' : 'Fastest Duration'}</option>
              <option value="duration_desc">{isAr ? 'الأطول مدة' : 'Longest Duration'}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {filteredList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800/60">
            <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium">
              {totalResolved === 0
                ? (isAr ? 'لا توجد شكاوى محلولة حتى الآن لحساب مدد الإنجاز.' : 'No resolved complaints to measure duration yet.')
                : (isAr ? 'لا توجد نتائج مطابقة لبحثك.' : 'No records match your filters.')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60 font-semibold">
                  <th className="py-3 px-3.5">{isAr ? 'رقم الشكوى' : 'Ticket ID'}</th>
                  <th className="py-3 px-3.5">{isAr ? 'الموضوع والإدارة' : 'Title & Dept'}</th>
                  <th className="py-3 px-3.5">{isAr ? 'الموظف القائم بالحل' : 'Resolved By'}</th>
                  <th className="py-3 px-3.5">{isAr ? 'تاريخ التقديم' : 'Submitted'}</th>
                  <th className="py-3 px-3.5">{isAr ? 'تاريخ الحل' : 'Resolved At'}</th>
                  <th className="py-3 px-3.5">{isAr ? 'المدة المستغرقة' : 'Duration'}</th>
                  <th className="py-3 px-3.5 text-center">{isAr ? 'تقييم الـ SLA' : 'SLA Status'}</th>
                  {onInspectComplaint && <th className="py-3 px-3.5 text-center">{isAr ? 'الملف' : 'Dossier'}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map(item => {
                  const duration = calculateResolutionDuration(item.submittedAt, item.resolvedAt, isAr);
                  const sla = evaluateSLA(duration.totalHours, isAr);

                  return (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-amber-400">
                        {item.id}
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-white truncate max-w-xs">{item.title}</div>
                        <span className="text-[11px] text-slate-400">{item.category}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.resolvedByEmployeeName || (isAr ? 'غير محدد' : 'Staff')}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                        {new Date(item.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                        {item.resolvedAt ? new Date(item.resolvedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : '-'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="font-bold text-slate-100 font-mono bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
                          {duration.formatted}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${sla.colorClass}`}>
                          {sla.label}
                        </span>
                      </td>
                      {onInspectComplaint && (
                        <td className="py-3 px-3.5 text-center">
                          <button
                            onClick={() => onInspectComplaint(item)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                            title={isAr ? 'استعراض الشكوى والمرفقات' : 'Inspect Ticket'}
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
