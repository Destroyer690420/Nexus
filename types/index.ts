export type UserRole = "student" | "faculty" | "admin";

export interface UserData {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: number;
  approved?: boolean;
}

export type ResourceType = "notes" | "pyqs" | "assignments" | "labManuals" | "others";

export interface Contribution {
  id: string;
  type: ResourceType;
  title: string;
  description?: string;
  courseId: string;
  branchId?: string | null;
  semesterId: number;
  subjectId?: string;
  unit?: number;
  fileUrl?: string;
  tags?: string[];
  contributedBy: string;
  contributorName?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  approvedBy?: string;
  approvedAt?: number;
  rejectReason?: string;
}

export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description?: string;
  courseId: string;
  branchId?: string | null;
  semesterId: number;
  subjectId?: string;
  unit?: number;
  fileUrl?: string;
  tags?: string[];
  createdBy: string;
  createdAt: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  hasBranches: boolean;
  semesters: number[];
}

export interface Branch {
  id: string;
  courseId: string;
  name: string;
  code: string;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  branchId?: string | null;
  semesterId: number;
  subjectId: string;
  fileUrl?: string;
  dueDate: number;
  maxMarks?: number | null;
  allowLate: boolean;
  createdBy: string;
  createdAt: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentEmail?: string;
  fileUrl?: string;
  status: "pending" | "submitted" | "late";
  submittedAt?: number | null;
  grade?: string | null;
  feedback?: string;
  gradedBy?: string | null;
  gradedAt?: number | null;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: number;
  targetRole: "all" | "student" | "faculty";
  pinned: boolean;
}
