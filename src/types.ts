export type UserRole = 'visitor' | 'admin' | 'employee' | 'audit';

export type PortalType = 'home' | 'visitor' | 'admin' | 'employee' | 'audit';

export type Language = 'ar' | 'en';

export type ComplaintStatus = 'new' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'reopened';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  actorRole: UserRole;
  actorName: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
  dataUrl?: string; // base64 encoded data URI for real preview and download
  contentPreview?: string; // text excerpt for fast preview
  uploadedAt: string;
}

export interface Complaint {
  id: string; // Ticket number, e.g. RSG-2026-8942
  anonymousAlias: string; // Fake name chosen by visitor
  anonymousPasscode: string; // Fake passcode chosen by visitor
  title: string;
  category: string; // Department/Type
  urgency: UrgencyLevel;
  description: string;
  submittedAt: string;
  status: ComplaintStatus;
  
  // Assignment
  assignedToEmployeeId?: string;
  assignedToEmployeeName?: string;
  assignedAt?: string;
  
  // Attachments
  attachments: Attachment[];
  
  // Timeline audit history
  timeline: TimelineEvent[];
  
  // Solution / Resolution by employee or admin
  resolutionNotes?: string;
  resolutionAttachments?: Attachment[];
  resolvedAt?: string;
  resolvedByEmployeeName?: string;

  // Complainant Feedback / Reopen Feature
  visitorFeedback?: string;
  visitorFeedbackAt?: string;
  visitorFeedbackAttachments?: Attachment[];
  isReopened?: boolean;
  reopenedCount?: number;
}

export interface Employee {
  id: string;
  name: string;
  code: string;
  department: string;
  role: 'employee' | 'admin' | 'audit';
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface TransferRequest {
  id: string;
  complaintId: string;
  ticketNumber: string;
  complaintTitle: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  respondedAt?: string;
}
