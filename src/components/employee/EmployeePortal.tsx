import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint, Employee, Attachment } from '../../types';
import { FileAttachmentViewer } from '../common/FileAttachmentViewer';
import { 
  UserCheck, 
  KeyRound, 
  Send, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Paperclip, 
  Share2, 
  AlertCircle, 
  Sparkles, 
  Check, 
  X, 
  UploadCloud, 
  FileText, 
  MessageSquare,
  ShieldCheck,
  Building,
  UserX,
  RotateCcw
} from 'lucide-react';

export const EmployeePortal: React.FC = () => {
  const { 
    language, 
    setCurrentPortal, 
    complaints, 
    employees, 
    transferRequests, 
    employeeUpdateCode, 
    employeeResolveComplaint, 
    createTransferRequest, 
    respondTransferRequest, 
    currentUser, 
    setCurrentUser 
  } = useApp();

  const isAr = language === 'ar';

  // Login form state
  const [loginName, setLoginName] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Active tab inside employee portal
  const [activeTab, setActiveTab] = useState<'assigned' | 'transfers' | 'resolved'>('assigned');

  // Change Passcode Modal
  const [isChangeCodeModalOpen, setIsChangeCodeModalOpen] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState('');
  const [codeChangeSuccess, setCodeChangeSuccess] = useState(false);

  // Resolve Complaint Modal
  const [resolvingComplaint, setResolvingComplaint] = useState<Complaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolutionFiles, setResolutionFiles] = useState<Attachment[]>([]);
  const [simulatedFileName, setSimulatedFileName] = useState('');

  // Transfer Complaint Modal
  const [transferringComplaint, setTransferringComplaint] = useState<Complaint | null>(null);
  const [targetColleagueId, setTargetColleagueId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  // Active Complaint Details Modal
  const [inspectComplaint, setInspectComplaint] = useState<Complaint | null>(null);

  const isEmployeeAuthenticated = currentUser?.role === 'employee' && Boolean(currentUser?.id);
  const loggedEmployee = employees.find(e => e.id === currentUser?.id);

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = employees.find(
      e =>
        e.name.trim().toLowerCase() === loginName.trim().toLowerCase() &&
        e.code.trim().toLowerCase() === loginCode.trim().toLowerCase()
    );

    if (matched) {
      setCurrentUser({
        role: 'employee',
        id: matched.id,
        name: matched.name,
        code: matched.code,
        department: matched.department,
      });
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // Filter complaints for this employee (including reopened ones if complainant replied)
  const myAssignedComplaints = complaints.filter(
    c => c.assignedToEmployeeId === currentUser?.id && (c.status === 'assigned' || c.status === 'in_progress' || c.status === 'reopened')
  );

  const myResolvedComplaints = complaints.filter(
    c => c.assignedToEmployeeId === currentUser?.id && (c.status === 'resolved' || c.status === 'closed')
  );

  // Incoming transfer requests to this employee
  const incomingTransfers = transferRequests.filter(
    t => t.toEmployeeId === currentUser?.id && t.status === 'pending'
  );

  // Outgoing transfer requests by this employee
  const outgoingTransfers = transferRequests.filter(
    t => t.fromEmployeeId === currentUser?.id
  );

  const handleChangeCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !newCodeInput.trim()) return;
    const ok = employeeUpdateCode(currentUser.id, newCodeInput.trim());
    if (ok) {
      setCodeChangeSuccess(true);
      setTimeout(() => {
        setCodeChangeSuccess(false);
        setIsChangeCodeModalOpen(false);
        setNewCodeInput('');
      }, 1500);
    }
  };

  const handleResolutionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAtt: Attachment = {
          id: `att-res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        setResolutionFiles(prev => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleAddResolutionFile = () => {
    if (!simulatedFileName.trim()) return;
    const docName = simulatedFileName.trim().endsWith('.pdf') ? simulatedFileName.trim() : `${simulatedFileName.trim()}.pdf`;
    const syntheticContent = `=======================================================\n` +
      `ROYAL SKY COMPLIANCE - OFFICIAL RESOLUTION REPORT\n` +
      `Document Name : ${docName}\n` +
      `Resolved By   : ${currentUser?.name || 'Staff'}\n` +
      `Department    : ${currentUser?.department || 'Operations'}\n` +
      `Date & Time   : ${new Date().toLocaleString()}\n` +
      `Resolution Status : Formally Solved and Verified\n` +
      `=======================================================\n`;
    const blob = new Blob([syntheticContent], { type: 'text/plain;charset=utf-8;' });
    const reader = new FileReader();
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      const newAtt: Attachment = {
        id: `att-res-${Date.now()}`,
        name: docName,
        size: '1.8 MB',
        type: 'application/pdf',
        dataUrl,
        uploadedAt: new Date().toISOString(),
      };
      setResolutionFiles(prev => [...prev, newAtt]);
      setSimulatedFileName('');
    };
    reader.readAsDataURL(blob);
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint || !resolutionNotes.trim()) return;
    employeeResolveComplaint(resolvingComplaint.id, resolutionNotes.trim(), resolutionFiles);
    setResolvingComplaint(null);
    setResolutionNotes('');
    setResolutionFiles([]);
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringComplaint || !targetColleagueId || !currentUser?.id || !transferReason.trim()) return;
    createTransferRequest(
      transferringComplaint.id,
      currentUser.id,
      targetColleagueId,
      transferReason.trim()
    );
    setTransferringComplaint(null);
    setTargetColleagueId('');
    setTransferReason('');
  };

  if (!isEmployeeAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-8 shadow-xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            {isAr ? 'تسجيل دخول بوابة الموظف' : 'Employee Portal Login'}
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            {isAr
              ? 'أدخل اسمك والكود الخاص بك المسجل من قبل الإدارة لاستعراض الشكاوى وحلها'
              : 'Enter your name and passcode assigned by administration to access your assigned tickets'}
          </p>

          <form onSubmit={handleEmployeeLogin} className="space-y-4 text-right rtl:text-right ltr:text-left">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'اسم الموظف *' : 'Employee Name *'}
              </label>
              <input
                type="text"
                required
                value={loginName}
                onChange={e => {
                  setLoginName(e.target.value);
                  setLoginError(false);
                }}
                placeholder={isAr ? 'مثال: م. محمد الشناوي (مالية)' : 'e.g. Mohamed Shinawy'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                id="input-emp-login-name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {isAr ? 'كود الموظف (Passcode) *' : 'Employee Passcode *'}
              </label>
              <input
                type="text"
                required
                value={loginCode}
                onChange={e => {
                  setLoginCode(e.target.value);
                  setLoginError(false);
                }}
                placeholder={isAr ? 'مثال: EMP-101' : 'e.g. EMP-101'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono"
                id="input-emp-login-code"
              />
              {loginError && (
                <p className="text-xs text-rose-400 mt-1.5">
                  {isAr ? 'الاسم أو الكود الوظيفي غير صحيح، يرجى مراجعة مسؤول النظام.' : 'Invalid name or employee code, please contact your administrator.'}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
              id="btn-emp-login-submit"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <button
              onClick={() => setCurrentPortal('home')}
              className="text-xs text-slate-400 hover:text-white block mx-auto"
            >
              {isAr ? '← العودة للبوابات الرئيسية' : '← Back to Portals'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Employee Top Profile Banner */}
      <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => setCurrentPortal('home')}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors mb-2"
          >
            {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
              {currentUser?.name?.charAt(0) || 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{currentUser?.name}</h1>
                <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                  {isAr ? 'موظف مسؤول' : 'Assigned Staff'}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {currentUser?.department} • {isAr ? 'الكود الحالي:' : 'Current Code:'}{' '}
                <strong className="text-amber-400 font-mono">{loggedEmployee?.code || currentUser?.code}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Change Passcode Button ("ولما بيدخل يقدر يغير كوده من جوا") */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setNewCodeInput('');
              setIsChangeCodeModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow"
            id="btn-open-change-code-modal"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isAr ? 'تغيير كودي الشخصي (PIN)' : 'Change My Passcode'}</span>
          </button>
        </div>
      </div>

      {/* Tabs & Summary Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {/* Assigned */}
        <div
          onClick={() => setActiveTab('assigned')}
          className={`cursor-pointer border p-4 rounded-xl flex items-center justify-between transition-all ${
            activeTab === 'assigned'
              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
              : 'bg-[#101830] border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          id="tab-emp-assigned"
        >
          <div>
            <span className="text-xs block text-slate-400 mb-0.5">
              {isAr ? 'شكاوى بانتظار حلك' : 'Complaints to Resolve'}
            </span>
            <span className="text-2xl font-extrabold text-white">{myAssignedComplaints.length}</span>
          </div>
          <Clock className="w-6 h-6 text-amber-400" />
        </div>

        {/* Incoming Transfers */}
        <div
          onClick={() => setActiveTab('transfers')}
          className={`cursor-pointer border p-4 rounded-xl flex items-center justify-between transition-all ${
            activeTab === 'transfers'
              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
              : 'bg-[#101830] border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          id="tab-emp-transfers"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs block text-slate-400 mb-0.5">
                {isAr ? 'طلبات تحويل من زملاء' : 'Transfer Requests'}
              </span>
              {incomingTransfers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <span className="text-2xl font-extrabold text-white">{incomingTransfers.length}</span>
          </div>
          <Share2 className="w-6 h-6 text-sky-400" />
        </div>

        {/* Resolved */}
        <div
          onClick={() => setActiveTab('resolved')}
          className={`cursor-pointer border p-4 rounded-xl flex items-center justify-between transition-all ${
            activeTab === 'resolved'
              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
              : 'bg-[#101830] border-slate-800 text-slate-300 hover:border-slate-700'
          }`}
          id="tab-emp-resolved"
        >
          <div>
            <span className="text-xs block text-slate-400 mb-0.5">
              {isAr ? 'شكاوى قمت بحلها' : 'Resolved by You'}
            </span>
            <span className="text-2xl font-extrabold text-white">{myResolvedComplaints.length}</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
      </div>

      {/* TAB 1: ASSIGNED COMPLAINTS (TO RESOLVE) */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>{isAr ? `الشكاوى المحالة إليك وتحتاج حلاً (${myAssignedComplaints.length})` : `Assigned Complaints (${myAssignedComplaints.length})`}</span>
            </h2>
          </div>

          {myAssignedComplaints.length === 0 ? (
            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-200">
                {isAr ? 'ممتاز! لا توجد أي شكاوى معلقة بانتظار حلك حالياً.' : 'Great job! Zero pending complaints assigned to you.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {isAr ? 'ستظهر هنا أي شكوى يوجهها لك مدير الامتثال أو يتم تحويلها من زملائك.' : 'New complaints dispatched by admin will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myAssignedComplaints.map(complaint => (
                <div
                  key={complaint.id}
                  className="bg-[#101830] border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all shadow-sm"
                  id={`emp-complaint-card-${complaint.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {complaint.id}
                      </span>
                      <span className="text-xs text-slate-400">{complaint.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        complaint.urgency === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        complaint.urgency === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {complaint.urgency}
                      </span>
                      {complaint.status === 'reopened' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'معاد فتحها (اعتراض المشتكي)' : 'Reopened (Complainant Objection)'}</span>
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-slate-500">
                      {isAr ? 'تاريخ الإسناد:' : 'Assigned:'}{' '}
                      {complaint.assignedAt ? new Date(complaint.assignedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US') : ''}
                    </span>
                  </div>

                  {/* REOPENED OBJECTION ALERT BANNER */}
                  {complaint.status === 'reopened' && (
                    <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 text-xs">
                      <div className="flex items-center gap-2 font-bold text-rose-400 mb-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                        <span>{isAr ? 'تنبيه عاجل: قام مقدم الشكوى بالاعتراض على الحل وإعادة فتح البلاغ للمراجعة!' : 'Urgent Alert: Complainant objected to the resolution and reopened this complaint!'}</span>
                      </div>
                      <div className="bg-slate-950/80 p-2.5 rounded-lg border border-rose-500/20 text-slate-200">
                        <span className="text-[10px] text-slate-400 block mb-1">{isAr ? 'سبب وملاحظات اعتراض المشتكي:' : 'Complainant Objection Feedback:'}</span>
                        <p className="leading-relaxed whitespace-pre-wrap text-rose-100">"{complaint.visitorFeedback}"</p>
                        {complaint.visitorFeedbackAt && (
                          <span className="text-[10px] text-slate-500 block mt-1.5">
                            {new Date(complaint.visitorFeedbackAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <h3 className="text-base font-bold text-white mb-2">{complaint.title}</h3>
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 mb-4 leading-relaxed">
                    {complaint.description}
                  </p>

                  {/* Attached files by visitor */}
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div className="mb-4">
                      <FileAttachmentViewer
                        attachments={complaint.attachments}
                        title={isAr ? 'المستندات المرفقة من قِبل المشتكي' : 'Attached Documents by Complainant'}
                        isAr={isAr}
                        accentColor="amber"
                      />
                    </div>
                  )}

                  {/* Previous resolution if reopened */}
                  {complaint.status === 'reopened' && complaint.resolutionNotes && (
                    <div className="mb-4 bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {isAr ? 'ملخص الحل السابق المقدم منك (المعترض عليه):' : 'Previous Resolution Submitted (Under Objection):'}
                      </span>
                      <p className="text-slate-300 text-[11px] line-clamp-2">{complaint.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Action Buttons: Resolve OR Transfer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => setInspectComplaint(complaint)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تفاصيل البلاغ والمسار الزمني' : 'View Full File & Timeline'}</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      {/* Transfer to Colleague Option */}
                      <button
                        onClick={() => {
                          setTransferringComplaint(complaint);
                          setTargetColleagueId('');
                          setTransferReason('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 hover:border-sky-500/40 text-xs font-semibold transition-all flex items-center gap-1.5"
                        id={`btn-transfer-card-${complaint.id}`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تحويل لزميل آخر' : 'Transfer to Colleague'}</span>
                      </button>

                      {/* Resolve Complaint Button */}
                      <button
                        onClick={() => {
                          setResolvingComplaint(complaint);
                          setResolutionNotes(complaint.resolutionNotes || '');
                          setResolutionFiles(complaint.resolutionAttachments || []);
                        }}
                        className={`px-4 py-2 rounded-xl text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 ${
                          complaint.status === 'reopened'
                            ? 'bg-rose-400 hover:bg-rose-300 shadow-rose-500/20'
                            : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                        }`}
                        id={`btn-resolve-card-${complaint.id}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {complaint.status === 'reopened'
                            ? (isAr ? 'معالجة الاعتراض وتحديث الحل' : 'Review Objection & Update Resolution')
                            : (isAr ? 'إنجاز وحل الشكوى' : 'Resolve Complaint')}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING TRANSFER REQUESTS ("بشرط ان الموظف ده يقبلها عشان تتشال من الاولاني وتتحط عند التاني") */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>{isAr ? `طلبات التحويل الواردة إليك من زملائك (${incomingTransfers.length})` : `Incoming Transfer Requests (${incomingTransfers.length})`}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'بمجرد قبولك للطلب ستنتقل الشكوى إلى عهدتك بالكامل وتُزال من الموظف السابق'
                  : 'Accepting transfers will shift ticket ownership to you from previous colleague'}
              </p>
            </div>
          </div>

          {incomingTransfers.length === 0 ? (
            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              <Share2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium">{isAr ? 'لا توجد طلبات تحويل واردة معلقة حالياً' : 'No incoming transfers pending'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingTransfers.map(req => (
                <div
                  key={req.id}
                  className="bg-[#101830] border-2 border-sky-500/40 rounded-2xl p-5 shadow-lg shadow-sky-950/20"
                  id={`transfer-req-${req.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {req.ticketNumber}
                      </span>
                      <span className="text-xs text-sky-400 font-semibold">
                        {isAr ? 'طلب تحويل وارد من:' : 'From:'} {req.fromEmployeeName}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(req.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{req.complaintTitle}</h3>

                  <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl mb-4 text-xs">
                    <span className="text-slate-400 block mb-1 font-semibold">
                      {isAr ? 'مبرر وسبب التحويل المقدم من الزميل:' : 'Colleague Transfer Justification:'}
                    </span>
                    <p className="text-slate-200">{req.reason}</p>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => respondTransferRequest(req.id, false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      id={`btn-reject-transfer-${req.id}`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اعتذار ورفض التحويل' : 'Decline'}</span>
                    </button>

                    <button
                      onClick={() => respondTransferRequest(req.id, true)}
                      className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow transition-colors flex items-center gap-1.5"
                      id={`btn-accept-transfer-${req.id}`}
                    >
                      <Check className="w-4 h-4" />
                      <span>{isAr ? 'قبول واستلام الشكوى في عهدتي' : 'Accept Transfer'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Outgoing Transfers History */}
          {outgoingTransfers.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                {isAr ? 'طلبات التحويل التي أرسلتها أنت للزملاء:' : 'Outgoing Transfer Requests Sent by You:'}
              </h3>
              <div className="space-y-2">
                {outgoingTransfers.map(out => (
                  <div key={out.id} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono text-amber-400 font-bold ml-2 rtl:ml-2 ltr:mr-2">{out.ticketNumber}</span>
                      <span className="text-slate-300">{isAr ? 'مرسل إلى الزميل:' : 'Sent to:'} <strong>{out.toEmployeeName}</strong></span>
                    </div>
                    <div>
                      {out.status === 'pending' && (
                        <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] border border-amber-500/20 font-semibold">
                          {isAr ? 'في انتظار قبوله' : 'Pending Colleague Acceptance'}
                        </span>
                      )}
                      {out.status === 'accepted' && (
                        <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] border border-emerald-500/20 font-semibold">
                          {isAr ? 'تم القبول وانتقلت إليه' : 'Accepted by Colleague'}
                        </span>
                      )}
                      {out.status === 'rejected' && (
                        <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px] border border-rose-500/20 font-semibold">
                          {isAr ? 'اعتذر الزميل وبقيت عندك' : 'Declined'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RESOLVED COMPLAINTS */}
      {activeTab === 'resolved' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? `سجل الشكاوى التي تم حلها بنجاح (${myResolvedComplaints.length})` : `Resolved Complaints History (${myResolvedComplaints.length})`}</span>
          </h2>

          {myResolvedComplaints.length === 0 ? (
            <div className="bg-[#101830] border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              <p className="text-xs">{isAr ? 'لم تقم بحل أي شكاوى بعد.' : 'No resolved complaints yet.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myResolvedComplaints.map(item => (
                <div key={item.id} className="bg-[#101830] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-amber-400">{item.id}</span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {isAr ? 'تم الحل والإغلاق' : 'Resolved & Closed'}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm">{item.title}</h3>
                  
                  {/* Visitor files */}
                  {item.attachments && item.attachments.length > 0 && (
                    <FileAttachmentViewer
                      attachments={item.attachments}
                      title={isAr ? 'مرفقات البلاغ الأصلية من المبلّغ' : 'Original Complainant Attachments'}
                      isAr={isAr}
                      accentColor="amber"
                    />
                  )}

                  {/* Resolution Notes */}
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-100">
                    <span className="block font-bold text-emerald-400 mb-1">{isAr ? 'الحل والإجراء التصحيحي المتخذ:' : 'Resolution & Corrective Actions Taken:'}</span>
                    <p className="leading-relaxed whitespace-pre-wrap">{item.resolutionNotes}</p>
                    {item.resolvedAt && (
                      <span className="text-[10px] text-slate-400 block mt-2">
                        {isAr ? 'تاريخ الاعتماد:' : 'Date:'} {new Date(item.resolvedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    )}
                  </div>

                  {/* Resolution files */}
                  {item.resolutionAttachments && item.resolutionAttachments.length > 0 && (
                    <FileAttachmentViewer
                      attachments={item.resolutionAttachments}
                      title={isAr ? 'مستندات وتقارير الحل المرفقة منك' : 'Your Attached Resolution Documents'}
                      isAr={isAr}
                      accentColor="emerald"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CHANGE MY PASSCODE ("ولما بيدخل يقدر يغير كوده من جوا") */}
      {isChangeCodeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h2 className="text-base font-bold text-white mb-1">
              {isAr ? 'تغيير الكود السري الوظيفي' : 'Update Your Passcode'}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {isAr ? 'أدخل كودك الجديد الذي ستستخدمه لتسجيل الدخول في المرات القادمة' : 'Enter a new passcode for your future logins'}
            </p>

            <form onSubmit={handleChangeCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={newCodeInput}
                  onChange={e => setNewCodeInput(e.target.value)}
                  placeholder={isAr ? 'الكود الجديد (مثال: EMP-999 أو 5566)' : 'New Code (e.g. 5566)'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none text-center font-mono"
                  id="input-new-employee-code"
                />
              </div>

              {codeChangeSuccess && (
                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'تم تحديث كودك السري بنجاح!' : 'Passcode updated successfully!'}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangeCodeModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
                  id="btn-save-new-code"
                >
                  {isAr ? 'حفظ الكود' : 'Save Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESOLVE COMPLAINT ("وامكانيه انه يقدر يحط في الشكوي في الحل ملاحظاات او ملفات وكمان بيقفلها بقا عشان ترجع للزائر الي مقدم الشكوي بلحل") */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{isAr ? 'حل الشكوى وإغلاق البلاغ نهائياً' : 'Resolve & Close Complaint'}</span>
              </h2>
              <button onClick={() => setResolvingComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-amber-400 font-bold">{resolvingComplaint.id}</span>
                <span className="text-slate-400">{resolvingComplaint.category}</span>
              </div>
              <p className="font-bold text-white text-sm">{resolvingComplaint.title}</p>
              <p className="text-slate-300 text-xs bg-slate-950/60 p-3 rounded-lg leading-relaxed">
                {resolvingComplaint.description}
              </p>

              {/* Visitor attachments for employee reference */}
              {resolvingComplaint.attachments && resolvingComplaint.attachments.length > 0 && (
                <FileAttachmentViewer
                  attachments={resolvingComplaint.attachments}
                  title={isAr ? 'مستندات المبلّغ المرفقة للاطلاع عليها' : 'Complainant Submitted Evidence'}
                  isAr={isAr}
                  accentColor="amber"
                />
              )}

              {/* Reopen note if any */}
              {resolvingComplaint.status === 'reopened' && (
                <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 text-xs text-rose-200">
                  <span className="font-bold text-rose-400 block mb-1">
                    {isAr ? '⚠️ ملاحظات اعتراض المشتكي على الحل السابق:' : '⚠️ Complainant Objection Feedback:'}
                  </span>
                  <p className="italic">"{resolvingComplaint.visitorFeedback}"</p>
                </div>
              )}
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isAr ? 'ملاحظات وإجراءات الحل المتخذة (ستظهر للزائر المبلّغ) *' : 'Resolution Notes & Corrective Actions *'}
                </label>
                <textarea
                  rows={5}
                  required
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder={isAr ? 'اكتب ما تم من تحقيقات وإجراءات تصحيحية وقرارات لحل هذه المخالفة...' : 'State investigations completed and corrective measures taken...'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none leading-relaxed"
                  id="textarea-resolution-notes"
                />
              </div>

              {/* Attach Resolution Documents */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isAr ? 'إرفاق تقارير أو مستندات الحل (اختياري - يراها المشتكي والمدير والمراجعة)' : 'Attach Resolution Reports / Documents (Optional)'}</span>
                </label>

                <div className="mb-3">
                  <label className="border border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-900/60">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-slate-300 font-medium">
                      {isAr ? 'اختر ملفاً حقيقياً من جهازك لإرفاقه في تقرير الحل' : 'Upload file from device for resolution report'}
                    </span>
                    <input
                      type="file"
                      onChange={handleResolutionFileUpload}
                      className="hidden"
                      id="input-res-file-picker"
                    />
                  </label>
                </div>

                {resolutionFiles.length > 0 && (
                  <FileAttachmentViewer
                    attachments={resolutionFiles}
                    title={isAr ? 'الملفات المرفقة للحل قبل الاعتماد' : 'Attached Resolution Documents Preview'}
                    isAr={isAr}
                    canDelete
                    onDelete={id => setResolutionFiles(prev => prev.filter(f => f.id !== id))}
                    accentColor="emerald"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolvingComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
                  id="btn-confirm-resolve-submit"
                >
                  {isAr ? 'إغلاق الشكوى وإرسال الحل للزائر' : 'Finalize & Send Resolution to Visitor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TRANSFER COMPLAINT TO COLLEAGUE ("يبعت الشكوي الي جايله من الادمن لموظف زميله بس بشرط ان الموظف ده يقبلها عشان تتشال من الاولاني وتتحط عند التاني") */}
      {transferringComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>{isAr ? 'تحويل الشكوى إلى زميل' : 'Delegate / Transfer to Colleague'}</span>
              </h2>
              <button onClick={() => setTransferringComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 text-xs text-sky-300 mb-4">
              {isAr
                ? 'ملاحظة هامة: الشكوى لن تُنقل رسمياً إلا بعد أن يوافق الزميل على قبولها في بوابته، وذلك لضمان عدم ضياع المهام والمسؤوليات.'
                : 'Note: The complaint will only transfer once the colleague accepts it in their portal.'}
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isAr ? 'اختر الزميل المراد تحويل الشكوى إليه *' : 'Select Colleague *'}
                </label>
                <select
                  required
                  value={targetColleagueId}
                  onChange={e => setTargetColleagueId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 text-xs text-white outline-none"
                  id="select-transfer-colleague"
                >
                  <option value="">{isAr ? '-- اختر زميلاً --' : '-- Select Colleague --'}</option>
                  {employees
                    .filter(e => e.id !== currentUser?.id && e.role === 'employee')
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {isAr ? 'سبب ومبرر التحويل للزميل *' : 'Transfer Justification Reason *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  placeholder={isAr ? 'وضح سبب التحويل (مثال: الموضوع يقع ضمن اختصاص إدارة الموارد البشرية وليس المالية)...' : 'State reason (e.g. relates to HR department)...'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 outline-none"
                  id="textarea-transfer-reason"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferringComplaint(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow"
                  id="btn-send-transfer-req"
                >
                  {isAr ? 'إرسال طلب التحويل' : 'Send Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: INSPECT COMPLAINT DOSSIER & TIMELINE */}
      {inspectComplaint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[88vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400">{inspectComplaint.id}</span>
                <span className="text-xs text-slate-400">({inspectComplaint.category})</span>
              </div>
              <button onClick={() => setInspectComplaint(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div>
              <h3 className="font-bold text-white text-base mb-2">{inspectComplaint.title}</h3>
              <p className="text-xs text-slate-300 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                {inspectComplaint.description}
              </p>
            </div>

            {/* Visitor attachments */}
            {inspectComplaint.attachments && inspectComplaint.attachments.length > 0 && (
              <FileAttachmentViewer
                attachments={inspectComplaint.attachments}
                title={isAr ? 'مستندات البلاغ المرفوعة من المشتكي' : 'Evidence Uploaded by Complainant'}
                isAr={isAr}
                accentColor="amber"
              />
            )}

            {/* If Reopened: Visitor Feedback */}
            {inspectComplaint.status === 'reopened' && (
              <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3.5 text-xs">
                <span className="font-bold text-rose-400 block mb-1">
                  {isAr ? '⚠️ اعتراض المشتكي وملاحظاته لإعادة الفتح:' : '⚠️ Complainant Reopen Reason / Feedback:'}
                </span>
                <p className="text-rose-100 italic leading-relaxed whitespace-pre-wrap">{inspectComplaint.visitorFeedback}</p>
                {inspectComplaint.visitorFeedbackAt && (
                  <span className="text-[10px] text-slate-400 block mt-1.5">
                    {new Date(inspectComplaint.visitorFeedbackAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                  </span>
                )}
              </div>
            )}

            {/* Resolution Section if available */}
            {inspectComplaint.resolutionNotes && (
              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 text-xs text-emerald-100 space-y-2">
                <span className="font-bold text-emerald-400 block">
                  {isAr ? 'بيانات الحل والإجراءات التصحيحية المسجلة:' : 'Recorded Resolution & Actions:'}
                </span>
                <p className="leading-relaxed whitespace-pre-wrap">{inspectComplaint.resolutionNotes}</p>
                
                {inspectComplaint.resolutionAttachments && inspectComplaint.resolutionAttachments.length > 0 && (
                  <div className="pt-2">
                    <FileAttachmentViewer
                      attachments={inspectComplaint.resolutionAttachments}
                      title={isAr ? 'مستندات الحل المرفقة' : 'Resolution Documents'}
                      isAr={isAr}
                      accentColor="emerald"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Timeline Audit Trail */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isAr ? 'سجل التتبع والمسار الزمني الموثق:' : 'Audit Trail & Event Log:'}
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {inspectComplaint.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                    <div className="flex justify-between font-bold text-white mb-0.5">
                      <span>{event.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(event.timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] mb-0.5">{event.description}</p>
                    <span className="text-amber-400 text-[10px]">{event.actorName}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setInspectComplaint(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
