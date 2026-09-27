import { Employee, Complaint, TransferRequest } from '../types';

export const MASTER_ADMIN_EMPLOYEE: Employee = {
  id: 'emp-admin',
  name: 'مدير الامتثال والحوكمة',
  code: 'ADM-100',
  department: 'إدارة الامتثال والمخاطر',
  role: 'admin',
  email: 'compliance@royalsky.com',
  createdAt: '2026-01-01T00:00:00Z',
};

// Initial state is clean & wiped as requested by the user
export const INITIAL_EMPLOYEES: Employee[] = [
  MASTER_ADMIN_EMPLOYEE,
];

export const INITIAL_COMPLAINTS: Complaint[] = [];

export const INITIAL_TRANSFERS: TransferRequest[] = [];

export const DEPARTMENTS = [
  'الشؤون المالية والمحاسبة',
  'الموارد البشرية والإدارية',
  'العمليات وسلاسل الإمداد',
  'إدارة الامتثال والمخاطر',
  'الشؤون القانونية',
  'تقنية المعلومات والأمن السيبراني',
  'خدمة العملاء والجودة',
  'المشتريات والعقود',
  'الصحة والسلامة المهنية',
  'أخرى'
];

export const DEPARTMENTS_EN: Record<string, string> = {
  'الشؤون المالية والمحاسبة': 'Finance & Accounting',
  'الموارد البشرية والإدارية': 'Human Resources & Admin',
  'العمليات وسلاسل الإمداد': 'Operations & Supply Chain',
  'إدارة الامتثال والمخاطر': 'Compliance & Risk Management',
  'الشؤون القانونية': 'Legal Affairs',
  'تقنية المعلومات والأمن السيبراني': 'IT & Cybersecurity',
  'خدمة العملاء والجودة': 'Customer Service & Quality',
  'المشتريات والعقود': 'Procurement & Contracts',
  'الصحة والسلامة المهنية': 'Occupational Health & Safety',
  'أخرى': 'Other'
};

const STORAGE_KEY_COMPLAINTS = 'rsg_complaints_clean_v2';
const STORAGE_KEY_EMPLOYEES = 'rsg_employees_clean_v2';
const STORAGE_KEY_TRANSFERS = 'rsg_transfers_clean_v2';

export function getStoredComplaints(): Complaint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPLAINTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(INITIAL_COMPLAINTS));
      return INITIAL_COMPLAINTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading complaints from localStorage', e);
    return INITIAL_COMPLAINTS;
  }
}

export function saveStoredComplaints(complaints: Complaint[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify(complaints));
  } catch (e) {
    console.error('Error saving complaints', e);
  }
}

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading employees from localStorage', e);
    return INITIAL_EMPLOYEES;
  }
}

export function saveStoredEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error('Error saving employees', e);
  }
}

export function getStoredTransfers(): TransferRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSFERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
      return INITIAL_TRANSFERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading transfers from localStorage', e);
    return INITIAL_TRANSFERS;
  }
}

export function saveStoredTransfers(transfers: TransferRequest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify(transfers));
  } catch (e) {
    console.error('Error saving transfers', e);
  }
}

export function resetAllDataToDefault(): void {
  localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify([MASTER_ADMIN_EMPLOYEE]));
  localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify([]));
}

export function wipeAllStoredData(): void {
  localStorage.setItem(STORAGE_KEY_COMPLAINTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify([MASTER_ADMIN_EMPLOYEE]));
  localStorage.setItem(STORAGE_KEY_TRANSFERS, JSON.stringify([]));
}

/**
 * Generates an official CSV template with UTF-8 BOM so Excel opens Arabic correctly
 */
export function downloadEmployeeTemplateCSV(): void {
  const csvHeader = 'الاسم,الكود_الوظيفي,الادارة,الدور,البريد_الالكتروني\n';
  const sampleRows = [
    'م. محمد الشناوي,EMP-101,الشؤون المالية والمحاسبة,employee,m.shinawy@royalsky.com',
    'أ. فاطمة الزهراء,EMP-102,الموارد البشرية والإدارية,employee,fatima.z@royalsky.com',
    'م. طارق العوضي,EMP-103,العمليات وسلاسل الإمداد,employee,tarek.a@royalsky.com',
    'أ. سارة المنصوري,AUD-200,المراجعة والتدقيق الداخلي,audit,sara.audit@royalsky.com',
    'م. عبد الرحمن النجار,EMP-104,تقنية المعلومات والأمن السيبراني,employee,a.najjar@royalsky.com'
  ].join('\n');

  const content = '\uFEFF' + csvHeader + sampleRows;
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Royal_Sky_Employees_Import_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
