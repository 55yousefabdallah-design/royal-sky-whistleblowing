import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Complaint, Attachment } from '../../types';
import { DEPARTMENTS } from '../../data/mockData';
import { FileAttachmentViewer } from '../common/FileAttachmentViewer';
import { 
  FileText, 
  Send, 
  History, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  Copy, 
  Check, 
  Paperclip, 
  UploadCloud, 
  X, 
  ArrowRight, 
  ArrowLeft,
  Lock,
  Download,
  Calendar,
  Building,
  User,
  ExternalLink,
  Shuffle,
  RotateCcw
} from 'lucide-react';

export const VisitorPortal: React.FC = () => {
  const { language, setCurrentPortal, submitComplaint, getVisitorTickets, visitorReopenComplaint, currentUser, setCurrentUser } = useApp();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');

  // Submit Form State
  const [alias, setAlias] = useState(currentUser?.role === 'visitor' ? currentUser.alias || '' : '');
  const [passcode, setPasscode] = useState(currentUser?.role === 'visitor' ? currentUser.passcode || '' : '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(DEPARTMENTS[0]);
  const [urgency, setUrgency] = useState<Complaint['urgency']>('medium');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Submit Success State
  const [submittedTicket, setSubmittedTicket] = useState<Complaint | null>(null);
  const [copied, setCopied] = useState(false);

  // History Tab State
  const [historyAlias, setHistoryAlias] = useState(currentUser?.role === 'visitor' ? currentUser.alias || '' : '');
  const [historyPasscode, setHistoryPasscode] = useState(currentUser?.role === 'visitor' ? currentUser.passcode || '' : '');
  const [historyTickets, setHistoryTickets] = useState<Complaint[]>(() => {
    if (currentUser?.role === 'visitor' && currentUser.alias && currentUser.passcode) {
      return getVisitorTickets(currentUser.alias, currentUser.passcode);
    }
    return [];
  });
  const [isHistorySearched, setIsHistorySearched] = useState(
    Boolean(currentUser?.role === 'visitor' && currentUser.alias)
  );
  const [selectedTicketDetail, setSelectedTicketDetail] = useState<Complaint | null>(null);

  // Complainant Feedback / Reopen Objection State
  const [isReopenFormOpen, setIsReopenFormOpen] = useState(false);
  const [reopenFeedback, setReopenFeedback] = useState('');
  const [reopenAttachments, setReopenAttachments] = useState<Attachment[]>([]);
  const [reopenSuccessMessage, setReopenSuccessMessage] = useState<string | null>(null);

  // Random alias suggestions
  const generateRandomAlias = () => {
    const listAr = ['فاعل خير 2026', 'صوت النزاهة', 'موظف حريص', 'طائر السلام', 'شاهد عيان', 'مراقب محايد'];
    const listEn = ['Silent Observer', 'Good Citizen', 'Honest Voice', 'Fair Watcher', 'Truth Seeker'];
    const pick = isAr 
      ? listAr[Math.floor(Math.random() * listAr.length)]
      : listEn[Math.floor(Math.random() * listEn.length)];
    setAlias(pick);
    if (!passcode) {
      setPasscode(`pin-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAtt: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        setAttachments(prev => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleReopenFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAtt: Attachment = {
          id: `att-reopen-${Date.now()}`,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'application/octet-stream',
          dataUrl: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        setReopenAttachments(prev => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleReopenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketDetail || !reopenFeedback.trim()) return;

    visitorReopenComplaint(selectedTicketDetail.id, reopenFeedback.trim(), reopenAttachments);
    
    // Refresh history
    const updatedTickets = getVisitorTickets(historyAlias.trim(), historyPasscode.trim());
    setHistoryTickets(updatedTickets);
    
    const updatedSelected = updatedTickets.find(t => t.id === selectedTicketDetail.id);
    if (updatedSelected) {
      setSelectedTicketDetail(updatedSelected);
    }

    setReopenSuccessMessage(
      isAr
        ? 'تم إرسال ردك واعتراضك بنجاح، وأعيد فتح الشكوى وإحالتها للموظف المختص فوراً!'
        : 'Your objection was sent successfully. The complaint has been reopened and dispatched back to staff!'
    );
    setIsReopenFormOpen(false);
    setReopenFeedback('');
    setReopenAttachments([]);

    setTimeout(() => {
      setReopenSuccessMessage(null);
    }, 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim() || !passcode.trim() || !title.trim() || !description.trim()) {
      alert(isAr ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    const created = submitComplaint({
      alias: alias.trim(),
      passcode: passcode.trim(),
      title: title.trim(),
      category,
      urgency,
      description: description.trim(),
      attachments,
    });

    setSubmittedTicket(created);
    setCurrentUser({
      role: 'visitor',
      alias: alias.trim(),
      passcode: passcode.trim(),
    });

    // Reset fields
    setTitle('');
    setDescription('');
    setAttachments([]);
  };

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchHistory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!historyAlias.trim() || !historyPasscode.trim()) {
      alert(isAr ? 'يرجى إدخال الاسم الوهمي والكود السري' : 'Please provide alias and passcode');
      return;
    }
    const results = getVisitorTickets(historyAlias.trim(), historyPasscode.trim());
    setHistoryTickets(results);
    setIsHistorySearched(true);
    setCurrentUser({
      role: 'visitor',
      alias: historyAlias.trim(),
      passcode: historyPasscode.trim(),
    });
  };

  const getStatusBadge = (status: Complaint['status']) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            {isAr ? 'جديدة (في انتظار الإسناد)' : 'New (Pending Dispatch)'}
          </span>
        );
      case 'assigned':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            {isAr ? 'قيد التحقيق والمعالجة' : 'Under Investigation'}
          </span>
        );
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isAr ? 'تم الحل والإغلاق' : 'Resolved & Closed'}
          </span>
        );
      case 'reopened':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <RotateCcw className="w-3.5 h-3.5" />
            {isAr ? 'معاد فتحها (اعتراض على الحل)' : 'Reopened (Complainant Objection)'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentPortal('home')}
          className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-amber-400 transition-colors"
          id="visitor-back-btn"
        >
          {isAr ? (
            <>
              <ArrowRight className="w-4 h-4" />
              العودة للرئيسية
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </>
          )}
        </button>

        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? 'نظام تشفير بدون تتبع IP أو هوية' : 'End-to-End Encrypted & Untraceable'}</span>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6 mb-8 text-center relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-3">
          <FileText className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {isAr ? 'بوابة الزائر والمبلّغ السري' : 'Visitor & Anonymous Reporting Portal'}
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          {isAr
            ? 'يمكنك هنا تسجيل بلاغ جديد باختيار أي اسم وكود وهميين، أو تسجيل الدخول بنفس الاسم والكود لمتابعة شكاواك السابقة والاطلاع على الحل الذي قدمه الموظف.'
            : 'Submit a new report with any custom alias and secret passcode, or log in with them to view your past reports and check their solutions.'}
        </p>

        {/* Tab Switcher */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('submit');
                setSubmittedTicket(null);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'submit'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="visitor-tab-submit"
            >
              <Send className="w-3.5 h-3.5" />
              {isAr ? 'تقديم شكوى جديدة' : 'Submit New Complaint'}
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              id="visitor-tab-history"
            >
              <History className="w-3.5 h-3.5" />
              {isAr ? 'سجل ومتابعة الشكاوى السابقة' : 'Track Existing Complaints'}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: SUBMIT NEW COMPLAINT */}
      {activeTab === 'submit' && (
        <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6 sm:p-8">
          {submittedTicket ? (
            /* Submission Success Screen */
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">
                {isAr ? 'تم استلام بلاغك وتوليد رقم التذكرة بنجاح!' : 'Report Received Successfully!'}
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto mb-6">
                {isAr
                  ? 'تم تشفير بلاغك وإرساله إلى صندوق الامتثال المعتمد. يرجى الاحتفاظ برقم التذكرة واسمك وكودك السري للمتابعة.'
                  : 'Your report is encrypted and sent to compliance. Please save your ticket ID, alias, and passcode for tracking.'}
              </p>

              {/* Ticket Card */}
              <div className="max-w-md mx-auto bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 mb-8 text-center shadow-lg">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block mb-1">
                  {isAr ? 'رقم التذكرة المشفر' : 'Encrypted Ticket Number'}
                </span>
                <div className="flex items-center justify-center gap-3 my-2">
                  <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-widest">
                    {submittedTicket.id}
                  </span>
                  <button
                    onClick={() => handleCopyTicket(submittedTicket.id)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                    title={isAr ? 'نسخ رقم التذكرة' : 'Copy Ticket Number'}
                    id="copy-ticket-btn"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="text-xs text-slate-400 pt-3 border-t border-slate-800 flex justify-around">
                  <span>{isAr ? 'الاسم المستعار:' : 'Alias:'} <strong className="text-slate-200">{submittedTicket.anonymousAlias}</strong></span>
                  <span>{isAr ? 'الكود السري:' : 'Passcode:'} <strong className="text-slate-200">{submittedTicket.anonymousPasscode}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => {
                    setHistoryAlias(submittedTicket.anonymousAlias);
                    setHistoryPasscode(submittedTicket.anonymousPasscode);
                    handleSearchHistory();
                    setActiveTab('history');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
                  id="go-track-ticket-btn"
                >
                  <History className="w-4 h-4" />
                  {isAr ? 'متابعة هذه الشكوى الآن' : 'Track This Complaint Now'}
                </button>
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
                  id="submit-another-btn"
                >
                  {isAr ? 'تقديم شكوى أخرى' : 'Submit Another Complaint'}
                </button>
              </div>
            </div>
          ) : (
            /* Submit Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Alias & Passcode Row */}
              <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <Lock className="w-4 h-4" />
                    <span>{isAr ? 'بيانات الهوية الوهمية (لحفظ خصوصيتك ومتابعة السجل لاحقاً)' : 'Anonymous Credentials (For Your Privacy & Future Tracking)'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomAlias}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 underline font-medium"
                    id="generate-alias-btn"
                  >
                    <Shuffle className="w-3 h-3" />
                    <span>{isAr ? 'اقتراح اسم عشوائي' : 'Suggest Alias'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {isAr ? 'اسم مستعار وهمي *' : 'Anonymous Alias *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={alias}
                      onChange={e => setAlias(e.target.value)}
                      placeholder={isAr ? 'مثال: فاعل خير، مراقب محايد، سيف' : 'e.g. Fair Witness, Good Citizen'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                      id="input-visitor-alias"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isAr ? 'لا تكتب اسمك الحقيقي، اختر أي اسم يعجبك' : 'Never enter your real name; choose any alias'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {isAr ? 'كود سري وهمي (PIN) *' : 'Secret Passcode (PIN) *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={passcode}
                      onChange={e => setPasscode(e.target.value)}
                      placeholder={isAr ? 'مثال: 1234 أو pass2026' : 'e.g. 1234 or pass2026'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors font-mono"
                      id="input-visitor-passcode"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      {isAr ? 'ستستخدم هذا الكود مع الاسم لمشاهدة الرد والحل' : 'Used with alias to log back in and see the solution'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Category & Urgency */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {isAr ? 'موضوع / عنوان الشكوى *' : 'Complaint Subject / Title *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={isAr ? 'أدخل ملخصاً واضحاً للمخالفة أو الشكوى...' : 'Enter a clear summary of the issue...'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                    id="input-visitor-title"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {isAr ? 'الإدارة أو التصنيف المعني *' : 'Department / Category *'}
                    </label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                      id="select-visitor-category"
                    >
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      {isAr ? 'درجة الأهمية / الخطورة' : 'Urgency Level'}
                    </label>
                    <select
                      value={urgency}
                      onChange={e => setUrgency(e.target.value as Complaint['urgency'])}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3.5 py-2.5 text-xs text-white outline-none transition-colors"
                      id="select-visitor-urgency"
                    >
                      <option value="low">{isAr ? 'عادية / منخفضة' : 'Low'}</option>
                      <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                      <option value="high">{isAr ? 'عالية الأهمية' : 'High'}</option>
                      <option value="critical">{isAr ? 'حرجة جداً / طارئة' : 'Critical'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {isAr ? 'التفاصيل الدقيقة للشكوى أو المخالفة *' : 'Detailed Description *'}
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={isAr ? 'يرجى ذكر الوقائع والتواريخ والأطراف المشاركة بدقة لمساعدة فريق الامتثال في التحقيق...' : 'Describe facts, dates, departments involved accurately...'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg p-3 text-xs text-white placeholder-slate-500 outline-none transition-colors resize-y leading-relaxed"
                    id="textarea-visitor-description"
                  />
                </div>

                {/* Attachments Section */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                      {isAr ? 'إرفاق وثائق أو مستندات أو صور داعمة (اختياري)' : 'Supporting Documents & Proof (Optional)'}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {isAr ? 'يتم إزالة بيانات الميتا داتا تلقائياً' : 'Metadata automatically stripped'}
                    </span>
                  </div>

                  <div className="mb-3">
                    <label className="w-full border-2 border-dashed border-slate-800 hover:border-amber-500/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-900/40 group">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-semibold text-slate-200 block">
                          {isAr ? 'انقر لاختيار ملف من جهازك (PDF، صور، مستندات)' : 'Click to select files (PDF, images, documents)'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {isAr ? 'الحد الأقصى للملف: 25 ميجابايت' : 'Maximum file size: 25MB'}
                        </span>
                      </div>
                      <input
                        type="file"
                        onChange={handleSimulatedFileUpload}
                        className="hidden"
                        id="input-visitor-file"
                      />
                    </label>
                  </div>

                  {/* Attachment List */}
                  {attachments.length > 0 && (
                    <div className="pt-2">
                      <FileAttachmentViewer
                        attachments={attachments}
                        isAr={isAr}
                        canDelete
                        onDelete={id => setAttachments(prev => prev.filter(a => a.id !== id))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                  id="submit-complaint-btn"
                >
                  <Send className="w-4 h-4" />
                  <span>{isAr ? 'إرسال الشكوى والحصول على رقم التذكرة' : 'Submit Complaint & Generate Ticket'}</span>
                </button>
              </div>

            </form>
          )}
        </div>
      )}

      {/* TAB 2: TRACK PREVIOUS COMPLAINTS & VIEW RESOLUTIONS */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* History Search Box */}
          <div className="bg-[#101830] border border-slate-800 rounded-2xl p-6">
            <div className="mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                {isAr ? 'تسجيل الدخول لمتابعة الشكاوى السابقة' : 'Login to View Past Reports'}
              </h2>
            </div>

            <form onSubmit={handleSearchHistory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isAr ? 'اسمك المستعار الذي استخدمته *' : 'Your Anonymous Alias *'}
                </label>
                <input
                  type="text"
                  required
                  value={historyAlias}
                  onChange={e => setHistoryAlias(e.target.value)}
                  placeholder={isAr ? 'مثال: فاعل خير 2026' : 'e.g. Fair Witness'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  id="input-history-alias"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {isAr ? 'الكود السري الوهمي (PIN) *' : 'Secret Passcode (PIN) *'}
                </label>
                <input
                  type="text"
                  required
                  value={historyPasscode}
                  onChange={e => setHistoryPasscode(e.target.value)}
                  placeholder={isAr ? 'مثال: pass123' : 'e.g. pass123'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono"
                  id="input-history-passcode"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow"
                  id="btn-history-search"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isAr ? 'استعراض تاريخ شكاواي' : 'View My History'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Search Results List */}
          {isHistorySearched && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">
                  {isAr
                    ? `سجل البلاغات المسجلة باسم: [${historyAlias}] (${historyTickets.length} تذكرة)`
                    : `Reports registered under: [${historyAlias}] (${historyTickets.length} tickets)`}
                </span>
              </div>

              {historyTickets.length === 0 ? (
                <div className="bg-[#101830] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    {isAr ? 'لم يتم العثور على أي شكاوى مطابقة للاسم والكود المدخلين.' : 'No complaints found matching this alias and passcode.'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {isAr ? 'تأكد من كتابة الاسم والكود كما تم إدخالهما تماماً عند تقديم الشكوى.' : 'Check your alias and passcode credentials and retry.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyTickets.map(ticket => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketDetail(ticket)}
                      className="bg-[#101830] hover:bg-[#141f3d] border border-slate-800 hover:border-amber-500/50 rounded-xl p-5 cursor-pointer transition-all shadow-sm"
                      id={`history-ticket-${ticket.id}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {ticket.id}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(ticket.submittedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                          </span>
                        </div>
                        <div>{getStatusBadge(ticket.status)}</div>
                      </div>

                      <h3 className="text-base font-bold text-white mb-1.5">{ticket.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                        {ticket.description}
                      </p>

                      {/* If Resolved, Highlight Solution Preview */}
                      {ticket.resolutionNotes && (
                        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-3 text-xs mb-3">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isAr ? 'تم تقديم الحل من الموظف المختص:' : 'Resolution provided:'}</span>
                          </div>
                          <p className="text-emerald-200 line-clamp-2">{ticket.resolutionNotes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <span>
                          {isAr ? 'التصنيف:' : 'Category:'} <strong className="text-slate-300">{ticket.category}</strong>
                        </span>
                        <span className="text-amber-400 font-medium flex items-center gap-1">
                          {isAr ? 'عرض التفاصيل الكاملة والحل' : 'View Full Details & Solution'}
                          {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicketDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  {selectedTicketDetail.id}
                </span>
                <div>{getStatusBadge(selectedTicketDetail.status)}</div>
              </div>
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                id="close-ticket-detail-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Title & Metadata */}
            <h2 className="text-lg font-bold text-white mb-2">{selectedTicketDetail.title}</h2>
            <div className="flex flex-wrap gap-4 text-xs text-slate-400 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">{isAr ? 'تاريخ التقديم' : 'Submitted Date'}</span>
                <span className="font-semibold text-slate-200">
                  {new Date(selectedTicketDetail.submittedAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{isAr ? 'التصنيف' : 'Category'}</span>
                <span className="font-semibold text-slate-200">{selectedTicketDetail.category}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{isAr ? 'الموظف المسؤول' : 'Assigned Staff'}</span>
                <span className="font-semibold text-amber-400">
                  {selectedTicketDetail.assignedToEmployeeName || (isAr ? 'في انتظار التوجيه' : 'Awaiting Dispatch')}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                {isAr ? 'تفاصيل البلاغ المسجل:' : 'Report Description:'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/80 whitespace-pre-wrap">
                {selectedTicketDetail.description}
              </p>
            </div>

            {/* Attached files by visitor */}
            {selectedTicketDetail.attachments && selectedTicketDetail.attachments.length > 0 && (
              <div className="mb-6">
                <FileAttachmentViewer
                  attachments={selectedTicketDetail.attachments}
                  title={isAr ? 'المرفقات المرفوعة مع الشكوى' : 'Submitted Attachments'}
                  isAr={isAr}
                  accentColor="amber"
                />
              </div>
            )}

            {/* SPECIAL SECTION: RESOLUTION DETAILS PROVIDED BY EMPLOYEE */}
            {selectedTicketDetail.resolutionNotes ? (
              <div className="mb-6 space-y-4">
                <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-lg shadow-emerald-950/30">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>{isAr ? 'الحل والإجراء التصحيحي المتخذ من الشركة:' : 'Company Resolution & Action Taken:'}</span>
                  </div>
                  
                  <p className="text-xs text-emerald-100 leading-relaxed bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20 whitespace-pre-wrap mb-3">
                    {selectedTicketDetail.resolutionNotes}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-emerald-500/20">
                    <span>
                      {isAr ? 'تم الحل بواسطة:' : 'Resolved by:'}{' '}
                      <strong className="text-emerald-300">{selectedTicketDetail.resolvedByEmployeeName}</strong>
                    </span>
                    {selectedTicketDetail.resolvedAt && (
                      <span>
                        {isAr ? 'بتاريخ:' : 'Date:'}{' '}
                        <strong className="text-emerald-300">
                          {new Date(selectedTicketDetail.resolvedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Resolution attachments */}
                  {selectedTicketDetail.resolutionAttachments && selectedTicketDetail.resolutionAttachments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-emerald-500/20">
                      <FileAttachmentViewer
                        attachments={selectedTicketDetail.resolutionAttachments}
                        title={isAr ? 'مستندات الحل والتقارير المرفقة من الموظف' : 'Attached Resolution Documents'}
                        isAr={isAr}
                        accentColor="emerald"
                      />
                    </div>
                  )}
                </div>

                {/* VISITOR OBJECTION / REPLY / REOPEN BOX */}
                {reopenSuccessMessage && (
                  <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-300 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{reopenSuccessMessage}</span>
                  </div>
                )}

                {selectedTicketDetail.status === 'reopened' ? (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-1.5">
                      <RotateCcw className="w-4 h-4" />
                      <span>{isAr ? 'تم تسجيل ردك واعتراضك - الشكوى قيد المراجعة الثانية من الموظف' : 'Objection Registered - Staff Under Second Review'}</span>
                    </div>
                    <p className="text-xs text-slate-200 bg-slate-900/80 p-3 rounded-xl border border-slate-800 leading-relaxed mb-2">
                      {selectedTicketDetail.visitorFeedback}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {selectedTicketDetail.visitorFeedbackAt && new Date(selectedTicketDetail.visitorFeedbackAt).toLocaleString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                ) : (
                  <div className="bg-[#0f1b38] border border-amber-500/30 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0">
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">
                            {isAr ? 'هل أنت غير راضٍ عن الحل أو لديك استفسار؟' : 'Not satisfied with this resolution or have concerns?'}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {isAr
                              ? 'يمكنك الرد وتقديم ملاحظاتك لإعادة فتح الشكوى فوراً وتوجيهها للموظف لمراجعتها.'
                              : 'You can reply with your feedback to immediately reopen the complaint and return it to staff.'}
                          </p>
                        </div>
                      </div>

                      {!isReopenFormOpen && (
                        <button
                          type="button"
                          onClick={() => setIsReopenFormOpen(true)}
                          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 flex-shrink-0"
                          id="btn-open-reopen-form"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isAr ? 'اعتراض وإعادة فتح الشكوى' : 'Reply & Reopen Ticket'}</span>
                        </button>
                      )}
                    </div>

                    {isReopenFormOpen && (
                      <form onSubmit={handleReopenSubmit} className="mt-4 space-y-3 pt-3 border-t border-slate-800">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-1">
                            {isAr ? 'سبب الاعتراض أو الملاحظات التفصيلية على الحل *' : 'Explain your objection or reason in detail *'}
                          </label>
                          <textarea
                            required
                            rows={3}
                            value={reopenFeedback}
                            onChange={e => setReopenFeedback(e.target.value)}
                            placeholder={isAr ? 'الحل المقترح غير مرضٍ أو غير كافٍ لأن...' : 'The proposed resolution is unsatisfactory because...'}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none leading-relaxed"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1.5">
                            {isAr ? 'إرفاق مستندات أو صور إثبات إضافية (اختياري):' : 'Attach additional supporting files/images (optional):'}
                          </label>
                          <input
                            type="file"
                            onChange={handleReopenFileUpload}
                            className="text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 cursor-pointer"
                          />
                          {reopenAttachments.length > 0 && (
                            <div className="mt-2">
                              <FileAttachmentViewer
                                attachments={reopenAttachments}
                                isAr={isAr}
                                canDelete
                                onDelete={id => setReopenAttachments(prev => prev.filter(a => a.id !== id))}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setIsReopenFormOpen(false)}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                          >
                            {isAr ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center gap-1.5"
                            id="btn-submit-reopen-objection"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إرسال الرد وإعادة فتح الشكوى للموظف' : 'Send Reply & Reopen Ticket'}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-6 bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-200 block">
                    {isAr ? 'الشكوى قيد المراجعة والتحقيق' : 'Under Investigation'}
                  </span>
                  <span>
                    {isAr
                      ? 'يقوم الموظف المسؤول بدراسة الشكوى حالياً. بمجرد اتخاذ الإجراء سيظهر الحل هنا بالتفصيل.'
                      : 'The assigned staff is reviewing this complaint. Resolution details will be posted here once finalized.'}
                  </span>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                {isAr ? 'سجل مراحل الشكوى (Timeline):' : 'Investigation Timeline:'}
              </h3>
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 rtl:before:right-3 rtl:before:left-auto before:w-0.5 before:bg-slate-800">
                {selectedTicketDetail.timeline.map((event, idx) => (
                  <div key={event.id || idx} className="relative flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-amber-500/40 flex items-center justify-center flex-shrink-0 z-10">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                    </div>
                    <div className="flex-1 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-white">{event.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(event.timestamp).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{event.description}</p>
                      <span className="inline-block mt-1 text-[10px] text-amber-400 font-medium">
                        بواسطة: {event.actorName}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer close */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTicketDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                id="btn-close-modal-bottom"
              >
                {isAr ? 'إغلاق النافذة' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
