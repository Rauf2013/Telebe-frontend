export type UserRole = 'moderator' | 'university' | 'student';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  whatsapp?: string;
  universityId?: string;
  createdAt: string;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface Faculty {
  id: string;
  key?: string;        // i18n key (örn. 'medicine', 'law')
  name: string;        // fallback Azerbaijani name
  tuitionFee?: number;
  language?: string;
}

export interface University {
  id: string;
  name: string;
  countryCode: string;
  city: string;
  faculties: Faculty[];
  logoUrl?: string;
}

export interface PlatformStats {
  universities: number;
  faculties: number;
  applications: number;
  accepted: number;
}

export type ApplicationStatus =
  | 'draft'
  | 'documents_uploaded'
  | 'first_payment_pending'
  | 'in_translation'
  | 'sent_to_university'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'second_payment_pending'
  | 'completed';

export interface FacultyChoice {
  universityId: string;
  facultyId: string;
  status: ApplicationStatus;
  tuitionFee?: number;
  notes?: string;
}

export interface Application {
  id: string;
  studentId: string;
  choices: FacultyChoice[];
  status: ApplicationStatus;
  documents: ApplicationDocument[];
  firstPaymentPaid: boolean;
  secondPaymentPaid: boolean;
  createdAt: string;
}

export interface ApplicationDocument {
  id: string;
  type: 'passport' | 'diploma' | 'transcript' | 'photo' | 'other';
  fileName: string;
  url: string;
  translatedUrl?: string;
  uploadedAt: string;
}
