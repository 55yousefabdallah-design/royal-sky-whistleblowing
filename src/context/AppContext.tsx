import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  PortalType,
  Language,
  Complaint,
  Employee,
  TransferRequest,
  Attachment,
  TimelineEvent,
} from '../types';
import {
  getStoredComplaints,
  saveStoredComplaints,
  getStoredEmployees,
  saveStoredEmployees,
  getStoredTransfers,
  saveStoredTransfers,
  resetAllDataToDefault,
} from '../data/mockData';

interface CurrentUserSession {
  role: UserRole;
  id?: string;
  name?: string;
  code?: string;
  department?: string;
  alias?: string;
  passcode?: string;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  currentPortal: PortalType;
  setCurrentPortal: (portal: PortalType) => void;
  currentUser: CurrentUserSession | null;
  setCurrentUser: (user: CurrentUserSession | null) => void;
  complaints: Complaint[];
  employees: Employee[];
  transferRequests: TransferRequest[];
  
  // Actions
  submitComplaint: (data: {
    alias: string;
    passcode: string;
    title: string;
    category: string;
    urgency: Complaint['urgency'];
    description: string;
    attachments: Attachment[];
  }) => Complaint;
  
  getVisitorTickets: (alias: string, passcode: string) => Complaint[];
  
  adminAssignComplaint: (complaintId: string, employeeId: string, assignmentNote?: string) => void;
  
  employeeUpdateCode: (employeeId: string, newCode: string) => boolean;
  
  employeeResolveComplaint: (
    complaintId: string,
    resolutionNotes: string,
    files: Attachment[]
  ) => void;

  visitorReopenComplaint: (
    complaintId: string,
    feedback: string,
    files?: Attachment[]
  ) => void;
  
  createTransferRequest: (
    complaintId: string,
    fromEmployeeId: string,
    toEmployeeId: string,
    reason: string
  ) => TransferRequest | null;
  
  respondTransferRequest: (requestId: string, accept: boolean) => void;
  
  addEmployee: (emp: Omit<Employee, 'id' | 'createdAt'>) => Employee;
  updateEmployee: (emp: Employee) => void;
  deleteEmployee: (id: string) => void;
  bulkImportEmployees: (list: Array<{ name: string; code: string; department: string; role: 'employee' | 'admin' | 'audit'; email?: string }>) => number;
  
  wipeData: () => void;
  resetData: () => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [currentPortal, setCurrentPortal] = useState<PortalType>('home');
  const [currentUser, setCurrentUser] = useState<CurrentUserSession | null>(null);
  
  const [complaints, setComplaints] = useState<Complaint[]>(getStoredComplaints);
  const [employees, setEmployees] = useState<Employee[]>(getStoredEmployees);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(getStoredTransfers);

  // Sync language with HTML dir and lang attributes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Sync to localStorage whenever state changes
  useEffect(() => {
    saveStoredComplaints(complaints);
  }, [complaints]);

  useEffect(() => {
    saveStoredEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveStoredTransfers(transferRequests);
  }, [transferRequests]);

  const submitComplaint = (data: {
    alias: string;
    passcode: string;
    title: string;
    category: string;
    urgency: Complaint['urgency'];
    description: string;
    attachments: Attachment[];
  }): Complaint => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `RSG-${new Date().getFullYear()}-${randomSuffix}`;
    const now = new Date().toISOString();

    const initialTimeline: TimelineEvent = {
      id: `t-${Date.now()}`,
      timestamp: now,
      title: language === 'ar' ? 'تم تسجيل البلاغ بسرية تامة' : 'Report Logged Anonymously',
      description: language === 'ar'
        ? `تم تسجيل البلاغ في نظام الامتثال بنجاح برقم تذكرة مشفر [${newId}] تحت هوية مجهولة.`
        : `Concern successfully registered in the compliance system with encrypted ticket [${newId}] under anonymous identity.`,
      actorRole: 'visitor',
      actorName: `${data.alias} (مجهول / Anonymous)`,
    };

    const newComplaint: Complaint = {
      id: newId,
      anonymousAlias: data.alias.trim(),
      anonymousPasscode: data.passcode.trim(),
      title: data.title.trim(),
      category: data.category,
      urgency: data.urgency,
      description: data.description.trim(),
      submittedAt: now,
      status: 'new',
      attachments: data.attachments || [],
      timeline: [initialTimeline],
    };

    setComplaints(prev => [newComplaint, ...prev]);
    return newComplaint;
  };

  const getVisitorTickets = (alias: string, passcode: string): Complaint[] => {
    const cleanAlias = alias.trim().toLowerCase();
    const cleanPass = passcode.trim();
    return complaints.filter(
      c =>
        c.anonymousAlias.trim().toLowerCase() === cleanAlias &&
        c.anonymousPasscode.trim() === cleanPass
    );
  };

  const adminAssignComplaint = (complaintId: string, employeeId: string, assignmentNote?: string) => {
    const targetEmp = employees.find(e => e.id === employeeId);
    if (!targetEmp) return;

    const now = new Date().toISOString();

    setComplaints(prev =>
      prev.map(c => {
        if (c.id !== complaintId) return c;

        const timelineEvent: TimelineEvent = {
          id: `t-${Date.now()}`,
          timestamp: now,
          title: language === 'ar' ? 'إسناد البلاغ للموظف المختص' : 'Complaint Assigned to Employee',
          description: assignmentNote
            ? (language === 'ar'
                ? `قام مدير الامتثال بإسناد الشكوى إلى [${targetEmp.name}]. ملاحظة: ${assignmentNote}`
                : `Assigned to [${targetEmp.name}] by Compliance Admin. Note: ${assignmentNote}`)
            : (language === 'ar'
                ? `قام مدير الامتثال بإسناد الشكوى إلى [${targetEmp.name}] للتحقيق والحل.`
                : `Assigned to [${targetEmp.name}] for investigation & resolution.`),
          actorRole: 'admin',
          actorName: currentUser?.name || (language === 'ar' ? 'مدير الامتثال' : 'Compliance Admin'),
        };

        return {
          ...c,
          status: 'assigned',
          assignedToEmployeeId: targetEmp.id,
          assignedToEmployeeName: targetEmp.name,
          assignedAt: now,
          timeline: [...c.timeline, timelineEvent],
        };
      })
    );
  };

  const employeeUpdateCode = (employeeId: string, newCode: string): boolean => {
    if (!newCode || newCode.trim().length < 3) return false;
    const cleanCode = newCode.trim();

    setEmployees(prev =>
      prev.map(e => (e.id === employeeId ? { ...e, code: cleanCode } : e))
    );

    if (currentUser && currentUser.id === employeeId) {
      setCurrentUser({ ...currentUser, code: cleanCode });
    }
    return true;
  };

  const employeeResolveComplaint = (
    complaintId: string,
    resolutionNotes: string,
    files: Attachment[]
  ) => {
    const now = new Date().toISOString();
    const resolverName = currentUser?.name || (language === 'ar' ? 'الموظف المسؤول' : 'Assigned Employee');

    setComplaints(prev =>
      prev.map(c => {
        if (c.id !== complaintId) return c;

        const timelineEvent: TimelineEvent = {
          id: `t-${Date.now()}`,
          timestamp: now,
          title: language === 'ar' ? 'تم حل الشكوى وإغلاق البلاغ' : 'Complaint Resolved & Closed',
          description: language === 'ar'
            ? `قام [${resolverName}] بتقديم الحل النهائي وإغلاق التذكرة.`
            : `Resolution provided and ticket closed by [${resolverName}].`,
          actorRole: 'employee',
          actorName: resolverName,
        };

        return {
          ...c,
          status: 'resolved',
          resolutionNotes: resolutionNotes.trim(),
          resolutionAttachments: files,
          resolvedAt: now,
          resolvedByEmployeeName: resolverName,
          timeline: [...c.timeline, timelineEvent],
        };
      })
    );
  };

  const visitorReopenComplaint = (
    complaintId: string,
    feedback: string,
    files: Attachment[] = []
  ) => {
    const now = new Date().toISOString();
    setComplaints(prev =>
      prev.map(c => {
        if (c.id !== complaintId) return c;

        const timelineEvent: TimelineEvent = {
          id: `t-${Date.now()}`,
          timestamp: now,
          title: language === 'ar' ? 'إعادة فتح البلاغ من مقدم الشكوى' : 'Complaint Reopened by Complainant',
          description: language === 'ar'
            ? `قام مقدم الشكوى بإعادة فتح التذكرة لعدم الرضا عن الحل. ملاحظات المشتكي: "${feedback.trim()}"`
            : `Complainant reopened ticket with feedback/objection: "${feedback.trim()}"`,
          actorRole: 'visitor',
          actorName: `${c.anonymousAlias} (${language === 'ar' ? 'مقدم الشكوى' : 'Complainant'})`,
        };

        const updatedAttachments = files && files.length > 0 ? [...c.attachments, ...files] : c.attachments;

        return {
          ...c,
          status: 'reopened',
          visitorFeedback: feedback.trim(),
          visitorFeedbackAt: now,
          reopenedCount: (c.reopenedCount || 0) + 1,
          attachments: updatedAttachments,
          timeline: [...c.timeline, timelineEvent],
        };
      })
    );
  };

  const createTransferRequest = (
    complaintId: string,
    fromEmployeeId: string,
    toEmployeeId: string,
    reason: string
  ): TransferRequest | null => {
    const complaint = complaints.find(c => c.id === complaintId);
    const fromEmp = employees.find(e => e.id === fromEmployeeId);
    const toEmp = employees.find(e => e.id === toEmployeeId);

    if (!complaint || !fromEmp || !toEmp) return null;

    const now = new Date().toISOString();
    const newTransfer: TransferRequest = {
      id: `tr-${Date.now()}`,
      complaintId,
      ticketNumber: complaint.id,
      complaintTitle: complaint.title,
      fromEmployeeId: fromEmp.id,
      fromEmployeeName: fromEmp.name,
      toEmployeeId: toEmp.id,
      toEmployeeName: toEmp.name,
      reason: reason.trim(),
      status: 'pending',
      createdAt: now,
    };

    // Add timeline record to complaint noting the pending transfer
    const timelineEvent: TimelineEvent = {
      id: `t-${Date.now()}`,
      timestamp: now,
      title: language === 'ar' ? 'طلب تحويل الشكوى إلى زميل' : 'Transfer Request Submitted',
      description: language === 'ar'
        ? `طلب الموظف [${fromEmp.name}] تحويل الشكوى إلى الزميل [${toEmp.name}]. السبب: ${reason.trim()} (في انتظار موافقة الزميل)`
        : `Transfer requested from [${fromEmp.name}] to [${toEmp.name}]. Reason: ${reason.trim()} (Pending Colleague Acceptance)`,
      actorRole: 'employee',
      actorName: fromEmp.name,
    };

    setComplaints(prev =>
      prev.map(c => (c.id === complaintId ? { ...c, timeline: [...c.timeline, timelineEvent] } : c))
    );

    setTransferRequests(prev => [newTransfer, ...prev]);
    return newTransfer;
  };

  const respondTransferRequest = (requestId: string, accept: boolean) => {
    const transfer = transferRequests.find(t => t.id === requestId);
    if (!transfer || transfer.status !== 'pending') return;

    const now = new Date().toISOString();

    // Update transfer request status
    setTransferRequests(prev =>
      prev.map(t =>
        t.id === requestId
          ? { ...t, status: accept ? 'accepted' : 'rejected', respondedAt: now }
          : t
      )
    );

    // If accepted, update the complaint assignment to the new colleague!
    setComplaints(prev =>
      prev.map(c => {
        if (c.id !== transfer.complaintId) return c;

        const timelineEvent: TimelineEvent = {
          id: `t-${Date.now()}`,
          timestamp: now,
          title: accept
            ? (language === 'ar' ? 'تم قبول تحويل الشكوى' : 'Transfer Accepted')
            : (language === 'ar' ? 'تم رفض تحويل الشكوى' : 'Transfer Rejected'),
          description: accept
            ? (language === 'ar'
                ? `وافق الزميل [${transfer.toEmployeeName}] على استلام الشكوى ونقلت إلى عهدته بالكامل.`
                : `[${transfer.toEmployeeName}] accepted the transfer and assumed ownership of the complaint.`)
            : (language === 'ar'
                ? `اعتذر الزميل [${transfer.toEmployeeName}] عن قبول التحويل وبقيت الشكوى في عهدة [${transfer.fromEmployeeName}].`
                : `[${transfer.toEmployeeName}] declined the transfer; ticket remains with [${transfer.fromEmployeeName}].`),
          actorRole: 'employee',
          actorName: transfer.toEmployeeName,
        };

        if (accept) {
          return {
            ...c,
            assignedToEmployeeId: transfer.toEmployeeId,
            assignedToEmployeeName: transfer.toEmployeeName,
            timeline: [...c.timeline, timelineEvent],
          };
        } else {
          return {
            ...c,
            timeline: [...c.timeline, timelineEvent],
          };
        }
      })
    );
  };

  const addEmployee = (empData: Omit<Employee, 'id' | 'createdAt'>): Employee => {
    const newEmp: Employee = {
      ...empData,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setEmployees(prev => [...prev, newEmp]);
    return newEmp;
  };

  const updateEmployee = (emp: Employee) => {
    setEmployees(prev => prev.map(e => (e.id === emp.id ? emp : e)));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const bulkImportEmployees = (
    list: Array<{ name: string; code: string; department: string; role: 'employee' | 'admin' | 'audit'; email?: string }>
  ): number => {
    const created: Employee[] = list.map((item, idx) => ({
      id: `emp-bulk-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      code: item.code,
      department: item.department,
      role: item.role,
      email: item.email || '',
      createdAt: new Date().toISOString(),
    }));

    setEmployees(prev => [...prev, ...created]);
    return created.length;
  };

  const wipeData = () => {
    resetAllDataToDefault();
    setComplaints([]);
    setEmployees(getStoredEmployees());
    setTransferRequests([]);
    setCurrentUser(null);
    setCurrentPortal('home');
  };

  const resetData = () => {
    resetAllDataToDefault();
    setComplaints(getStoredComplaints());
    setEmployees(getStoredEmployees());
    setTransferRequests(getStoredTransfers());
    setCurrentUser(null);
    setCurrentPortal('home');
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentPortal('home');
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        currentPortal,
        setCurrentPortal,
        currentUser,
        setCurrentUser,
        complaints,
        employees,
        transferRequests,
        submitComplaint,
        getVisitorTickets,
        adminAssignComplaint,
        employeeUpdateCode,
        employeeResolveComplaint,
        visitorReopenComplaint,
        createTransferRequest,
        respondTransferRequest,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        bulkImportEmployees,
        wipeData,
        resetData,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
