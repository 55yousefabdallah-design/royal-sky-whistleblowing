import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DEPARTMENTS, downloadEmployeeTemplateCSV } from '../../data/mockData';
import { 
  UploadCloud, 
  Download, 
  FileText, 
  Check, 
  AlertCircle, 
  X, 
  Trash2, 
  Users, 
  ShieldCheck,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ArrowDownToLine
} from 'lucide-react';

interface ParsedEmployeeRow {
  id: string;
  name: string;
  code: string;
  department: string;
  role: 'employee' | 'admin' | 'audit';
  email: string;
  isValid: boolean;
  validationError?: string;
}

interface BulkEmployeeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BulkEmployeeImportModal: React.FC<BulkEmployeeImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { language, bulkImportEmployees } = useApp();
  const isAr = language === 'ar';

  const [importMode, setImportMode] = useState<'upload' | 'paste'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [activeEncoding, setActiveEncoding] = useState<'auto' | 'utf-8' | 'windows-1256'>('auto');
  const [rawText, setRawText] = useState(
    'م. محمد الشناوي\tEMP-101\tالشؤون المالية والمحاسبة\temployee\tm.shinawy@royalsky.com\nأ. فاطمة الزهراء\tEMP-102\tالموارد البشرية والإدارية\temployee\tfatima.z@royalsky.com\nم. طارق العوضي\tEMP-103\tالعمليات وسلاسل الإمداد\temployee\ttarek.a@royalsky.com\nأ. سارة المنصوري\tAUD-200\tالمراجعة والتدقيق الداخلي\taudit\tsara.audit@royalsky.com'
  );
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [hasParsed, setHasParsed] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCSVContent = (content: string) => {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');
    const lines = cleanContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    const rows: ParsedEmployeeRow[] = [];

    lines.forEach((line, index) => {
      // Detect delimiter: tab (Excel copy), semicolon, or comma
      let delimiter = ',';
      if (line.includes('\t')) delimiter = '\t';
      else if (line.includes(';') && !line.includes(',')) delimiter = ';';

      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ''));

      // Skip header row if it contains known header labels
      const firstCol = parts[0]?.toLowerCase() || '';
      if (
        index === 0 &&
        (firstCol.includes('الاسم') ||
          firstCol.includes('name') ||
          firstCol.includes('employee') ||
          firstCol.includes('كود'))
      ) {
        return;
      }

      if (parts.length < 2 || !parts[0]) return;

      const name = parts[0];
      const code = parts[1] || `EMP-${Math.floor(100 + Math.random() * 900)}`;
      const department = parts[2] || DEPARTMENTS[0];
      const rawRole = (parts[3] || 'employee').toLowerCase();
      const role: 'employee' | 'admin' | 'audit' =
        rawRole.includes('admin') || rawRole.includes('أدمن') || rawRole.includes('ادمن')
          ? 'admin'
          : rawRole.includes('audit') || rawRole.includes('مدقق') || rawRole.includes('تدقيق')
          ? 'audit'
          : 'employee';
      const email = parts[4] || '';

      const isValid = Boolean(name && code);

      rows.push({
        id: `row-${index}-${Date.now()}`,
        name,
        code,
        department,
        role,
        email,
        isValid,
        validationError: !isValid ? (isAr ? 'الاسم أو الكود ناقص' : 'Name or Code missing') : undefined,
      });
    });

    setParsedRows(rows);
    setHasParsed(true);
  };

  const decodeAndParse = (buffer: ArrayBuffer, encodingPreference: 'auto' | 'utf-8' | 'windows-1256') => {
    let text = '';
    const bytes = new Uint8Array(buffer);
    const arabicRegex = /[\u0600-\u06FF]/;

    // Check UTF-8 BOM
    const hasUtf8Bom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;

    if (encodingPreference === 'windows-1256') {
      try {
        text = new TextDecoder('windows-1256').decode(bytes);
      } catch {
        text = new TextDecoder('utf-8').decode(bytes);
      }
    } else if (encodingPreference === 'utf-8' || hasUtf8Bom) {
      const offset = hasUtf8Bom ? 3 : 0;
      text = new TextDecoder('utf-8').decode(bytes.subarray(offset));
    } else {
      // Auto-detection logic to solve question marks ??? and gibberish
      let winText = '';
      try {
        winText = new TextDecoder('windows-1256').decode(bytes);
      } catch {
        winText = '';
      }

      let utf8Text = '';
      let utf8Valid = true;
      try {
        utf8Text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      } catch {
        utf8Valid = false;
        utf8Text = new TextDecoder('utf-8').decode(bytes);
      }

      // If strict UTF-8 failed, definitely Windows-1256 Arabic
      if (!utf8Valid) {
        text = winText || utf8Text;
      } else if (arabicRegex.test(winText) && !arabicRegex.test(utf8Text)) {
        // Windows-1256 contains Arabic while UTF-8 contains Latin gibberish
        text = winText;
      } else if (utf8Text.includes('\uFFFD') || /\?{2,}/.test(utf8Text)) {
        // UTF-8 produced question marks or replacement characters
        text = winText || utf8Text;
      } else {
        text = utf8Text;
      }
    }

    parseCSVContent(text);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        setFileBuffer(buffer);
        decodeAndParse(buffer, activeEncoding);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleEncodingChange = (newEnc: 'auto' | 'utf-8' | 'windows-1256') => {
    setActiveEncoding(newEnc);
    if (fileBuffer) {
      decodeAndParse(fileBuffer, newEnc);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveRow = (id: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== id));
  };

  const handleConfirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const count = bulkImportEmployees(
      validRows.map(r => ({
        name: r.name,
        code: r.code,
        department: r.department,
        role: r.role,
        email: r.email,
      }))
    );

    setImportSuccessCount(count);
    setTimeout(() => {
      onSuccess(count);
      onClose();
    }, 1200);
  };

  const handleParseRawText = () => {
    parseCSVContent(rawText);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b1329] border border-amber-500/40 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#101b38] to-[#0b1329] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{isAr ? 'استيراد ورفع داتا الموظفين' : 'Import Employees & Staff Database'}</span>
                <span className="text-[10px] font-bold bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                  {isAr ? 'نموذج رسمي' : 'Template CSV'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'قم بتحميل القالب الجاهز وتعبئته ثم رفعه مباشرة أو لصق البيانات'
                  : 'Download official template, populate rows, and upload for one-click bulk import'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: DOWNLOAD OFFICIAL TEMPLATE BANNER */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white mb-0.5">
                  {isAr ? '1. تحميل نموذج ملف الموظفين المعتمد (Excel / CSV Template)' : '1. Download Official Employee CSV Template'}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isAr
                    ? 'ملف مهيأ بتنسيق UTF-8 يدعم الحروف العربية في Excel مباشرة. يتضمن الأعمدة: الاسم، الكود، الإدارة، الدور، والبريد.'
                    : 'Pre-configured UTF-8 CSV supporting Arabic characters in Excel with standard columns: Name, Code, Department, Role, Email.'}
                </p>
              </div>
            </div>

            <button
              onClick={downloadEmployeeTemplateCSV}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 flex-shrink-0 hover:scale-[1.02] active:scale-[0.98]"
              id="btn-download-csv-template"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{isAr ? 'تحميل قالب الإكسيل (CSV)' : 'Download Template'}</span>
            </button>
          </div>

          {/* STEP 2: MODE TOGGLE (UPLOAD FILE vs PASTE TEXT) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-amber-400" />
                <span>{isAr ? '2. اختيار طريقة الرفع' : '2. Choose Upload Method'}</span>
              </span>

              <div className="flex bg-slate-950 border border-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setImportMode('upload')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    importMode === 'upload' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'رفع ملف (File Upload)' : 'Upload File'}
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('paste')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    importMode === 'paste' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'لصق نصي مباشر (Raw Text)' : 'Paste Text'}
                </button>
              </div>
            </div>

            {importMode === 'upload' ? (
              <div className="space-y-3">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-800 hover:border-amber-500/50 bg-slate-950/60 hover:bg-slate-950'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  {selectedFileName ? (
                    <div>
                      <span className="text-xs font-bold text-amber-400 block mb-1">
                        {isAr ? 'الملف المحدد حالياً:' : 'Selected File:'} {selectedFileName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {isAr ? 'اضغط لتغيير الملف أو اسحب ملفاً جديداً هنا' : 'Click to choose another or drag a new one'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-white block mb-1">
                        {isAr ? 'اسحب وأفلت ملف CSV هنا، أو انقر للاختيار من جهازك' : 'Drag & drop CSV file here, or click to browse'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isAr ? 'يدعم قراءة الحروف العربية تلقائياً لمنع ظهور علامات الاستفهام (???)' : 'Auto-detects Arabic encoding to prevent ??? question marks'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Encoding switch controls to guarantee no ??? */}
                {selectedFileName && (
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isAr ? 'ترميز الحروف العربية:' : 'Arabic Encoding:'}</span>
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleEncodingChange('auto')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          activeEncoding === 'auto'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {isAr ? 'كشف تلقائي (مستحسن)' : 'Auto Detect'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEncodingChange('windows-1256')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          activeEncoding === 'windows-1256'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        Windows-1256 (Excel)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEncodingChange('utf-8')}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                          activeEncoding === 'utf-8'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        UTF-8
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-2.5 text-[11px] text-sky-300">
                  {isAr 
                    ? '💡 نصيحة: يمكنك تحديد الخلايا داخل برنامج Excel مباشرة ونسخها (Ctrl+C) ثم لصقها هنا (Ctrl+V) لضمان سلامة الأسماء العربية 100%!'
                    : '💡 Pro Tip: You can copy cells directly from Excel (Ctrl+C) and paste them here (Ctrl+V) for guaranteed Arabic clarity!'}
                </div>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  placeholder={isAr ? "الاسم\tالكود\tالادارة\tالدور\tالبريد" : "Name\tCode\tDepartment\tRole\tEmail"}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white font-mono outline-none leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleParseRawText}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
                  >
                    {isAr ? 'تحليل ومعاينة النص' : 'Parse & Preview'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: LIVE PREVIEW TABLE BEFORE IMPORT */}
          {hasParsed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isAr ? `معاينة السجلات الجاهزة للاستيراد (${parsedRows.length})` : `Parsed Records Preview (${parsedRows.length})`}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'يمكنك حذف أي سطر غير مرغوب فيه قبل الاعتماد' : 'Review and exclude any rows before final import'}
                </span>
              </div>

              {parsedRows.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center text-slate-400 text-xs">
                  {isAr ? 'لم يتم العثور على أي صفوف صالحة في الملف المرفوع' : 'No valid employee rows detected'}
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-xs text-right rtl:text-right ltr:text-left">
                    <thead className="bg-[#101830] text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                      <tr>
                        <th className="py-2.5 px-3">{isAr ? 'الاسم' : 'Name'}</th>
                        <th className="py-2.5 px-3">{isAr ? 'الكود' : 'Code'}</th>
                        <th className="py-2.5 px-3">{isAr ? 'الإدارة' : 'Department'}</th>
                        <th className="py-2.5 px-3">{isAr ? 'الدور' : 'Role'}</th>
                        <th className="py-2.5 px-3 text-center">{isAr ? 'حذف' : 'Remove'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {parsedRows.map(row => (
                        <tr key={row.id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-bold text-white">
                            <div>
                              <span>{row.name}</span>
                              {row.email && <span className="block text-[10px] text-slate-500 font-normal">{row.email}</span>}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-amber-400">
                            {row.code}
                          </td>
                          <td className="py-2 px-3 text-slate-300">
                            {row.department}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                row.role === 'admin'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : row.role === 'audit'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                              }`}
                            >
                              {row.role === 'admin'
                                ? (isAr ? 'أدمن' : 'Admin')
                                : row.role === 'audit'
                                ? (isAr ? 'أوديت' : 'Audit')
                                : (isAr ? 'موظف' : 'Employee')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {importSuccessCount !== null && (
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              <span>
                {isAr
                  ? `تم استيراد ${importSuccessCount} موظفاً بنجاح إلى قاعدة البيانات!`
                  : `Successfully imported ${importSuccessCount} employees!`}
              </span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#0a0f24] border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {parsedRows.length > 0 && (
              <span>
                {isAr
                  ? `جاهز لاعتماد (${parsedRows.filter(r => r.isValid).length}) موظف`
                  : `Ready to import ${parsedRows.filter(r => r.isValid).length} staff`}
              </span>
            )}
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="button"
              disabled={parsedRows.length === 0}
              onClick={handleConfirmImport}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 ${
                parsedRows.length > 0
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
              id="btn-confirm-bulk-import"
            >
              <Check className="w-4 h-4" />
              <span>
                {isAr
                  ? `اعتماد واستيراد (${parsedRows.filter(r => r.isValid).length}) موظفين`
                  : `Confirm & Import (${parsedRows.filter(r => r.isValid).length})`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
