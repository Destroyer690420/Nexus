export type UserRole = "student" | "faculty" | "admin";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  createdAt: number;
  approved?: boolean;
}

export type ResourceType = "notes" | "pyqs" | "assignments" | "lab_manuals" | "others";

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
  year?: number;
  fileUrl?: string;
  fileId?: string | null;
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
  year?: number;
  fileUrl?: string;
  fileId?: string | null;
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: number;
  targetRole: "all" | "student" | "faculty";
  pinned: boolean;
  courseId?: string | null;
  semesterId?: number | null;
}

export interface StudentProfile {
  uid: string;
  courseId: string;
  branchId: string | null;
  semesterId: number;
  createdAt: number;
}
